from django.urls import path
from . import views

urlpatterns = [
    path('queue/', views.ModerationQueueListView.as_view(), name='moderation-queue-list'),
    path('action/', views.ModerationActionView.as_view(), name='moderation-action'),
    path('stats/', views.ModerationStatsView.as_view(), name='moderation-stats'),
]
