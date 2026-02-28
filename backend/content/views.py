from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Post, Comment, Reaction, Report
from .serializers import PostSerializer, CommentSerializer, ReactionSerializer, ReportSerializer
from django.db.models import Q

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_deleted=False)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # Admins see everything not deleted
        if user.role == 'admin':
            return qs
            
        # Users see SAFE posts in general feed
        # Users see MATURE posts only if they are 18+
        if user.is_18_plus:
            return qs.filter(moderation_status__in=[Post.ModerationStatus.SAFE, Post.ModerationStatus.MATURE])
        else:
            return qs.filter(moderation_status=Post.ModerationStatus.SAFE)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        post = self.get_object()
        reaction_type = request.data.get('reaction_type')
        
        if not reaction_type:
            return Response({"error": "reaction_type is required"}, status=status.HTTP_400_BAD_REQUEST)
            
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
