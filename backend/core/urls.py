"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "platform": "void"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/users/', include('users.urls')),
    path('api/content/', include('content.urls')),
    path('api/governance/', include('governance.urls')),
    
    # Phase 2: Engagement endpoints
    path('api/engagement/', include('engagement.urls')),
    path('api/ranking/', include('ranking.urls')),
    path('api/trending/', include('trending.urls')),
    path('api/reputation/', include('reputation.urls')),
    path('api/notifications/', include('notifications.urls')),
]
