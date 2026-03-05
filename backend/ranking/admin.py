from django.contrib import admin
from .models import PostRankingScore, UserFeedPreference

@admin.register(PostRankingScore)
class PostRankingScoreAdmin(admin.ModelAdmin):
    list_display = ['post', 'composite_score', 'engagement_score', 'recency_score', 'last_calculated']
    ordering = ['-composite_score']

@admin.register(UserFeedPreference)
class UserFeedPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_cold_start', 'interactions_count', 'updated_at']
