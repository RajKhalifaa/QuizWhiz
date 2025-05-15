from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Register viewsets
router.register('subjects', views.SubjectViewSet)
router.register('chapters', views.ChapterViewSet)
router.register('subchapters', views.SubchapterViewSet)
router.register('materials', views.StudyMaterialViewSet)
router.register('quizzes', views.QuizViewSet)
router.register('scores', views.QuizScoreViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Auth endpoints
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('user/', views.user_details, name='user-details'),
    
    # Quiz generation endpoints
    path('generate-quiz/<int:material_id>/', views.generate_quiz, name='generate-quiz'),
    
    # Study recommendations
    path('recommendations/', views.study_recommendations, name='recommendations'),
    
    # Student reports
    path('student-report/', views.student_report, name='student-report'),
    
    # Leaderboard
    path('leaderboard/material/<int:material_id>/', views.material_leaderboard, name='material-leaderboard'),
]