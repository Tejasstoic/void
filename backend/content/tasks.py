from celery import shared_task
from django.utils import timezone
from content.models import Post

@shared_task
def cleanup_ephemeral_posts():
    """Delete posts that have reached their expiration time."""
    now = timezone.now()
    expired_posts = Post.objects.filter(expires_at__lte=now)
    count = expired_posts.count()
    
    # Hard delete for true anonymity/privacy
    expired_posts.delete()
    
    return f"Cleaned up {count} ephemeral posts."
