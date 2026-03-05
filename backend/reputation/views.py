from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserBadge, ReputationScore
from .serializers import UserBadgeSerializer


class MyBadgesView(APIView):
    """Get current user's earned badges."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        badges = UserBadge.objects.filter(user=request.user).select_related('badge')
        serializer = UserBadgeSerializer(badges, many=True)
        
        # Include basic stats (not internal scores)
        try:
            rep = request.user.reputation
            stats = {
                'total_posts': rep.total_posts,
                'total_engagement': rep.total_engagement,
            }
        except ReputationScore.DoesNotExist:
            stats = {'total_posts': 0, 'total_engagement': 0}
        
        return Response({
            'badges': serializer.data,
            'stats': stats,
        })


class AuthorBadgesView(APIView):
    """Get badges for a specific user (for display on posts). No identity exposed."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        badges = UserBadge.objects.filter(user_id=user_id).select_related('badge')[:3]
        return Response({
            'badges': [
                {'type': b.badge.badge_type, 'icon': b.badge.icon, 'name': b.badge.display_name}
                for b in badges
            ]
        })
