from django.contrib import admin
from .models import TrendingSnapshot, EngagementVelocity

@admin.register(TrendingSnapshot)
class TrendingSnapshotAdmin(admin.ModelAdmin):
    list_display = ['post', 'category', 'velocity_score', 'rank_position', 'is_active', 'snapshot_time']
    list_filter = ['category', 'is_active']

@admin.register(EngagementVelocity)
class EngagementVelocityAdmin(admin.ModelAdmin):
    list_display = ['post', 'acceleration_score', 'reactions_1h', 'comments_1h', 'last_calculated']
    ordering = ['-acceleration_score']
