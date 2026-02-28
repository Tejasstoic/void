from rest_framework import serializers
from .models import Post, Comment, Reaction, Report

class CommentSerializer(serializers.ModelSerializer):
    author_email = serializers.ReadOnlyField(source='author.email')
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'post', 'author', 'author_email', 'parent', 'content', 'created_at', 'replies')
        read_only_fields = ('id', 'author', 'created_at')

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

class PostSerializer(serializers.ModelSerializer):
    author_email = serializers.ReadOnlyField(source='author.email')
    reaction_counts = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            'id', 'author', 'author_email', 'content', 
            'moderation_status', 'toxicity_score', 
            'reaction_counts', 'comment_count', 'user_reaction',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'author', 'moderation_status', 
            'toxicity_score', 'created_at', 'updated_at'
        )

    def get_reaction_counts(self, obj):
        counts = {}
        for r_type, _ in Reaction.REACTION_TYPES:
            counts[r_type] = obj.reactions.filter(reaction_type=r_type).count()
        return counts

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            if reaction:
                return reaction.reaction_type
        return None

class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ('id', 'post', 'user', 'reaction_type', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('id', 'post', 'reporter', 'reason', 'is_resolved', 'created_at')
        read_only_fields = ('id', 'reporter', 'created_at', 'is_resolved')
