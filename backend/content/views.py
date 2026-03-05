from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Post, Comment, Reaction, Report, Bookmark
from .serializers import PostSerializer, CommentSerializer, ReactionSerializer, ReportSerializer, BookmarkSerializer
from django.db.models import Q
from django.utils import timezone

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_deleted=False)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()
        
        # Base filter: not deleted and not expired
        qs = super().get_queryset().filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )
        
        # Check if user wants restricted content via query param
        restricted_mode = self.request.query_params.get('restricted', 'false').lower() == 'true'
        
        # Anonymous users only see SAFE content
        if not user.is_authenticated:
            qs = qs.filter(moderation_status=Post.ModerationStatus.SAFE)
        elif user.role != 'admin':
            # Users see SAFE posts in general feed
            # Users see MATURE posts only if they are 18+ AND restricted_mode is ON
            if user.is_18_plus and restricted_mode:
                qs = qs.filter(moderation_status__in=[Post.ModerationStatus.SAFE, Post.ModerationStatus.MATURE])
            else:
                qs = qs.filter(moderation_status=Post.ModerationStatus.SAFE)

        # Geographic Privacy Filtering
        # If a post has a geo_privacy_radius, user must be within that radius
        user_lat = self.request.query_params.get('lat')
        user_lng = self.request.query_params.get('lng')

        if user_lat and user_lng:
            try:
                lat = float(user_lat)
                lng = float(user_lng)
                
                # We want to exclude posts where user is OUTSIDE the radius.
                # Since complex geo-queries in SQLite are hard, we'll use a bounding box approach 
                # for the initial filter and then narrow down if needed, 
                # or just simple logic for the simulated MVP.
                
                # Logic: For posts with geo_privacy_radius, check distance.
                # For posts without, show them.
                
                # To be efficient in SQL:
                # 1 degree lat ~ 111km
                # 1 degree lng ~ 111km * cos(lat)
                
                # However, since this is a simulated platform, we will implement 
                # a simpler check: If a post HAS a radius, and user provided NO lat/lng, hide it.
                # If user provided lat/lng, we calculate a bounding box.
                
                # Simplified SQL approximation for "Local Only":
                # We filter out all posts that have a radius and the user is clearly outside.
                
                # Posts without radius are public.
                public_posts = qs.filter(geo_privacy_radius__isnull=True)
                
                # Posts with radius where user IS inside.
                # 1 degree is roughly 111km.
                # So if radius is R, lat diff must be < R/111.
                local_posts = qs.filter(geo_privacy_radius__isnull=False)
                
                # This is a bit complex for a single queryset in SQLite without custom functions.
                # We'll fetch all posts and filter in Python for the "simulated" effect 
                # if the results aren't too many, or just implement the bounding box.
                
                # Let's do a bounding box filter for safety.
                # (abs(lat - geo_lat) < radius/111) AND (abs(lng - geo_lng) < radius/111)
                # This is a square bounding box.
                
                # Actually, filtering a large queryset in memory is fine for MVP.
                posts = list(qs)
                from math import radians, cos, sin, asin, sqrt

                def haversine(lon1, lat1, lon2, lat2):
                    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
                    dlon = lon2 - lon1 
                    dlat = lat2 - lat1 
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a)) 
                    r = 6371 
                    return c * r

                filtered_ids = []
                for p in posts:
                    if not p.geo_privacy_radius:
                        filtered_ids.append(p.id)
                    elif p.geo_latitude and p.geo_longitude:
                        dist = haversine(lng, lat, p.geo_longitude, p.geo_latitude)
                        if dist <= p.geo_privacy_radius:
                            filtered_ids.append(p.id)
                
                return Post.objects.filter(id__in=filtered_ids)

            except (ValueError, TypeError):
                # Fallback: only show public posts if lat/lng invalid
                return qs.filter(geo_privacy_radius__isnull=True)
        else:
            # No location provided: hide all location-restricted posts
            return qs.filter(geo_privacy_radius__isnull=True)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        post = self.get_object()
        reaction_type = request.data.get('reaction_type')
            
        reaction, created = Reaction.objects.update_or_create(
            post=post, user=request.user,
            defaults={'reaction_type': reaction_type}
        )
        
        return Response({"status": "reaction set", "reaction": reaction_type})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

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
        return Bookmark.objects.filter(user=self.request.user)
