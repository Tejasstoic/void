from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from content.models import Post, Report
from .models import AuditLog, Proposal, Vote, Strike
from .serializers import AuditLogSerializer, ProposalSerializer, VoteSerializer, StrikeSerializer
from .logic import calculate_vote_weight, evaluate_and_resolve_proposal
from rest_framework import viewsets, status
from django.shortcuts import get_object_or_404
from content.serializers import PostSerializer
from django.db.models import Count
from django.utils import timezone
import datetime

User = get_user_model()

class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_posts = Post.objects.count()
        pending_reports = Report.objects.filter(is_resolved=False).count()
        active_users_24h = User.objects.filter(
            last_active_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()

        status_counts = Post.objects.values('moderation_status').annotate(count=Count('moderation_status'))
        status_data = {item['moderation_status']: item['count'] for item in status_counts}

        # Recent strikes
        recent_strikes = Strike.objects.all()[:10]

        return Response({
            'total_users': total_users,
            'total_posts': total_posts,
            'pending_reports': pending_reports,
            'active_users_24h': active_users_24h,
            'status_distribution': status_data,
            'recent_strikes': StrikeSerializer(recent_strikes, many=True).data,
        })

class IssueStrikeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        reason = request.data.get('reason', 'Violation of platform rules.')
        post_id = request.data.get('post_id')

        # Create strike record
        strike = Strike.objects.create(
            user=target_user,
            issued_by=request.user,
            reason=reason,
            post_id=post_id
        )

        target_user.strike_count += 1

        if target_user.strike_count >= 3:
            target_user.is_suspended = True
            target_user.is_active = False
            action_type = 'AUTO_BAN_3_STRIKES'
        else:
            action_type = 'STRIKE_ISSUED'

        target_user.save()

        AuditLog.objects.create(
            admin_user=request.user,
            target_user=target_user,
            action_type=action_type,
            reason=reason
        )

        return Response({
            "message": "Strike issued successfully.",
            "current_strikes": target_user.strike_count,
            "is_suspended": target_user.is_suspended
        })

class ModerationQueueView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        pending_posts = Post.objects.filter(moderation_status='PENDING')
        serializer = PostSerializer(pending_posts, many=True, context={'request': request})
        return Response(serializer.data)

class AdminAuditLogView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        logs = AuditLog.objects.all()[:50]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)

class StrikeHistoryView(APIView):
    """GET /api/governance/strikes/{user_id}/ — Strike history for a user."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        strikes = Strike.objects.filter(user_id=user_id)
        return Response({
            'user_id': str(user_id),
            'strikes': StrikeSerializer(strikes, many=True).data,
            'total': strikes.count()
        })

class PublicGovernanceLogView(APIView):
    """GET /api/governance/public-logs/ — Sanitized public governance logs."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        logs = AuditLog.objects.filter(
            action_type__in=['GOVERNANCE_DECISION', 'STRIKE_ISSUED', 'AUTO_BAN_3_STRIKES']
        ).order_by('-created_at')

        total = logs.count()
        logs = logs[(page - 1) * page_size:page * page_size]

        # Sanitize: remove admin identity
        sanitized = []
        for log in logs:
            sanitized.append({
                'id': str(log.id),
                'action_type': log.action_type,
                'reason': log.reason,
                'created_at': log.created_at.isoformat(),
            })

        return Response({
            'results': sanitized,
            'total': total,
            'page': page,
            'has_next': (page * page_size) < total,
        })

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        serializer.save(proposer=self.request.user, expires_at=expires_at)

class VoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, proposal_id):
        proposal = get_object_or_404(Proposal, id=proposal_id)

        if proposal.status != Proposal.ProposalStatus.PENDING:
            return Response({"error": "Proposal is already resolved or expired."}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() >= proposal.expires_at:
            evaluate_and_resolve_proposal(proposal.id)
            return Response({"error": "Proposal has expired."}, status=status.HTTP_400_BAD_REQUEST)

        weight = calculate_vote_weight(request.user)
        choice = request.data.get('choice')

        if choice not in ['SAFE', 'MATURE', 'PROHIBITED']:
            return Response({"error": "Invalid choice."}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = Vote.objects.update_or_create(
            proposal=proposal,
            user=request.user,
            defaults={'choice': choice, 'weight': weight}
        )

        self._update_proposal_weights(proposal)
        evaluate_and_resolve_proposal(proposal.id)

        return Response({
            "message": "Vote cast successfully.",
            "weight": weight,
            "choice": choice
        })

    def _update_proposal_weights(self, proposal):
        from django.db.models import Sum
        weights = Vote.objects.filter(proposal=proposal).values('choice').annotate(total_weight=Sum('weight'))

        proposal.safe_weight = 0
        proposal.mature_weight = 0
        proposal.prohibited_weight = 0

        for w in weights:
            if w['choice'] == 'SAFE':
                proposal.safe_weight = w['total_weight']
            elif w['choice'] == 'MATURE':
                proposal.mature_weight = w['total_weight']
            elif w['choice'] == 'PROHIBITED':
                proposal.prohibited_weight = w['total_weight']

        proposal.save()
