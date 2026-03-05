from celery import shared_task
from django.db import models


@shared_task
def recalculate_rankings():
    """Batch recalculate ranking scores for recent posts."""
    from content.models import Post
    from ranking.models import PostRankingScore
    from ranking.engine import compute_post_ranking
    from django.utils import timezone
    from datetime import timedelta
    
    # Recalculate for posts from last 72 hours
    cutoff = timezone.now() - timedelta(hours=72)
    posts = Post.objects.filter(
        is_deleted=False,
        created_at__gte=cutoff
    ).exclude(
        moderation_status=Post.ModerationStatus.PROHIBITED
    )
    
    updated = 0
    for post in posts[:500]:  # Limit batch size
        scores = compute_post_ranking(post)
        
        PostRankingScore.objects.update_or_create(
            post=post,
            defaults={
                'engagement_score': scores['engagement_score'],
                'recency_score': scores['recency_score'],
                'comment_depth_score': scores['comment_depth_score'],
                'dwell_time_score': scores['dwell_time_score'],
                'reaction_diversity_score': scores['reaction_diversity_score'],
                'report_penalty': scores['report_penalty'],
                'composite_score': scores['composite_score'],
            }
        )
        
        # Also update cached engagement_score on Post
        Post.objects.filter(id=post.id).update(
            engagement_score=scores['composite_score']
        )
        
        updated += 1
    
    return {'status': 'recalculated', 'posts_updated': updated}


@shared_task
def update_user_preferences():
    """Update learned preferences for active users."""
    from django.contrib.auth import get_user_model
    from ranking.models import UserFeedPreference
    from content.models import Reaction
    from django.db.models import Count
    from engagement.models import PostImpression
    from django.utils import timezone
    from datetime import timedelta
    
    User = get_user_model()
    
    # Only update users active in last 24h
    cutoff = timezone.now() - timedelta(hours=24)
    active_users = User.objects.filter(last_active_at__gte=cutoff)
    
    for user in active_users[:200]:
        pref, created = UserFeedPreference.objects.get_or_create(user=user)
        
        # Calculate reaction pattern
        reactions = Reaction.objects.filter(user=user).values(
            'reaction_type'
        ).annotate(count=Count('id'))
        total = sum(r['count'] for r in reactions)
        
        if total > 0:
            pref.reaction_similarity_vector = {
                r['reaction_type']: r['count'] / total for r in reactions
            }
        
        # Calculate avg dwell time
        avg_dwell = PostImpression.objects.filter(
            user=user
        ).aggregate(avg=models.Avg('dwell_time_ms'))
        if avg_dwell['avg']:
            pref.avg_dwell_time_ms = int(avg_dwell['avg'])
        
        # Check if still cold start
        pref.interactions_count = total
        if pref.interactions_count > 20:
            pref.is_cold_start = False
        
        pref.save()
    
    return {'status': 'updated', 'users': active_users.count()}
