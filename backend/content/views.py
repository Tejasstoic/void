from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import Post, Comment, Reaction, Report, Bookmark, Hashtag, PulseTag, PulseView, ConfessionRoom, ConfessionRoomMember
from .serializers import (
    PostSerializer, CommentSerializer, ReactionSerializer,
    ReportSerializer, BookmarkSerializer, HashtagSerializer,
    ConfessionRoomSerializer
)
from django.db.models import Q, Count
from django.utils import timezone
import hashlib


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_deleted=False)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        post = serializer.save(author=self.request.user)
        # Extract and create hashtags from content
        self._process_hashtags(post)

    def _process_hashtags(self, post):
        """Extract #hashtags from content and create PulseTag entries."""
        import re
        tags = set(re.findall(r'#(\w+)', post.content))
        for tag_name in tags:
            tag_name = tag_name.lower()[:100]
            hashtag, _ = Hashtag.objects.get_or_create(name=tag_name)
            PulseTag.objects.get_or_create(post=post, hashtag=hashtag)
            hashtag.post_count = hashtag.tagged_posts.count()
            hashtag.save()

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        qs = super().get_queryset().filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )

        restricted_mode = self.request.query_params.get('restricted', 'false').lower() == 'true'

        if not user.is_authenticated:
            qs = qs.filter(moderation_status=Post.ModerationStatus.SAFE)
        elif user.role != 'admin':
            if user.is_18_plus and restricted_mode:
                qs = qs.filter(moderation_status__in=[Post.ModerationStatus.SAFE, Post.ModerationStatus.MATURE])
            else:
                qs = qs.filter(moderation_status=Post.ModerationStatus.SAFE)

        # Room filtering
        room_id = self.request.query_params.get('room')
        if room_id:
            room_posts = PulseTag.objects.filter(hashtag__name=room_id).values_list('post_id', flat=True)
            qs = qs.filter(id__in=room_posts)

        return qs.filter(geo_privacy_radius__isnull=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        post = self.get_object()
        reaction_type = request.data.get('reaction_type')

        reaction, created = Reaction.objects.update_or_create(
            post=post, user=request.user,
            defaults={'reaction_type': reaction_type}
        )

        return Response({"status": "reaction set", "reaction": reaction_type})

    @action(detail=True, methods=['post'], url_path='bookmark')
    def toggle_bookmark(self, request, pk=None):
        """POST /api/content/posts/{id}/bookmark/ — Toggle bookmark."""
        post = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(post=post, user=request.user)
        if not created:
            bookmark.delete()
            return Response({"status": "removed", "is_bookmarked": False})
        return Response({"status": "added", "is_bookmarked": True})

    @action(detail=True, methods=['post'], url_path='report')
    def report_post(self, request, pk=None):
        """POST /api/content/posts/{id}/report/ — Report a post."""
        post = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response({"error": "Reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        report, created = Report.objects.get_or_create(
            post=post, reporter=request.user,
            defaults={'reason': reason}
        )
        if not created:
            return Response({"error": "You already reported this post."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "reported"}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='view')
    def record_view(self, request, pk=None):
        """POST /api/content/posts/{id}/view/ — Record a view."""
        post = self.get_object()
        ip = request.META.get('REMOTE_ADDR', '')
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:32]

        if request.user.is_authenticated:
            if not PulseView.objects.filter(post=post, user=request.user).exists():
                PulseView.objects.create(post=post, user=request.user, ip_hash=ip_hash)
                post.view_count += 1
                post.save(update_fields=['view_count'])
        else:
            if not PulseView.objects.filter(post=post, ip_hash=ip_hash).exists():
                PulseView.objects.create(post=post, ip_hash=ip_hash)
                post.view_count += 1
                post.save(update_fields=['view_count'])

        return Response({"view_count": post.view_count})


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        post_id = self.request.query_params.get('post')
        if post_id:
            qs = qs.filter(post_id=post_id, parent__isnull=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related('post', 'post__author')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class MyPulsesView(APIView):
    """GET /api/content/my-pulses/ — Current user's pulse history."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        posts = Post.objects.filter(
            author=request.user, is_deleted=False
        ).order_by('-created_at')

        total = posts.count()
        posts = posts[(page - 1) * page_size:page * page_size]
        serializer = PostSerializer(posts, many=True, context={'request': request})

        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'has_next': (page * page_size) < total,
        })


class SearchView(APIView):
    """GET /api/content/search/?q= — Search posts and hashtags."""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({'posts': [], 'hashtags': []})

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Search posts by content
        posts = Post.objects.filter(
            is_deleted=False,
            moderation_status=Post.ModerationStatus.SAFE,
            content__icontains=query
        ).order_by('-created_at')[(page - 1) * page_size:page * page_size]

        # Search hashtags
        hashtags = Hashtag.objects.filter(
            name__icontains=query
        ).order_by('-post_count')[:10]

        return Response({
            'posts': PostSerializer(posts, many=True, context={'request': request}).data,
            'hashtags': HashtagSerializer(hashtags, many=True).data,
        })


class DiscoverView(APIView):
    """GET /api/content/discover/ — Curated discovery feed."""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        # Trending posts (most engaged in last 24h)
        yesterday = timezone.now() - timezone.timedelta(hours=24)
        trending = Post.objects.filter(
            is_deleted=False,
            moderation_status=Post.ModerationStatus.SAFE,
            created_at__gte=yesterday
        ).annotate(
            total_reactions=Count('reactions'),
            total_comments=Count('comments')
        ).order_by('-total_reactions', '-total_comments')[:10]

        # Top hashtags
        top_hashtags = Hashtag.objects.order_by('-post_count')[:15]

        # Recent diverse posts
        recent = Post.objects.filter(
            is_deleted=False,
            moderation_status=Post.ModerationStatus.SAFE
        ).order_by('-created_at')[:20]

        # Confession rooms
        rooms = ConfessionRoom.objects.filter(is_active=True)[:10]

        return Response({
            'trending': PostSerializer(trending, many=True, context={'request': request}).data,
            'hashtags': HashtagSerializer(top_hashtags, many=True).data,
            'recent': PostSerializer(recent, many=True, context={'request': request}).data,
            'rooms': ConfessionRoomSerializer(rooms, many=True).data,
        })


class HashtagPostsView(APIView):
    """GET /api/content/hashtags/{name}/ — Posts by hashtag."""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, name):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        post_ids = PulseTag.objects.filter(
            hashtag__name=name.lower()
        ).values_list('post_id', flat=True)

        posts = Post.objects.filter(
            id__in=post_ids, is_deleted=False,
            moderation_status=Post.ModerationStatus.SAFE
        ).order_by('-created_at')[(page - 1) * page_size:page * page_size]

        return Response({
            'hashtag': name,
            'posts': PostSerializer(posts, many=True, context={'request': request}).data,
        })


class ConfessionRoomViewSet(viewsets.ModelViewSet):
    """CRUD for confession rooms."""
    queryset = ConfessionRoom.objects.filter(is_active=True)
    serializer_class = ConfessionRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='join')
    def join_room(self, request, pk=None):
        room = self.get_object()
        _, created = ConfessionRoomMember.objects.get_or_create(room=room, user=request.user)
        if created:
            room.member_count += 1
            room.save(update_fields=['member_count'])
        return Response({"status": "joined", "member_count": room.member_count})

    @action(detail=True, methods=['post'], url_path='leave')
    def leave_room(self, request, pk=None):
        room = self.get_object()
        deleted, _ = ConfessionRoomMember.objects.filter(room=room, user=request.user).delete()
        if deleted:
            room.member_count = max(0, room.member_count - 1)
            room.save(update_fields=['member_count'])
        return Response({"status": "left", "member_count": room.member_count})
