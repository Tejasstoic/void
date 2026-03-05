from django.db import models
from django.conf import settings
import uuid


class UserSession(models.Model):
    """Tracks individual user sessions for engagement analytics."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    pages_visited = models.IntegerField(default=0)
    posts_viewed = models.IntegerField(default=0)
    reactions_given = models.IntegerField(default=0)
    is_restricted_session = models.BooleanField(default=False)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
        ]


class PostImpression(models.Model):
    """Records when a user sees a post in their feed."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='impressions')
    post = models.ForeignKey('content.Post', on_delete=models.CASCADE, related_name='impressions')
    dwell_time_ms = models.IntegerField(default=0)  # How long the post was visible
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]


class ScrollDepthEvent(models.Model):
    """Tracks how far users scroll in the feed per session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(UserSession, on_delete=models.CASCADE, related_name='scroll_events')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    max_depth_percent = models.FloatField(default=0)  # 0-100
    posts_scrolled_past = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class DailyUsageSummary(models.Model):
    """Aggregated daily usage for healthy-usage nudges and analytics."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_usage')
    date = models.DateField()
    total_minutes = models.IntegerField(default=0)
    session_count = models.IntegerField(default=0)
    posts_viewed = models.IntegerField(default=0)
    posts_created = models.IntegerField(default=0)
    reactions_given = models.IntegerField(default=0)
    comments_made = models.IntegerField(default=0)
    restricted_minutes = models.IntegerField(default=0)
    nudge_shown = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']
