from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from content.serializers import PostSerializer
from .engine import get_personalized_feed


class PersonalizedFeedView(APIView):
    """Personalized feed endpoint replacing chronological feed."""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 15))
        restricted = request.query_params.get('restricted', 'false').lower() == 'true'

        if not request.user.is_authenticated:
            # Anonymous users get basic feed
            from content.models import Post
            posts = Post.objects.filter(
                is_deleted=False,
                moderation_status=Post.ModerationStatus.SAFE
            ).order_by('-created_at')[:page_size]
            serializer = PostSerializer(posts, many=True)
            return Response({
                'results': serializer.data,
                'page': page,
                'has_next': len(serializer.data) == page_size,
            })

        posts = get_personalized_feed(
            user=request.user,
            restricted=restricted,
            page=page,
            page_size=page_size
        )

        serializer = PostSerializer(posts, many=True)

        return Response({
            'results': serializer.data,
            'page': page,
            'has_next': len(posts) == page_size,
        })
