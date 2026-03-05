from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'body', 'post',
                  'is_read', 'created_at']
        read_only_fields = ['id', 'notification_type', 'title', 'body',
                           'post', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['replies_enabled', 'trending_enabled', 'milestones_enabled',
                  'restricted_spikes_enabled', 'badges_enabled',
                  'momentum_enabled', 'discussion_enabled',
                  'daily_reflection_enabled',
                  'max_notifications_per_hour', 'max_notifications_per_day',
                  'quiet_hours_start', 'quiet_hours_end']
