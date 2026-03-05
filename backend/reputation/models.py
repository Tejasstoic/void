from django.db import models
from django.conf import settings
import uuid


class Badge(models.Model):
    """Badge definitions for anonymous status display."""
    
    class BadgeType(models.TextChoices):
        DEEP_THINKER = 'DEEP_THINKER', '🧠 Deep Thinker'
        CHAOS_SPARK = 'CHAOS_SPARK', '🔥 Chaos Spark'
        MIDNIGHT_CONFESSOR = 'MIDNIGHT_CONFESSOR', '🌙 Midnight Confessor'
        DEBATE_MAGNET = 'DEBATE_MAGNET', '⚡ Debate Magnet'
        ECHO_MAKER = 'ECHO_MAKER', '🔊 Echo Maker'
        SHADOW_SAGE = 'SHADOW_SAGE', '👁️ Shadow Sage'
        PULSE_STARTER = 'PULSE_STARTER', '💫 Pulse Starter'
        VOID_WALKER = 'VOID_WALKER', '🌀 Void Walker'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    badge_type = models.CharField(max_length=25, choices=BadgeType.choices, unique=True)
    display_name = models.CharField(max_length=50)
    description = models.TextField()
    icon = models.CharField(max_length=10)  # Emoji
    
    # Thresholds for earning
    min_reputation_score = models.FloatField(default=0.0)
    min_posts = models.IntegerField(default=0)
    min_engagement_generated = models.IntegerField(default=0)
    requires_restricted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.icon} {self.display_name}"


class ReputationScore(models.Model):
    """Hidden internal reputation score per user."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reputation')
    
    # Component scores (0.0 - 100.0)
    post_quality_score = models.FloatField(default=50.0)
    report_avoidance_score = models.FloatField(default=100.0)  # Starts high, decreases with reports
    engagement_generated = models.FloatField(default=0.0)
    positive_reaction_ratio = models.FloatField(default=0.5)  # hearts+upvotes / total reactions received
    
    # Composite
    composite_score = models.FloatField(default=50.0)
    
    # Stats
    total_posts = models.IntegerField(default=0)
    total_reactions_received = models.IntegerField(default=0)
    total_reports_against = models.IntegerField(default=0)
    total_engagement = models.IntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-composite_score']


class UserBadge(models.Model):
    """M2M linking users to earned badges."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='holders')
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-earned_at']
