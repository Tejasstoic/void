from django.db import models
from django.conf import settings
import uuid


class ModerationQueue(models.Model):
    """Queue of content flagged for moderation review."""

    class QueueStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        REVIEWED = 'REVIEWED', 'Reviewed'
        ACTIONED = 'ACTIONED', 'Action Taken'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey('content.Post', on_delete=models.CASCADE, related_name='moderation_entries')
    reason = models.TextField()
    ai_scores = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=15, choices=QueueStatus.choices, default=QueueStatus.PENDING)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_moderation'
    )
    priority = models.IntegerField(default=0)  # Higher = more urgent
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['status', '-priority', '-created_at']),
        ]

    def __str__(self):
        return f"Moderation: {self.post.id} ({self.status})"


class ModerationAction(models.Model):
    """Record of action taken on a moderation queue item."""

    class ActionType(models.TextChoices):
        APPROVE = 'APPROVE', 'Approved'
        REMOVE = 'REMOVE', 'Removed'
        ESCALATE = 'ESCALATE', 'Escalated'
        RECLASSIFY = 'RECLASSIFY', 'Reclassified'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    queue_item = models.ForeignKey(ModerationQueue, on_delete=models.CASCADE, related_name='actions')
    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='moderation_actions')
    action_taken = models.CharField(max_length=15, choices=ActionType.choices)
    new_status = models.CharField(max_length=15, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_taken} by {self.moderator.alias} on {self.queue_item.post.id}"
