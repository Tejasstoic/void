from rest_framework import serializers
from content.serializers import PostSerializer


class RankedPostSerializer(PostSerializer):
    """Extends PostSerializer with ranking metadata."""
    ranking_score = serializers.FloatField(read_only=True, required=False)
    trending_category = serializers.CharField(read_only=True, required=False)
    author_badges = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['ranking_score', 'trending_category', 'author_badges']

    def get_author_badges(self, obj):
        from reputation.models import UserBadge
        badges = UserBadge.objects.filter(user=obj.author).select_related('badge')[:3]
        return [
            {'type': b.badge.badge_type, 'icon': b.badge.icon, 'name': b.badge.display_name}
            for b in badges
        ]
