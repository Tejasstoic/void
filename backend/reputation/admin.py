from django.contrib import admin
from .models import Badge, ReputationScore, UserBadge

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['badge_type', 'display_name', 'icon', 'min_reputation_score']

@admin.register(ReputationScore)
class ReputationScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'composite_score', 'total_posts', 'total_engagement', 'total_reports_against']
    ordering = ['-composite_score']

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at']
    list_filter = ['badge']
