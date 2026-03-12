from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import ModerationQueue, ModerationAction
from .serializers import ModerationQueueSerializer, ModerationActionSerializer
from content.models import Post
from governance.models import AuditLog


class IsSentinelOrAdmin(IsAuthenticated):
    """Only allow admins or moderators (sentinels)."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ('admin', 'mod')


class ModerationQueueListView(APIView):
    """GET /api/moderation/queue/ — List flagged content for review."""
    permission_classes = [IsSentinelOrAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status', 'PENDING')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        qs = ModerationQueue.objects.select_related('post', 'post__author', 'assigned_to')
        if status_filter != 'ALL':
            qs = qs.filter(status=status_filter)

        total = qs.count()
        items = qs[(page - 1) * page_size:page * page_size]
        serializer = ModerationQueueSerializer(items, many=True)

        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'has_next': (page * page_size) < total,
        })


class ModerationActionView(APIView):
    """POST /api/moderation/action/ — Take action on flagged content."""
    permission_classes = [IsSentinelOrAdmin]

    def post(self, request):
        queue_id = request.data.get('queue_item_id')
        action_taken = request.data.get('action')
        new_status = request.data.get('new_status', '')
        notes = request.data.get('notes', '')

        if not queue_id or not action_taken:
            return Response({'error': 'queue_item_id and action are required'}, status=status.HTTP_400_BAD_REQUEST)

        queue_item = get_object_or_404(ModerationQueue, id=queue_id)

        # Create action record
        action = ModerationAction.objects.create(
            queue_item=queue_item,
            moderator=request.user,
            action_taken=action_taken,
            new_status=new_status,
            notes=notes
        )

        # Apply action
        if action_taken == 'APPROVE':
            queue_item.status = ModerationQueue.QueueStatus.REVIEWED
            queue_item.post.moderation_status = Post.ModerationStatus.SAFE
            queue_item.post.save()
        elif action_taken == 'REMOVE':
            queue_item.status = ModerationQueue.QueueStatus.ACTIONED
            queue_item.post.is_deleted = True
            queue_item.post.save()
        elif action_taken == 'RECLASSIFY' and new_status:
            queue_item.status = ModerationQueue.QueueStatus.REVIEWED
            queue_item.post.moderation_status = new_status
            queue_item.post.save()
        elif action_taken == 'ESCALATE':
            queue_item.status = ModerationQueue.QueueStatus.UNDER_REVIEW
            queue_item.priority += 1

        queue_item.resolved_at = timezone.now()
        queue_item.save()

        # Audit log
        AuditLog.objects.create(
            admin_user=request.user,
            target_user=queue_item.post.author,
            action_type=f'MODERATION_{action_taken}',
            reason=notes or f'{action_taken} on post {queue_item.post.id}'
        )

        return Response({
            'message': f'Action {action_taken} applied successfully.',
            'action': ModerationActionSerializer(action).data
        })


class ModerationStatsView(APIView):
    """GET /api/moderation/stats/ — Queue stats for dashboard."""
    permission_classes = [IsSentinelOrAdmin]

    def get(self, request):
        from django.db.models import Count
        stats = ModerationQueue.objects.values('status').annotate(count=Count('id'))
        return Response({
            'stats': {s['status']: s['count'] for s in stats},
            'total': ModerationQueue.objects.count()
        })
