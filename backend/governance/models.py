from django.db import models
from django.conf import settings
import uuid

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_records', blank=True)
    action_type = models.CharField(max_length=50) # e.g. 'STRIKE_ISSUED', 'BAN_ISSUED', 'POST_DELETED'
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} by {self.admin_user} at {self.created_at}"
