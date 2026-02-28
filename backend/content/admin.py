from django.contrib import admin
from .models import Post, Comment, Reaction, Report

admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Reaction)
admin.site.register(Report)
