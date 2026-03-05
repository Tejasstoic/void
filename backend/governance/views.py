from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from content.models import Post, Report
from .models import AuditLog, Proposal, Vote
from .serializers import AuditLogSerializer, ProposalSerializer, VoteSerializer
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
        
        # Simple breakdown
        status_counts = Post.objects.values('moderation_status').annotate(count=Count('moderation_status'))
        status_data = {item['moderation_status']: item['count'] for item in status_counts}
        
        return Response({
            'total_users': total_users,
            'total_posts': total_posts,
            'pending_reports': pending_reports,
            'status_distribution': status_data
        })

class IssueStrikeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
            
        reason = request.data.get('reason', 'Violation of platform rules.')
        
        target_user.strike_count += 1
        
        if target_user.strike_count >= 3:
            target_user.is_suspended = True
            target_user.is_active = False # Hard ban for MVP
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

class ProposalViewSet(viewsets.ModelViewSet):
    """Viewset for community moderation proposals."""
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Set expiration to 24 hours from now
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        serializer.save(proposer=self.request.user, expires_at=expires_at)

class VoteView(APIView):
    """View to cast a reputation-weighted vote."""
    permission_classes = [IsAuthenticated]

    def post(self, request, proposal_id):
        proposal = get_object_or_404(Proposal, id=proposal_id)
        
        if proposal.status != Proposal.ProposalStatus.PENDING:
            return Response({"error": "Proposal is already resolved or expired."}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() >= proposal.expires_at:
            evaluate_and_resolve_proposal(proposal.id)
            return Response({"error": "Proposal has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate weight
        weight = calculate_vote_weight(request.user)
        choice = request.data.get('choice')
        
        if choice not in ['SAFE', 'MATURE', 'PROHIBITED']:
            return Response({"error": "Invalid choice."}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update vote
        vote, created = Vote.objects.update_or_create(
            proposal=proposal,
            user=request.user,
            defaults={'choice': choice, 'weight': weight}
        )

        # Update proposal totals (This is a simplified aggregation, in production use F() expressions or summary tables)
        self._update_proposal_weights(proposal)
        
        # Check for immediate consensus
        evaluate_and_resolve_proposal(proposal.id)

        return Response({
            "message": "Vote cast successfully.",
            "weight": weight,
            "choice": choice
        })

    def _update_proposal_weights(self, proposal):
        from django.db.models import Sum
        weights = Vote.objects.filter(proposal=proposal).values('choice').annotate(total_weight=Sum('weight'))
        
        # Reset
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
