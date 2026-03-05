"""
VOID Feed Ranking Engine

Implements personalized feed ranking using a composite scoring formula:
  ranking_score = 
    (engagement_weight * 0.4) +
    (recency_weight * 0.2) + 
    (similarity_weight * 0.2) +
    (dwell_time_weight * 0.1) +
    (comment_depth_weight * 0.1)
"""
from django.utils import timezone
from django.db.models import Count, Avg, Q, F
from datetime import timedelta
import math


def calculate_recency_score(post):
    """Score decays exponentially over time. Max 1.0 for fresh posts."""
    age_hours = (timezone.now() - post.created_at).total_seconds() / 3600
    # Half-life of 12 hours
    return math.exp(-0.0577 * age_hours)  # ln(2)/12 ≈ 0.0577


def calculate_engagement_score(post):
    """Score based on reaction count + comment count + view count."""
    reaction_count = post.reactions.count()
    comment_count = post.comments.filter(is_deleted=False).count()
    view_count = getattr(post, 'view_count', 0) or 0
    
    # Normalize: log scale to prevent viral posts from dominating entirely
    engagement = (
        (math.log1p(reaction_count) * 2.0) +
        (math.log1p(comment_count) * 3.0) +
        (math.log1p(view_count) * 0.5)
    )
    # Normalize to 0-1 range (cap at ~50 engagement units)
    return min(engagement / 20.0, 1.0)


def calculate_comment_depth_score(post):
    """Higher score for deeper comment threads (signals engaging content)."""
    comments = post.comments.filter(is_deleted=False)
    if not comments.exists():
        return 0.0
    
    # Count threaded replies (comments with parent)
    reply_count = comments.filter(parent__isnull=False).count()
    total_count = comments.count()
    
    if total_count == 0:
        return 0.0
    
    # Thread depth ratio + total count factor
    depth_ratio = reply_count / total_count if total_count > 0 else 0
    count_factor = min(math.log1p(total_count) / 5.0, 1.0)
    
    return (depth_ratio * 0.6 + count_factor * 0.4)


def calculate_dwell_time_score(post):
    """Score based on average dwell time from impressions."""
    from engagement.models import PostImpression
    
    avg_dwell = PostImpression.objects.filter(
        post=post
    ).aggregate(avg_dwell=Avg('dwell_time_ms'))['avg_dwell']
    
    if not avg_dwell:
        return 0.3  # Default for untracked posts
    
    # Normalize: 5 seconds = 0.5, 15+ seconds = 1.0  
    return min(avg_dwell / 15000.0, 1.0)


def calculate_reaction_diversity_score(post):
    """Higher score when post gets diverse reaction types (not just upvotes)."""
    unique_types = post.reactions.values('reaction_type').distinct().count()
    total_reactions = post.reactions.count()
    
    if total_reactions == 0:
        return 0.0
    
    # Max possible types = 7 (upvote, downvote, heart, fire, mindblown, sad, laugh)
    diversity = unique_types / 7.0
    volume = min(math.log1p(total_reactions) / 5.0, 1.0)
    
    return diversity * 0.6 + volume * 0.4


def calculate_report_penalty(post):
    """Penalty based on report count. Heavily demotes frequently reported content."""
    report_count = post.reports.count()
    
    if report_count == 0:
        return 0.0
    
    # Exponential penalty: 1 report = 0.1, 3+ = 0.5+
    return min(report_count * 0.15, 0.8)


def calculate_similarity_score(post, user_preference):
    """Score based on how well the post matches user preferences."""
    if user_preference is None or user_preference.is_cold_start:
        return 0.5  # Neutral for cold-start users
    
    score = 0.5  # Base
    
    # Check content type affinity
    content_type = getattr(post, 'content_type', 'TEXT_BURST')
    if content_type == 'CONFESSION' and user_preference.prefers_long_content > 0.5:
        score += 0.15
    if content_type == 'POLL' and user_preference.prefers_polls > 0.5:
        score += 0.15
    
    # Check restricted preference
    if post.moderation_status == 'MATURE' and user_preference.prefers_restricted > 0.5:
        score += 0.2
    
    # Check reaction pattern matching
    reaction_vector = user_preference.reaction_similarity_vector or {}
    if reaction_vector:
        post_reactions = post.reactions.values('reaction_type').annotate(
            count=Count('id')
        )
        total = sum(r['count'] for r in post_reactions)
        if total > 0:
            post_ratios = {r['reaction_type']: r['count'] / total for r in post_reactions}
            # Cosine-like similarity
            overlap = sum(
                reaction_vector.get(rt, 0) * post_ratios.get(rt, 0)
                for rt in set(list(reaction_vector.keys()) + list(post_ratios.keys()))
            )
            score += overlap * 0.2
    
    return min(score, 1.0)


def compute_post_ranking(post, user_preference=None):
    """
    Compute the full ranking score for a post.
    
    Returns dict with component scores and composite.
    """
    engagement = calculate_engagement_score(post)
    recency = calculate_recency_score(post)
    similarity = calculate_similarity_score(post, user_preference)
    dwell = calculate_dwell_time_score(post)
    depth = calculate_comment_depth_score(post)
    penalty = calculate_report_penalty(post)
    diversity = calculate_reaction_diversity_score(post)
    
    # Composite formula
    composite = (
        (engagement * 0.35) +
        (recency * 0.20) +
        (similarity * 0.20) +
        (dwell * 0.10) +
        (depth * 0.10) +
        (diversity * 0.05)
    ) * (1.0 - penalty)
    
    return {
        'engagement_score': round(engagement, 4),
        'recency_score': round(recency, 4),
        'comment_depth_score': round(depth, 4),
        'dwell_time_score': round(dwell, 4),
        'reaction_diversity_score': round(diversity, 4),
        'report_penalty': round(penalty, 4),
        'composite_score': round(composite, 4),
    }


def get_personalized_feed(user, restricted=False, page=1, page_size=15):
    """
    Get personalized feed for a user.
    Falls back to trending-biased for cold-start users.
    """
    from content.models import Post
    from ranking.models import UserFeedPreference, PostRankingScore
    
    # Get user preference
    preference = None
    try:
        preference = user.feed_preference
    except UserFeedPreference.DoesNotExist:
        pass
    
    # Base queryset - exclude deleted and prohibited
    qs = Post.objects.filter(
        is_deleted=False
    ).exclude(
        moderation_status=Post.ModerationStatus.PROHIBITED
    )
    
    # Filter by zone
    if restricted and user.is_18_plus:
        qs = qs.filter(moderation_status=Post.ModerationStatus.MATURE)
    else:
        qs = qs.filter(moderation_status=Post.ModerationStatus.SAFE)
    
    # Try to use cached scores first
    scored_post_ids = PostRankingScore.objects.filter(
        post__in=qs
    ).order_by('-composite_score' if not restricted else '-restricted_composite_score')
    
    if scored_post_ids.exists():
        ordered_ids = list(scored_post_ids.values_list('post_id', flat=True))
        
        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        page_ids = ordered_ids[start:end]
        
        # Preserve order
        posts = list(qs.filter(id__in=page_ids))
        posts.sort(key=lambda p: page_ids.index(p.id) if p.id in page_ids else 999)
        return posts
    
    # Fallback: compute on-the-fly for cold start or uncached
    posts = list(qs[:100])  # Limit computation
    
    scored = []
    for post in posts:
        scores = compute_post_ranking(post, preference)
        scored.append((post, scores['composite_score']))
    
    scored.sort(key=lambda x: x[1], reverse=True)
    
    start = (page - 1) * page_size
    end = start + page_size
    return [post for post, _ in scored[start:end]]
