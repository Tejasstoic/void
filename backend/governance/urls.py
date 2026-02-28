from django.urls import path
from .views import AdminAnalyticsView, IssueStrikeView

urlpatterns = [
    path('analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('users/<uuid:user_id>/strike/', IssueStrikeView.as_view(), name='issue-strike'),
]
