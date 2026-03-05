"""
VOID Reputation Engine

Evaluates user reputation and awards anonymous badges.
Reputation is hidden from users — only badges are visible.
"""
from django.db.models import Count, Avg, Q
from django.utils import timezone


def calculate_reputation(user):
    """
    Calculate composite reputation score for a user.
    Components:
      - Post quality (avg engagement per post)
      - Report avoidance (inverse of reports received)  
      - Engagement generated (total reactions + comments received)
      - Positive reaction ratio (hearts+upvotes / total)
    """
    from content.models import Post, Reaction
    from reputation.models import ReputationScore
    
    posts = Post.objects.filter(author=user, is_deleted=False)
    total_posts = posts.count()
    
    if total_posts == 0:
        score, created = ReputationScore.objects.get_or_create(user=user)
        score.total_posts = 0
        score.composite_score = 50.0
        score.save()
        return score
    
    # Post quality: avg reactions per post
    total_reactions = Reaction.objects.filter(post__author=user).count()
    avg_reactions = total_reactions / total_posts if total_posts > 0 else 0
    post_quality = min(avg_reactions * 10, 100.0)  # 10 reactions/post = 100
    
    # Report avoidance
    total_reports = 0
    for post in posts:
        total_reports += post.reports.count()
    report_penalty = min(total_reports * 5, 80)  # Each report = -5, max -80
    report_avoidance = max(100.0 - report_penalty, 20.0)
    
    # Engagement generated
    total_comments = 0
    for post in posts:
        total_comments += post.comments.filter(is_deleted=False).count()
    total_engagement = total_reactions + total_comments
    engagement_score = min(total_engagement * 2, 100.0)
    
    # Positive reaction ratio
    positive_reactions = Reaction.objects.filter(
        post__author=user,
        reaction_type__in=['upvote', 'heart', 'fire', 'mindblown']
    ).count()
    positive_ratio = positive_reactions / total_reactions if total_reactions > 0 else 0.5
    positive_score = positive_ratio * 100.0
    
    # Composite: weighted average
    composite = (
        post_quality * 0.25 +
        report_avoidance * 0.30 +
        engagement_score * 0.25 +
        positive_score * 0.20
    )
    
    # Update or create score
    score, created = ReputationScore.objects.update_or_create(
        user=user,
        defaults={
            'post_quality_score': round(post_quality, 2),
            'report_avoidance_score': round(report_avoidance, 2),
            'engagement_generated': round(engagement_score, 2),
            'positive_reaction_ratio': round(positive_ratio, 4),
            'composite_score': round(composite, 2),
            'total_posts': total_posts,
            'total_reactions_received': total_reactions,
            'total_reports_against': total_reports,
            'total_engagement': total_engagement,
        }
    )
    
    return score


def evaluate_badges(user):
    """
    Check if user qualifies for any new badges based on their reputation and activity.
    Awards badges that haven't been earned yet.
    """
    from reputation.models import Badge, UserBadge, ReputationScore
    from content.models import Post
    
    try:
        rep = user.reputation
    except ReputationScore.DoesNotExist:
        rep = calculate_reputation(user)
    
    posts = Post.objects.filter(author=user, is_deleted=False)
    total_posts = posts.count()
    
    badges_earned = []
    
    # Deep Thinker: High post quality, 10+ posts
    if rep.post_quality_score >= 60 and total_posts >= 10:
        badges_earned.append(Badge.BadgeType.DEEP_THINKER)
    
    # Chaos Spark: High engagement but diverse reactions
    if rep.total_engagement >= 50 and rep.positive_reaction_ratio < 0.7:
        badges_earned.append(Badge.BadgeType.CHAOS_SPARK)
    
    # Midnight Confessor: Posts created between 11 PM - 4 AM
    late_posts = posts.filter(created_at__hour__gte=23) | posts.filter(created_at__hour__lt=4)
    if late_posts.count() >= 5:
        badges_earned.append(Badge.BadgeType.MIDNIGHT_CONFESSOR)
    
    # Debate Magnet: High comment depth on posts
    high_discussion_posts = 0
    for post in posts[:50]:  # Limit lookups
        if post.comments.filter(is_deleted=False, parent__isnull=False).count() >= 3:
            high_discussion_posts += 1
    if high_discussion_posts >= 3:
        badges_earned.append(Badge.BadgeType.DEBATE_MAGNET)
    
    # Echo Maker: High engagement generated (100+ total)
    if rep.total_engagement >= 100:
        badges_earned.append(Badge.BadgeType.ECHO_MAKER)
    
    # Shadow Sage: High reputation, 0 reports
    if rep.composite_score >= 75 and rep.total_reports_against == 0:
        badges_earned.append(Badge.BadgeType.SHADOW_SAGE)
    
    # Pulse Starter: 5+ posts that got reactions
    reacted_posts = posts.filter(reactions__isnull=False).distinct().count()
    if reacted_posts >= 5:
        badges_earned.append(Badge.BadgeType.PULSE_STARTER)
    
    # Void Walker: 20+ posts total
    if total_posts >= 20:
        badges_earned.append(Badge.BadgeType.VOID_WALKER)
    
    # Award new badges
    newly_earned = []
    for badge_type in badges_earned:
        badge = Badge.objects.filter(badge_type=badge_type).first()
        if badge and not UserBadge.objects.filter(user=user, badge=badge).exists():
            UserBadge.objects.create(user=user, badge=badge)
            newly_earned.append(badge)
    
    return newly_earned
