from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Post
from moderation.tasks import evaluate_post_toxicity

@receiver(post_save, sender=Post)
def trigger_moderation_on_post_create(sender, instance, created, **kwargs):
    if created and instance.moderation_status == Post.ModerationStatus.PENDING:
        # Async delay the moderation task
        evaluate_post_toxicity.delay(instance.id)
