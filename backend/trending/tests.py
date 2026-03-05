from django.test import TestCase
from django.contrib.auth import get_user_model
from content.models import Post, Reaction
from trending.engine import update_trending_snapshots
from trending.models import TrendingSnapshot

User = get_user_model()

class TrendingEngineTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email='test1@example.com', password='testpassword123', alias='anon1', date_of_birth='2000-01-01')
        self.post1 = Post.objects.create(author=self.user1, content='Test post 1', moderation_status=Post.ModerationStatus.SAFE)

    def test_trending_engine_velocity(self):
        """Test that rapid engagement pushes a post into trending."""
        # Add a bunch of reactions to post1 rapidly
        Reaction.objects.create(post=self.post1, user=self.user1, reaction_type='fire')
        self.post1.view_count = 100
        self.post1.save()

        update_trending_snapshots()
        
        trending = TrendingSnapshot.objects.filter(category='RAPID_GROWTH', is_active=True)
        self.assertTrue(trending.exists(), "Trending engine should detect rapid growth")
