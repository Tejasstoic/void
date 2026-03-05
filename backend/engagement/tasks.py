from celery import shared_task


@shared_task
def aggregate_engagement_metrics():
    """Periodic task to aggregate engagement data for analytics."""
    from django.utils import timezone
    from datetime import date
    from engagement.models import DailyUsageSummary, UserSession
    from django.conf import settings as django_settings
    
    today = date.today()
    
    # Update daily summaries for active sessions
    active_sessions = UserSession.objects.filter(
        ended_at__isnull=True,
        started_at__date=today
    )
    
    for session in active_sessions:
        duration = int((timezone.now() - session.started_at).total_seconds())
        session.duration_seconds = duration
        session.save(update_fields=['duration_seconds'])
    
    return {'status': 'aggregated', 'active_sessions': active_sessions.count()}
