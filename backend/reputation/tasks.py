from celery import shared_task


@shared_task
def evaluate_all_badges():
    """Periodic badge evaluation for active users."""
    from django.contrib.auth import get_user_model
    from reputation.engine import calculate_reputation, evaluate_badges
    from django.utils import timezone
    from datetime import timedelta
    
    User = get_user_model()
    
    # Evaluate users active in last 24h
    cutoff = timezone.now() - timedelta(hours=24)
    active_users = User.objects.filter(last_active_at__gte=cutoff)
    
    new_badges_total = 0
    for user in active_users[:200]:
        calculate_reputation(user)
        new_badges = evaluate_badges(user)
        new_badges_total += len(new_badges)
        
        # Create notifications for new badges
        if new_badges:
            from notifications.models import Notification
            for badge in new_badges:
                Notification.objects.create(
                    user=user,
                    notification_type=Notification.NotificationType.BADGE_EARNED,
                    title=f'New badge earned: {badge.display_name}',
                    body=f'You earned the {badge.icon} {badge.display_name} badge!'
                )
    
    return {'status': 'evaluated', 'new_badges': new_badges_total}
