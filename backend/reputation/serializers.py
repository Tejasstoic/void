from rest_framework import serializers
from .models import Badge, UserBadge, ReputationScore


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['badge_type', 'display_name', 'description', 'icon']


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ['badge', 'earned_at']


class ReputationSummarySerializer(serializers.Serializer):
    """Public-facing summary (no internal scores exposed)."""
    badges = UserBadgeSerializer(many=True, read_only=True)
    total_posts = serializers.IntegerField()
    total_engagement = serializers.IntegerField()
