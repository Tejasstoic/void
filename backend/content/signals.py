from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Post
from moderation.tasks import evaluate_post_toxicity

@receiver(post_save, sender=Post)
def trigger_moderation_on_post_create(sender, instance, created, **kwargs):
    if created and instance.moderation_status == Post.ModerationStatus.PENDING:
        # Use on_commit to ensure the post is in the DB before the task runs
        # (Crucial for both async workers and eager execution)
        transaction.on_commit(
            lambda: evaluate_post_toxicity.delay(instance.id)
        )
