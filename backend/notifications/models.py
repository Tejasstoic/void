from django.db import models
from django.conf import settings
import uuid


class Notification(models.Model):
    """User notification with type-based routing."""
    
    class NotificationType(models.TextChoices):
        REPLY = 'REPLY', 'Someone replied to your thought'
        TRENDING = 'TRENDING', 'Your post is trending'
        MILESTONE = 'MILESTONE', 'Engagement milestone reached'
        RESTRICTED_SPIKE = 'RESTRICTED_SPIKE', 'Activity spike in Restricted Zone'
        BADGE_EARNED = 'BADGE_EARNED', 'New badge earned'
        MOMENTUM = 'MOMENTUM', 'Post gaining momentum'
        DISCUSSION = 'DISCUSSION', 'Your thought sparked discussions'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=500)
    
    # Optional reference to the source
    post = models.ForeignKey('content.Post', on_delete=models.CASCADE, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title}"


class NotificationPreference(models.Model):
    """Per-user notification settings and frequency caps."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_prefs')
    
    # Toggles
    replies_enabled = models.BooleanField(default=True)
    trending_enabled = models.BooleanField(default=True)
    milestones_enabled = models.BooleanField(default=True)
    restricted_spikes_enabled = models.BooleanField(default=True)
    badges_enabled = models.BooleanField(default=True)
    momentum_enabled = models.BooleanField(default=True)
    discussion_enabled = models.BooleanField(default=True)
    daily_reflection_enabled = models.BooleanField(default=False)
    
    # Frequency caps
    max_notifications_per_hour = models.IntegerField(default=10)
    max_notifications_per_day = models.IntegerField(default=50)
    quiet_hours_start = models.IntegerField(default=23)  # 11 PM
    quiet_hours_end = models.IntegerField(default=7)  # 7 AM
    
    updated_at = models.DateTimeField(auto_now=True)
