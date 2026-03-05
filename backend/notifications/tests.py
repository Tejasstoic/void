from django.test import TestCase
from django.contrib.auth import get_user_model
from content.models import Post
from notifications.models import Notification, NotificationPreference
from notifications.tasks import _create_notification_if_allowed

User = get_user_model()

class NotificationEngineTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email='test1@example.com', password='testpassword123', alias='anon1', date_of_birth='2000-01-01')
        self.post1 = Post.objects.create(author=self.user1, content='Test post 1', moderation_status=Post.ModerationStatus.SAFE)

    def test_notification_frequency_caps(self):
        """Test that users are not spammed with notifications."""
        # Create user preference with disabled quiet hours for testing
        prefs = NotificationPreference.objects.create(
            user=self.user1,
            max_notifications_per_hour=2,
            quiet_hours_start=0,
            quiet_hours_end=0
        )
        
        # Dispatch 3 notifications
        n1 = _create_notification_if_allowed(
            self.user1, Notification.NotificationType.MOMENTUM, "Test 1", "Body 1"
        )
        n2 = _create_notification_if_allowed(
            self.user1, Notification.NotificationType.MOMENTUM, "Test 2", "Body 2"
        )
        n3 = _create_notification_if_allowed(
            self.user1, Notification.NotificationType.MOMENTUM, "Test 3", "Body 3"
        )
        
        self.assertIsNotNone(n1)
        self.assertIsNotNone(n2)
        self.assertIsNone(n3, "Third notification should be blocked by hourly cap")
