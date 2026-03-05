from celery import shared_task


@shared_task
def create_engagement_notifications():
    """
    Check for engagement milestones and create notifications.
    Runs periodically to detect:
    - Posts gaining momentum
    - Trending posts
    - Discussion milestones
    """
    from content.models import Post
    from notifications.models import Notification, NotificationPreference
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count
    
    # Find posts from last 6 hours with sudden engagement
    cutoff = timezone.now() - timedelta(hours=6)
    
    recent_posts = Post.objects.filter(
        is_deleted=False,
        created_at__gte=cutoff
    ).exclude(
        moderation_status=Post.ModerationStatus.PROHIBITED
    ).annotate(
        reaction_count=Count('reactions'),
        comment_count=Count('comments')
    )
    
    for post in recent_posts:
        total_engagement = post.reaction_count + post.comment_count
        
        # Momentum notification (10+ engagements)
        if total_engagement >= 10:
            _create_notification_if_allowed(
                user=post.author,
                notification_type=Notification.NotificationType.MOMENTUM,
                title='Your post is gaining momentum! 🚀',
                body=f'Your thought has {total_engagement} reactions and comments.',
                post=post,
                pref_field='momentum_enabled'
            )
        
        # Discussion milestone (5+ comments)
        if post.comment_count >= 5:
            _create_notification_if_allowed(
                user=post.author,
                notification_type=Notification.NotificationType.DISCUSSION,
                title=f'Your thought sparked {post.comment_count} discussions 💬',
                body='People are actively discussing your anonymous thought.',
                post=post,
                pref_field='discussion_enabled'
            )
    
    return {'status': 'notifications created'}


@shared_task
def notify_reply(post_id, comment_content_preview):
    """Create a reply notification for the post author."""
    from content.models import Post
    from notifications.models import Notification
    
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return
    
    _create_notification_if_allowed(
        user=post.author,
        notification_type=Notification.NotificationType.REPLY,
        title='Someone replied to your anonymous thought',
        body=comment_content_preview[:100],
        post=post,
        pref_field='replies_enabled'
    )


def _create_notification_if_allowed(user, notification_type, title, body, post=None, pref_field=None):
    """Create notification respecting user preferences and frequency caps."""
    from notifications.models import Notification, NotificationPreference
    from django.utils import timezone
    from datetime import timedelta
    
    # Check preference
    try:
        prefs = user.notification_prefs
        if pref_field and not getattr(prefs, pref_field, True):
            return None
        
        # Check frequency caps
        now = timezone.now()
        
        # Hourly cap
        hour_ago = now - timedelta(hours=1)
        hourly_count = Notification.objects.filter(
            user=user, created_at__gte=hour_ago
        ).count()
        if hourly_count >= prefs.max_notifications_per_hour:
            return None
        
        # Daily cap
        day_ago = now - timedelta(days=1)
        daily_count = Notification.objects.filter(
            user=user, created_at__gte=day_ago
        ).count()
        if daily_count >= prefs.max_notifications_per_day:
            return None
        
        # Quiet hours
        current_hour = now.hour
        if prefs.quiet_hours_start > prefs.quiet_hours_end:
            # Wraps midnight
            if current_hour >= prefs.quiet_hours_start or current_hour < prefs.quiet_hours_end:
                return None
        elif prefs.quiet_hours_start <= current_hour < prefs.quiet_hours_end:
            return None
            
    except NotificationPreference.DoesNotExist:
        pass  # No preferences set, allow all
    
    # Avoid duplicate notifications (same type + post within 1 hour)
    if post:
        exists = Notification.objects.filter(
            user=user,
            notification_type=notification_type,
            post=post,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        if exists:
            return None
    
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        body=body,
        post=post
    )
