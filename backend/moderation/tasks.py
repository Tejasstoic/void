from celery import shared_task
from content.models import Post
import time
import random

@shared_task
def evaluate_post_toxicity(post_id):
    """
    Evaluates the toxicity of a post and updates its moderation status.
    For MVP, this uses a simulated scoring logic. In production, this can 
    be replaced with an LLM or Perspective API call.
    """
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return
    
    content = post.content.lower()
    
    # Simulate processing time
    time.sleep(1)
    
    # Stubbed keywords for MVP demonstration
    prohibited_keywords = ['kill', 'murder', 'pedophile', 'terrorist']
    mature_keywords = ['nsfw', 'porn', 'fuck', 'shit', 'bitch', 'blood']
    
    is_prohibited = any(word in content for word in prohibited_keywords)
    is_mature = any(word in content for word in mature_keywords)
    
    # Generate mock scores
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
    else:
        post.moderation_status = Post.ModerationStatus.SAFE
        
    post.save()
    
    return {
        'post_id': str(post.id),
        'status': post.moderation_status,
        'toxicity_score': post.toxicity_score
    }
