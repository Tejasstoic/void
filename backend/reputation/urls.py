from django.urls import path
from . import views

urlpatterns = [
    path('badges/', views.MyBadgesView.as_view(), name='my-badges'),
    path('badges/<uuid:user_id>/', views.AuthorBadgesView.as_view(), name='author-badges'),
]
