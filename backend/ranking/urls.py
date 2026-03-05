from django.urls import path
from . import views

urlpatterns = [
    path('feed/', views.PersonalizedFeedView.as_view(), name='personalized-feed'),
]
