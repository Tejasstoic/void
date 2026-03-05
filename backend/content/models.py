from django.db import models
from django.conf import settings
import uuid

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=5000)  # Increased for confessions
    
    # Content type for format expansion
    class ContentType(models.TextChoices):
        TEXT_BURST = 'TEXT_BURST', 'Short Text Burst'
        CONFESSION = 'CONFESSION', 'Long Confession'
        POLL = 'POLL', 'Anonymous Poll'
    
    content_type = models.CharField(
        max_length=12,
        choices=ContentType.choices,
        default=ContentType.TEXT_BURST
    )
    
    # Moderation layer
    is_deleted = models.BooleanField(default=False)
    
    class ModerationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending AI Review'
        SAFE = 'SAFE', 'Safe (General Feed)'
        MATURE = 'MATURE', 'Mature (Restricted Zone)'
        PROHIBITED = 'PROHIBITED', 'Prohibited (Blocked)'
        
    moderation_status = models.CharField(
        max_length=15, 
        choices=ModerationStatus.choices, 
        default=ModerationStatus.PENDING
    )
    
    # AI Scores (Populated by Celery)
    toxicity_score = models.FloatField(null=True, blank=True)
    hate_score = models.FloatField(null=True, blank=True)
    violence_score = models.FloatField(null=True, blank=True)
    self_harm_score = models.FloatField(null=True, blank=True)

    # Engagement metrics (cached, updated by workers)
    view_count = models.IntegerField(default=0)
    engagement_score = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Advanced Privacy (Phase 3B)
    expires_at = models.DateTimeField(null=True, blank=True) # Self-destructing post
    is_ephemeral = models.BooleanField(default=False)
    
    # Geographic Anonymity
    geo_latitude = models.FloatField(null=True, blank=True)
    geo_longitude = models.FloatField(null=True, blank=True)
    geo_privacy_radius = models.FloatField(null=True, blank=True) # km radius for "local only" viewing
    
    # Advanced Anonymity (Simulated ZK-Proofs)
    is_zk_verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['moderation_status', '-created_at']),
            models.Index(fields=['-engagement_score']),
        ]

    def __str__(self):
        return f"{self.author.alias or 'Anon'} - {self.id}"

class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField(max_length=500)
    
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']

class Reaction(models.Model):
    REACTION_TYPES = (
        ('upvote', 'Upvote'),
        ('downvote', 'Downvote'),
        ('heart', 'Heart'),
        ('fire', 'Fire'),
        ('mindblown', 'Mind Blown'),
        ('sad', 'Sad'),
        ('laugh', 'Laugh'),
    )
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

class Report(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Bookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarks')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.alias or 'Anon'} bookmarked {self.post.id}"

class Poll(models.Model):
    """Anonymous poll attached to a POLL-type post."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='poll')
    question = models.CharField(max_length=300)
    allows_multiple = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class PollOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=100)
    vote_count = models.IntegerField(default=0)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class PollVote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('option', 'user')
