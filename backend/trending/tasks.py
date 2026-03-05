from celery import shared_task


@shared_task
def update_trending():
    """Recalculate all trending categories and save snapshots."""
    from trending.engine import update_trending_snapshots
    update_trending_snapshots()
    return {'status': 'trending updated'}
