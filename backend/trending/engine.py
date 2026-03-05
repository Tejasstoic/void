"""
VOID Trending Engine

Calculates trending posts based on engagement velocity (not total likes).
Categories:
  🔥 Trending Now — highest velocity general posts
  🌑 Dark Rising — highest velocity restricted posts  
  💬 Most Discussed — highest comment depth/count
  ⚡ Rapid Growth — fastest acceleration rate
"""
from django.utils import timezone
from django.db.models import Count, Q, F
from datetime import timedelta
import math


def calculate_velocity(post, hours=1):
    """Calculate engagement velocity for a given time window."""
    cutoff = timezone.now() - timedelta(hours=hours)
    
    recent_reactions = post.reactions.filter(created_at__gte=cutoff).count()
    recent_comments = post.comments.filter(
        is_deleted=False, created_at__gte=cutoff
    ).count()
    
    # Comments weighted 2x vs reactions
    return recent_reactions + (recent_comments * 2)


def calculate_acceleration(post):
    """
    Calculate acceleration: compare recent velocity to prior velocity.
    Positive = gaining speed, negative = losing speed.
    """
    v_1h = calculate_velocity(post, hours=1)
    v_6h = calculate_velocity(post, hours=6) / 6  # Normalize to per-hour
    
    if v_6h == 0:
        return v_1h * 2  # If no prior activity, any activity is high acceleration
    
    return (v_1h - v_6h) / v_6h  # Relative acceleration


def calculate_discussion_score(post):
    """Score based on comment count and thread depth."""
    comments = post.comments.filter(is_deleted=False)
    total = comments.count()
    threaded = comments.filter(parent__isnull=False).count()
    
    # Weight by both volume and depth
    return (math.log1p(total) * 2) + (math.log1p(threaded) * 3)


def get_reaction_diversity(post):
    """Count unique reaction types on a post."""
    return post.reactions.values('reaction_type').distinct().count()


def is_report_neutral(post):
    """Check if post has acceptable report levels for trending."""
    report_count = post.reports.count()
    reaction_count = post.reactions.count()
    
    # If reports > 20% of reactions, exclude from trending
    if reaction_count > 0 and report_count / reaction_count > 0.2:
        return False
    
    # If more than 3 absolute reports, exclude
    if report_count >= 3:
        return False
    
    return True


def compute_trending(category='TRENDING_NOW', limit=10):
    """
    Compute trending posts for a given category.
    Returns list of (post, score) tuples.
    """
    from content.models import Post
    
    # Base queryset - only non-deleted, non-prohibited, recent posts (last 48h)
    cutoff = timezone.now() - timedelta(hours=48)
    
    base_qs = Post.objects.filter(
        is_deleted=False,
        created_at__gte=cutoff,
    ).exclude(
        moderation_status=Post.ModerationStatus.PROHIBITED
    )
    
    if category == 'TRENDING_NOW':
        qs = base_qs.filter(moderation_status=Post.ModerationStatus.SAFE)
        posts = list(qs[:200])
        scored = []
        for post in posts:
            if not is_report_neutral(post):
                continue
            velocity = calculate_velocity(post, hours=1)
            diversity_bonus = get_reaction_diversity(post) * 0.5
            score = velocity + diversity_bonus
            scored.append((post, score))
        
    elif category == 'DARK_RISING':
        qs = base_qs.filter(moderation_status=Post.ModerationStatus.MATURE)
        posts = list(qs[:200])
        scored = []
        for post in posts:
            if not is_report_neutral(post):
                continue
            velocity = calculate_velocity(post, hours=1)
            score = velocity
            scored.append((post, score))
    
    elif category == 'MOST_DISCUSSED':
        qs = base_qs.filter(
            moderation_status__in=[Post.ModerationStatus.SAFE, Post.ModerationStatus.MATURE]
        )
        posts = list(qs[:200])
        scored = []
        for post in posts:
            if not is_report_neutral(post):
                continue
            score = calculate_discussion_score(post)
            scored.append((post, score))
    
    elif category == 'RAPID_GROWTH':
        qs = base_qs.filter(
            moderation_status__in=[Post.ModerationStatus.SAFE, Post.ModerationStatus.MATURE]
        )
        posts = list(qs[:200])
        scored = []
        for post in posts:
            if not is_report_neutral(post):
                continue
            accel = calculate_acceleration(post)
            if accel > 0:
                scored.append((post, accel))
    else:
        return []
    
    # Sort by score descending and return top N
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


def update_trending_snapshots():
    """
    Recalculate all trending categories and save snapshots.
    Called periodically by Celery beat.
    """
    from trending.models import TrendingSnapshot, EngagementVelocity
    
    # Deactivate old snapshots
    TrendingSnapshot.objects.filter(is_active=True).update(is_active=False)
    
    categories = ['TRENDING_NOW', 'DARK_RISING', 'MOST_DISCUSSED', 'RAPID_GROWTH']
    
    for category in categories:
        results = compute_trending(category=category, limit=10)
        
        for rank, (post, score) in enumerate(results):
            TrendingSnapshot.objects.create(
                post=post,
                category=category,
                velocity_score=score,
                rank_position=rank + 1,
                is_active=True,
            )
    
    # Update velocity records
    from content.models import Post
    recent_posts = Post.objects.filter(
        is_deleted=False,
        created_at__gte=timezone.now() - timedelta(hours=48)
    ).exclude(moderation_status=Post.ModerationStatus.PROHIBITED)
    
    for post in recent_posts[:500]:
        velocity, created = EngagementVelocity.objects.get_or_create(post=post)
        velocity.reactions_1h = calculate_velocity(post, hours=1)
        velocity.reactions_6h = calculate_velocity(post, hours=6)
        velocity.reactions_24h = calculate_velocity(post, hours=24)
        velocity.comments_1h = post.comments.filter(
            is_deleted=False,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        velocity.comments_6h = post.comments.filter(
            is_deleted=False,
            created_at__gte=timezone.now() - timedelta(hours=6)
        ).count()
        velocity.comments_24h = post.comments.filter(
            is_deleted=False,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        velocity.acceleration_score = calculate_acceleration(post)
        velocity.reaction_type_count = get_reaction_diversity(post)
        
        # Max comment depth
        max_depth = 0
        threaded = post.comments.filter(parent__isnull=False)
        if threaded.exists():
            max_depth = 1  # At least 1 level
            # Simple depth estimation
            for comment in threaded:
                depth = 1
                parent = comment.parent
                while parent and depth < 10:
                    depth += 1
                    parent = parent.parent
                max_depth = max(max_depth, depth)
        velocity.max_comment_depth = max_depth
        velocity.save()
