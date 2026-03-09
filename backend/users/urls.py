from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views # Changed to import the whole views module

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/google/', views.GoogleLoginView.as_view(), name='google_login'),
    path('me/', views.MeView.as_view(), name='me'),
    path('list/', views.UserListView.as_view(), name='user-list'),
]
