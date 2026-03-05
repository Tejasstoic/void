from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from content.models import Post, Reaction
from ranking.engine import compute_post_ranking

User = get_user_model()

class RankingEngineTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email='test1@example.com', password='testpassword123', alias='anon1', date_of_birth='2000-01-01')
        self.user2 = User.objects.create_user(email='test2@example.com', password='testpassword123', alias='anon2', date_of_birth='2000-01-01')
        self.post1 = Post.objects.create(author=self.user1, content='Test post 1', moderation_status=Post.ModerationStatus.SAFE)
        self.post2 = Post.objects.create(author=self.user2, content='Test post 2', moderation_status=Post.ModerationStatus.SAFE)

    def test_ranking_engine_calculation(self):
        """Test that the ranking engine calculates score based on recency and engagement."""
        # Make post1 older
        self.post1.created_at = timezone.now() - timedelta(hours=2)
        self.post1.save()
        
        # Add reactions to post2
        Reaction.objects.create(post=self.post2, user=self.user1, reaction_type='upvote')
        
        score1 = compute_post_ranking(self.post1)['composite_score']
        score2 = compute_post_ranking(self.post2)['composite_score']
        
        self.assertTrue(score2 > score1, "Newer post with engagement should rank higher")
