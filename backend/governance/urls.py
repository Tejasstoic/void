from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'proposals', views.ProposalViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('proposals/<uuid:proposal_id>/vote/', views.VoteView.as_view(), name='proposal-vote'),
    path('analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('strike/<int:user_id>/', views.IssueStrikeView.as_view(), name='issue-strike'),
    path('queue/', views.ModerationQueueView.as_view(), name='moderation-queue'),
    path('logs/', views.AdminAuditLogView.as_view(), name='admin-logs'),
]
