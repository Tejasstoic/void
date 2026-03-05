from django.db import models
import uuid


class TrendingSnapshot(models.Model):
    """Periodic snapshot of trending posts by category."""
    
    class TrendingCategory(models.TextChoices):
        TRENDING_NOW = 'TRENDING_NOW', '🔥 Trending Now'
        DARK_RISING = 'DARK_RISING', '🌑 Dark Rising'
        MOST_DISCUSSED = 'MOST_DISCUSSED', '💬 Most Discussed'
        RAPID_GROWTH = 'RAPID_GROWTH', '⚡ Rapid Growth'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey('content.Post', on_delete=models.CASCADE, related_name='trending_entries')
    category = models.CharField(max_length=20, choices=TrendingCategory.choices)
    velocity_score = models.FloatField(default=0.0)
    rank_position = models.IntegerField(default=0)
    snapshot_time = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # Only latest snapshot is active

    class Meta:
        ordering = ['rank_position']
        indexes = [
            models.Index(fields=['category', 'is_active', 'rank_position']),
        ]


class EngagementVelocity(models.Model):
    """Tracks engagement acceleration per post over time windows."""
    post = models.OneToOneField('content.Post', on_delete=models.CASCADE, related_name='velocity')
    
    # Reactions in time windows
    reactions_1h = models.IntegerField(default=0)
    reactions_6h = models.IntegerField(default=0)
    reactions_24h = models.IntegerField(default=0)
    
    # Comments in time windows
    comments_1h = models.IntegerField(default=0)
    comments_6h = models.IntegerField(default=0)
    comments_24h = models.IntegerField(default=0)
    
    # Acceleration (rate of change)
    acceleration_score = models.FloatField(default=0.0)
    
    # Reaction diversity (number of unique reaction types)
    reaction_type_count = models.IntegerField(default=0)
    
    # Comment depth (max thread depth)
    max_comment_depth = models.IntegerField(default=0)
    
    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-acceleration_score']
