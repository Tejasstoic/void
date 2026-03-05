from django.db import models
from django.conf import settings
import uuid

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_records', blank=True)
    action_type = models.CharField(max_length=50) # e.g. 'STRIKE_ISSUED', 'BAN_ISSUED', 'POST_DELETED', 'GOVERNANCE_DECISION'
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} by {self.admin_user} at {self.created_at}"


class Proposal(models.Model):
    """Community-driven moderation proposal."""
    
    class ProposalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Waiting for Consensus'
        PASSED = 'PASSED', 'Action Taken'
        REJECTED = 'REJECTED', 'No Action Taken'
        EXPIRED = 'EXPIRED', 'Timed Out'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_post = models.ForeignKey('content.Post', on_delete=models.CASCADE, related_name='mod_proposals')
    proposer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    reason = models.TextField()
    status = models.CharField(max_length=15, choices=ProposalStatus.choices, default=ProposalStatus.PENDING)
    
    # Decisions (what users are voting for)
    safe_weight = models.FloatField(default=0.0)
    mature_weight = models.FloatField(default=0.0)
    prohibited_weight = models.FloatField(default=0.0)
    
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Proposal for {self.target_post.id} ({self.status})"


class Vote(models.Model):
    """Reputation-weighted vote on a moderation proposal."""
    
    class Choice(models.TextChoices):
        SAFE = 'SAFE', 'Keep Safe'
        MATURE = 'MATURE', 'Mark Mature'
        PROHIBITED = 'PROHIBITED', 'Mark Prohibited'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    choice = models.CharField(max_length=15, choices=Choice.choices)
    weight = models.FloatField() # Snapshot of user reputation at vote time
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('proposal', 'user')
        ordering = ['-created_at']
