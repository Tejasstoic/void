from django.contrib import admin
from django.db.models import Avg, Sum
from .models import UserSession, PostImpression, ScrollDepthEvent, DailyUsageSummary

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'started_at', 'duration_minutes', 'posts_viewed', 'engagement_rate', 'is_restricted_session']
    list_filter = ['is_restricted_session', 'started_at']
    readonly_fields = ['id']
    search_fields = ['user__alias']

    def duration_minutes(self, obj):
        return round(obj.duration_seconds / 60, 2) if obj.duration_seconds else 0
    duration_minutes.short_description = 'Duration (min)'

    def engagement_rate(self, obj):
        if obj.posts_viewed > 0:
            return f"{round((obj.reactions_given / obj.posts_viewed) * 100, 1)}%"
        return "0%"
    engagement_rate.short_description = 'Reaction Rate'

@admin.register(DailyUsageSummary)
class DailyUsageSummaryAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'total_minutes', 'session_count', 'posts_viewed', 'nudge_shown']
    list_filter = ['date', 'nudge_shown']
    search_fields = ['user__alias']
    
    def changelist_view(self, request, extra_context=None):
        response = super().changelist_view(request, extra_context=extra_context)
        try:
            qs = response.context_data['cl'].queryset
            metrics = qs.aggregate(
                avg_minutes=Avg('total_minutes'),
                total_sessions=Sum('session_count'),
                avg_posts=Avg('posts_viewed')
            )
            response.context_data['summary_metrics'] = metrics
        except (AttributeError, KeyError):
            pass
        return response

@admin.register(PostImpression)
class PostImpressionAdmin(admin.ModelAdmin):
    list_display = ['user', 'post_id', 'dwell_time_ms', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__alias']

@admin.register(ScrollDepthEvent)
class ScrollDepthEventAdmin(admin.ModelAdmin):
    list_display = ['user', 'max_depth_percent', 'posts_scrolled_past', 'created_at']
    list_filter = ['created_at']
