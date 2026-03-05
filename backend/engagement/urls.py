from django.urls import path
from . import views

urlpatterns = [
    path('session/start/', views.SessionStartView.as_view(), name='session-start'),
    path('session/end/', views.SessionEndView.as_view(), name='session-end'),
    path('impression/', views.ImpressionView.as_view(), name='record-impression'),
    path('scroll/', views.ScrollDepthView.as_view(), name='record-scroll'),
    path('usage/', views.UsageView.as_view(), name='usage-stats'),
]
