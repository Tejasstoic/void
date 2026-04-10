from rest_framework import serializers
from .models import ModerationQueue, ModerationAction


class ModerationQueueSerializer(serializers.ModelSerializer):
    post_content = serializers.CharField(source='post.content', read_only=True)
    post_author_alias = serializers.CharField(source='post.author.alias', read_only=True)
    post_id = serializers.UUIDField(source='post.id', read_only=True)
    assigned_to_alias = serializers.CharField(source='assigned_to.alias', read_only=True, default=None)

    class Meta:
        model = ModerationQueue
        fields = [
            'id', 'post_id', 'post_content', 'post_author_alias',
            'reason', 'ai_scores', 'status', 'assigned_to_alias',
            'priority', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at']


class ModerationActionSerializer(serializers.ModelSerializer):
    moderator_alias = serializers.CharField(source='moderator.alias', read_only=True)

    class Meta:
        model = ModerationAction
        fields = ['id', 'queue_item', 'moderator_alias', 'action_taken', 'new_status', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']
