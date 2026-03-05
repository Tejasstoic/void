from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from content.serializers import PostSerializer
from .models import TrendingSnapshot


class TrendingView(APIView):
    """All trending categories in a single response."""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        categories = {}
        for category in TrendingSnapshot.TrendingCategory.choices:
            code = category[0]
            label = category[1]
            snapshots = TrendingSnapshot.objects.filter(
                category=code, is_active=True
            ).select_related('post')[:10]
            
            posts = [s.post for s in snapshots]
            categories[code] = {
                'label': label,
                'posts': PostSerializer(posts, many=True).data,
                'scores': [s.velocity_score for s in snapshots],
            }
        
        return Response(categories)


class TrendingCategoryView(APIView):
    """Single trending category endpoint."""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, category):
        category = category.upper()
        valid = [c[0] for c in TrendingSnapshot.TrendingCategory.choices]
        if category not in valid:
            return Response({'error': 'Invalid category'}, status=400)

        snapshots = TrendingSnapshot.objects.filter(
            category=category, is_active=True
        ).select_related('post')[:10]

        posts = [s.post for s in snapshots]
        return Response({
            'category': category,
            'posts': PostSerializer(posts, many=True).data,
            'scores': [s.velocity_score for s in snapshots],
        })
