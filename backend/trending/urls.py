from django.urls import path
from . import views

urlpatterns = [
    path('', views.TrendingView.as_view(), name='trending-all'),
    path('<str:category>/', views.TrendingCategoryView.as_view(), name='trending-category'),
]
