from celery import shared_task
from content.models import Post
import time
import random
import logging

logger = logging.getLogger(__name__)

@shared_task
def evaluate_post_toxicity(post_id):
    """
    Evaluates the toxicity of a post and updates its moderation status.
    Also creates a ModerationQueue entry for flagged content.
    """
    logger.info(f"Starting moderation for post {post_id}")
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        logger.error(f"Post {post_id} not found during moderation")
        return

    content = post.content.lower()

    # Simulate processing time
    time.sleep(0.5)

    # Keyword-based detection (to be replaced with Perspective API / LLM)
    prohibited_keywords = ['kill', 'murder', 'pedophile', 'terrorist', 'bomb threat']
    mature_keywords = ['nsfw', 'porn', 'fuck', 'shit', 'bitch', 'blood', 'sex', 'drugs']
    spam_patterns = ['buy now', 'click here', 'free money', 'congratulations you won']

    is_prohibited = any(word in content for word in prohibited_keywords)
    is_mature = any(word in content for word in mature_keywords)
    is_spam = any(pattern in content for pattern in spam_patterns)

    # Generate scores
    toxicity = random.uniform(80, 100) if is_prohibited else random.uniform(50, 79) if is_mature else random.uniform(0, 49)
    hate = random.uniform(80, 100) if is_prohibited else random.uniform(0, 20)
    violence = random.uniform(80, 100) if 'kill' in content or 'murder' in content else random.uniform(0, 20)
    self_harm = random.uniform(80, 100) if 'suicide' in content else random.uniform(0, 20)

    post.toxicity_score = round(toxicity, 2)
    post.hate_score = round(hate, 2)
    post.violence_score = round(violence, 2)
    post.self_harm_score = round(self_harm, 2)

    if is_prohibited or toxicity >= 80:
        post.moderation_status = Post.ModerationStatus.PROHIBITED
    elif is_mature or toxicity >= 50:
        post.moderation_status = Post.ModerationStatus.MATURE
    elif is_spam:
        post.moderation_status = Post.ModerationStatus.PROHIBITED
    else:
        post.moderation_status = Post.ModerationStatus.SAFE

    post.save()

    # Create ModerationQueue entry for flagged content
    if post.moderation_status in [Post.ModerationStatus.MATURE, Post.ModerationStatus.PROHIBITED]:
        from moderation.models import ModerationQueue
        ModerationQueue.objects.get_or_create(
            post=post,
            defaults={
                'reason': f'AI flagged: toxicity={post.toxicity_score}, hate={post.hate_score}',
                'ai_scores': {
                    'toxicity': post.toxicity_score,
                    'hate': post.hate_score,
                    'violence': post.violence_score,
                    'self_harm': post.self_harm_score,
                },
                'priority': 2 if post.moderation_status == Post.ModerationStatus.PROHIBITED else 1,
            }
        )

    return {
        'post_id': str(post.id),
        'status': post.moderation_status,
        'toxicity_score': post.toxicity_score
    }
