from rest_framework import serializers
from django.db import models
from .models import Post, Comment, Reaction, Report, Bookmark, Poll, PollOption, PollVote

class CommentSerializer(serializers.ModelSerializer):
    author_alias = serializers.ReadOnlyField(source='author.alias')
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'post', 'author_alias', 'parent', 'content', 'created_at', 'replies')
        read_only_fields = ('id', 'created_at')

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = ['id', 'post', 'created_at']
        read_only_fields = ['id', 'created_at']

class PollOptionSerializer(serializers.ModelSerializer):
    vote_percentage = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'text', 'vote_count', 'order', 'vote_percentage']
        read_only_fields = ['id', 'vote_count']

    def get_vote_percentage(self, obj):
        total = sum(opt.vote_count for opt in obj.poll.options.all())
        if total == 0:
            return 0
        return round((obj.vote_count / total) * 100, 1)

class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    user_voted = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ['id', 'question', 'allows_multiple', 'expires_at', 'options', 'total_votes', 'user_voted']

    def get_total_votes(self, obj):
        return sum(opt.vote_count for opt in obj.options.all())

    def get_user_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PollVote.objects.filter(
                option__poll=obj, user=request.user
            ).exists()
        return False

class PostSerializer(serializers.ModelSerializer):
    author_alias = serializers.ReadOnlyField(source='author.alias')
    author_id = serializers.ReadOnlyField(source='author.id')
    reaction_counts = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)
    user_reaction = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    author_badges = serializers.SerializerMethodField()
    poll = PollSerializer(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'author_alias', 'author_id', 'content', 'content_type',
            'moderation_status', 'toxicity_score',
            'view_count', 'engagement_score',
            'reaction_counts', 'comment_count',
            'user_reaction', 'is_bookmarked', 'author_badges',
            'poll', 'expires_at', 'is_ephemeral', 
            'geo_privacy_radius', 'is_zk_verified', 'created_at'
        ]
        read_only_fields = ['id', 'moderation_status', 'toxicity_score',
                           'view_count', 'engagement_score', 'created_at']

    def get_reaction_counts(self, obj):
        counts = {rt: 0 for rt, _ in Reaction.REACTION_TYPES}
        for rt in obj.reactions.values('reaction_type').annotate(count=models.Count('id')):
            counts[rt['reaction_type']] = rt['count']
        return counts

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            return reaction.reaction_type if reaction else None
        return None

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_author_badges(self, obj):
        try:
            from reputation.models import UserBadge
            badges = UserBadge.objects.filter(user=obj.author).select_related('badge')[:3]
            return [
                {'type': b.badge.badge_type, 'icon': b.badge.icon, 'name': b.badge.display_name}
                for b in badges
            ]
        except Exception:
            return []

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

