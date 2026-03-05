from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from datetime import date

from .models import UserSession, PostImpression, ScrollDepthEvent, DailyUsageSummary
from .serializers import (
    SessionStartSerializer, SessionEndSerializer,
    ImpressionSerializer, ScrollDepthSerializer,
    DailyUsageSummarySerializer
)


class SessionStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SessionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = UserSession.objects.create(
            user=request.user,
            is_restricted_session=serializer.validated_data.get('is_restricted', False)
        )

        # Update user last active
        request.user.last_active_at = timezone.now()
        request.user.save(update_fields=['last_active_at'])

        return Response({
            'session_id': str(session.id),
            'started_at': session.started_at.isoformat()
        }, status=status.HTTP_201_CREATED)


class SessionEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SessionEndSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            session = UserSession.objects.get(
                id=serializer.validated_data['session_id'],
                user=request.user
            )
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        session.ended_at = timezone.now()
        session.duration_seconds = int(
            (session.ended_at - session.started_at).total_seconds()
        )
        session.save()

        # Update daily usage summary
        today = date.today()
        summary, _ = DailyUsageSummary.objects.get_or_create(
            user=request.user, date=today
        )
        summary.total_minutes += session.duration_seconds // 60
        summary.session_count += 1
        summary.posts_viewed += session.posts_viewed
        summary.reactions_given += session.reactions_given
        if session.is_restricted_session:
            summary.restricted_minutes += session.duration_seconds // 60
        summary.save()

        return Response({'status': 'session ended', 'duration': session.duration_seconds})


class ImpressionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ImpressionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from content.models import Post
        try:
            post = Post.objects.get(id=serializer.validated_data['post_id'])
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        PostImpression.objects.create(
            user=request.user,
            post=post,
            dwell_time_ms=serializer.validated_data['dwell_time_ms']
        )

        # Increment view count
        Post.objects.filter(id=post.id).update(
            view_count=models.F('view_count') + 1
        )

        return Response({'status': 'recorded'}, status=status.HTTP_201_CREATED)


class ScrollDepthView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ScrollDepthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            session = UserSession.objects.get(
                id=serializer.validated_data['session_id'],
                user=request.user
            )
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        ScrollDepthEvent.objects.create(
            session=session,
            user=request.user,
            max_depth_percent=serializer.validated_data['max_depth_percent'],
            posts_scrolled_past=serializer.validated_data['posts_scrolled_past']
        )

        return Response({'status': 'recorded'}, status=status.HTTP_201_CREATED)


class UsageView(APIView):
    """Get usage data for healthy-usage nudges."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        summary, _ = DailyUsageSummary.objects.get_or_create(
            user=request.user, date=today
        )
        serializer = DailyUsageSummarySerializer(summary)
        
        # Check if nudge should be shown (60+ minutes)
        should_nudge = summary.total_minutes >= 60 and not summary.nudge_shown
        
        return Response({
            'usage': serializer.data,
            'should_nudge': should_nudge,
        })

    def post(self, request):
        """Mark nudge as shown."""
        today = date.today()
        DailyUsageSummary.objects.filter(
            user=request.user, date=today
        ).update(nudge_shown=True)
        return Response({'status': 'nudge acknowledged'})
