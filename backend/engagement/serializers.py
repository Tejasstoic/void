from rest_framework import serializers
from .models import UserSession, PostImpression, ScrollDepthEvent, DailyUsageSummary


class SessionStartSerializer(serializers.Serializer):
    is_restricted = serializers.BooleanField(default=False)


class SessionEndSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()


class ImpressionSerializer(serializers.Serializer):
    post_id = serializers.UUIDField()
    dwell_time_ms = serializers.IntegerField(min_value=0, max_value=300000)


class ScrollDepthSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    max_depth_percent = serializers.FloatField(min_value=0, max_value=100)
    posts_scrolled_past = serializers.IntegerField(min_value=0)


class DailyUsageSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyUsageSummary
        fields = ['date', 'total_minutes', 'session_count', 'posts_viewed',
                  'posts_created', 'reactions_given', 'comments_made',
                  'restricted_minutes', 'nudge_shown']
        read_only_fields = fields


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ['id', 'started_at', 'ended_at', 'duration_seconds',
                  'pages_visited', 'posts_viewed', 'reactions_given',
                  'is_restricted_session']
        read_only_fields = fields
