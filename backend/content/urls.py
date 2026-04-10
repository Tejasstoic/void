from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet, CommentViewSet, ReportViewSet, BookmarkViewSet,
    MyPulsesView, SearchView, DiscoverView, HashtagPostsView,
    ConfessionRoomViewSet
)

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'rooms', ConfessionRoomViewSet, basename='room')

urlpatterns = [
    path('', include(router.urls)),
    path('my-pulses/', MyPulsesView.as_view(), name='my-pulses'),
    path('search/', SearchView.as_view(), name='search'),
    path('discover/', DiscoverView.as_view(), name='discover'),
    path('hashtags/<str:name>/', HashtagPostsView.as_view(), name='hashtag-posts'),
]
