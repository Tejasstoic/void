from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from content.models import Post, Report
from .models import AuditLog
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
