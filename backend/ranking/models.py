from django.db import models
from django.conf import settings
import uuid


class UserFeedPreference(models.Model):
    """Learned user preferences for feed personalization."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feed_preference')
    
    # Content affinity scores (0.0 - 1.0)
    prefers_restricted = models.FloatField(default=0.0)
    prefers_long_content = models.FloatField(default=0.5)
    prefers_polls = models.FloatField(default=0.5)
    prefers_controversial = models.FloatField(default=0.5)  # High comment-to-reaction ratio
    
    # Reaction pattern weights
    reaction_similarity_vector = models.JSONField(default=dict, blank=True)
    # e.g. {"upvote": 0.3, "heart": 0.5, "fire": 0.2}
    
    # Engagement clusters
    avg_dwell_time_ms = models.IntegerField(default=0)
    avg_session_duration_min = models.IntegerField(default=0)
    preferred_time_of_day = models.IntegerField(default=12)  # Hour 0-23
    
    # Cold start flag
    is_cold_start = models.BooleanField(default=True)
    interactions_count = models.IntegerField(default=0)  # Once > 20, no longer cold start
    
    updated_at = models.DateTimeField(auto_now=True)


class PostRankingScore(models.Model):
    """Cached ranking score for a post, recalculated periodically."""
    post = models.OneToOneField('content.Post', on_delete=models.CASCADE, related_name='ranking')
    
    # Component scores (0.0 - 1.0)
    engagement_score = models.FloatField(default=0.0)
    recency_score = models.FloatField(default=1.0)
    comment_depth_score = models.FloatField(default=0.0)
    dwell_time_score = models.FloatField(default=0.0)
    reaction_diversity_score = models.FloatField(default=0.0)
    
    # Penalties
    report_penalty = models.FloatField(default=0.0)  # Reduces score
    
    # Final composite score
    composite_score = models.FloatField(default=0.0, db_index=True)
    
    # For restricted zone separate ranking
    restricted_composite_score = models.FloatField(default=0.0, db_index=True)
    
    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-composite_score']
