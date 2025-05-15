from django.contrib import admin
from .models import Subject, Chapter, Subchapter, StudyMaterial, Quiz, QuizScore, StudyRecommendation

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at',)

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'order', 'created_at')
    list_filter = ('subject', 'created_at')
    search_fields = ('name', 'description', 'subject__name')
    ordering = ('subject__name', 'order', 'name')

@admin.register(Subchapter)
class SubchapterAdmin(admin.ModelAdmin):
    list_display = ('name', 'chapter', 'order', 'created_at')
    list_filter = ('chapter__subject', 'chapter', 'created_at')
    search_fields = ('name', 'description', 'chapter__name', 'chapter__subject__name')
    ordering = ('chapter__subject__name', 'chapter__name', 'order', 'name')

@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'subchapter', 'file_type', 'file_size', 'uploaded_by', 'created_at')
    list_filter = ('file_type', 'subchapter__chapter__subject', 'created_at')
    search_fields = ('title', 'description', 'subchapter__name', 'subchapter__chapter__name')
    ordering = ('-created_at',)

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('material', 'level', 'created_at')
    list_filter = ('level', 'material__subchapter__chapter__subject', 'created_at')
    search_fields = ('material__title', 'material__subchapter__name')
    ordering = ('-created_at',)

@admin.register(QuizScore)
class QuizScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'time_taken', 'completed_at')
    list_filter = ('quiz__level', 'completed_at')
    search_fields = ('user__username', 'quiz__material__title')
    ordering = ('-completed_at',)

@admin.register(StudyRecommendation)
class StudyRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'subchapter', 'created_at')
    list_filter = ('subchapter__chapter__subject', 'created_at')
    search_fields = ('user__username', 'subchapter__name', 'recommendation')
    ordering = ('-created_at',)
