from django.db import models
from django.conf import settings
import uuid

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=1500)
    
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

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
