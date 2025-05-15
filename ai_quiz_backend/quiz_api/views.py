from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Avg, Max
from django.http import FileResponse
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
import os
import json
from datetime import datetime

from .models import (
    Subject, Chapter, Subchapter, StudyMaterial, 
    Quiz, QuizScore, StudyRecommendation
)
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    SubjectSerializer, ChapterSerializer, ChapterDetailSerializer,
    SubchapterSerializer, SubchapterDetailSerializer,
    StudyMaterialSerializer, StudyMaterialDetailSerializer,
    QuizSerializer, QuizDetailSerializer,
    QuizScoreSerializer, QuizScoreCreateSerializer,
    StudyRecommendationSerializer, LeaderboardSerializer
)
from .permissions import IsTeacher
from .openai_utils import extract_text_from_document, generate_quiz, generate_study_recommendations

# Authentication views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Log in an existing user"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Please provide both username and password'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, 
                        status=status.HTTP_401_UNAUTHORIZED)
    
    token, created = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'is_teacher': user.is_staff  # Flag to identify teacher users
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_details(request):
    """Get current user details"""
    serializer = UserSerializer(request.user)
    return Response({
        'user': serializer.data,
        'is_teacher': request.user.is_staff
    })

# Subject ViewSet
class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    
    def get_permissions(self):
        """
        Allow anyone to list/retrieve subjects, but only teachers can create/update/delete
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsTeacher]
        return [permission() for permission in permission_classes]

# Chapter ViewSet
class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChapterDetailSerializer
        return ChapterSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsTeacher]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Chapter.objects.all()
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset

# Subchapter ViewSet
class SubchapterViewSet(viewsets.ModelViewSet):
    queryset = Subchapter.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SubchapterDetailSerializer
        return SubchapterSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsTeacher]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Subchapter.objects.all()
        chapter_id = self.request.query_params.get('chapter_id')
        if chapter_id:
            queryset = queryset.filter(chapter_id=chapter_id)
        return queryset

# Study Material ViewSet
class StudyMaterialViewSet(viewsets.ModelViewSet):
    queryset = StudyMaterial.objects.all()
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudyMaterialDetailSerializer
        return StudyMaterialSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'download']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsTeacher]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = StudyMaterial.objects.all()
        subchapter_id = self.request.query_params.get('subchapter_id')
        if subchapter_id:
            queryset = queryset.filter(subchapter_id=subchapter_id)
        return queryset
    
    def perform_create(self, serializer):
        document = self.request.data.get('document')
        if document:
            # Get file type and size
            file_name = document.name
            file_extension = file_name.split('.')[-1].lower()
            file_size = document.size / 1024  # Convert to KB
            file_size_str = f"{file_size:.2f} KB" if file_size < 1024 else f"{file_size/1024:.2f} MB"
            
            serializer.save(
                uploaded_by=self.request.user,
                file_type=file_extension,
                file_size=file_size_str
            )
        else:
            serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the study material file"""
        material = self.get_object()
        file_path = material.document.path
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))

# Quiz Generation and Management
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, material_id):
    """Generate a quiz from study material"""
    material = get_object_or_404(StudyMaterial, id=material_id)
    level = request.data.get('level', 'Beginner')
    
    # Extract text from study material
    file_path = material.document.path
    text_content = extract_text_from_document(file_path, material.file_type)
    
    if not text_content:
        return Response({'error': 'Could not extract text from the document'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    # Generate quiz questions
    questions = generate_quiz(text_content, level)
    
    if not questions:
        return Response({'error': 'Failed to generate quiz questions'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Save the generated quiz
    quiz = Quiz.objects.create(
        material=material,
        level=level
    )
    quiz.set_questions(questions)
    quiz.save()
    
    serializer = QuizDetailSerializer(quiz)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quiz.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer
    
    def get_queryset(self):
        queryset = Quiz.objects.all()
        material_id = self.request.query_params.get('material_id')
        level = self.request.query_params.get('level')
        
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        if level:
            queryset = queryset.filter(level=level)
            
        return queryset

# Quiz Score submission and retrieval
class QuizScoreViewSet(viewsets.ModelViewSet):
    queryset = QuizScore.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuizScoreCreateSerializer
        return QuizScoreSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff:  # Teachers can see all scores
            queryset = QuizScore.objects.all()
        else:  # Students can only see their own scores
            queryset = QuizScore.objects.filter(user=self.request.user)
            
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Leaderboard views
@api_view(['GET'])
@permission_classes([AllowAny])
def material_leaderboard(request, material_id):
    """Get leaderboard for a study material"""
    material = get_object_or_404(StudyMaterial, id=material_id)
    quizzes = Quiz.objects.filter(material=material)
    
    if not quizzes:
        return Response({'error': 'No quizzes found for this material'}, 
                        status=status.HTTP_404_NOT_FOUND)
    
    # Get top scores
    top_scores = QuizScore.objects.filter(quiz__in=quizzes).order_by('-score', 'time_taken')[:10]
    serializer = LeaderboardSerializer(top_scores, many=True)
    
    return Response(serializer.data)

# Study recommendations
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def study_recommendations(request):
    """Get personalized study recommendations for the current user"""
    user = request.user
    
    # Get existing recommendations
    existing_recommendations = StudyRecommendation.objects.filter(user=user).order_by('-created_at')
    
    if existing_recommendations.exists():
        serializer = StudyRecommendationSerializer(existing_recommendations, many=True)
        return Response(serializer.data)
    
    # Generate new recommendations if none exist
    scores = QuizScore.objects.filter(user=user).select_related('quiz')
    
    if not scores.exists():
        return Response({'message': 'Complete some quizzes to get recommendations'}, 
                        status=status.HTTP_200_OK)
    
    # Prepare user data for recommendation generation
    avg_score = scores.aggregate(avg_score=Avg('score'))['avg_score']
    
    # Identify strengths and weaknesses
    strengths = []
    weaknesses = []
    
    # Get the user's quiz history with questions and answers
    quiz_history = []
    for score in scores:
        quiz = score.quiz
        questions = quiz.get_questions()
        answers = score.get_answers()
        
        quiz_data = {
            'material': quiz.material.title,
            'level': quiz.level,
            'score': float(score.score),
            'questions': []
        }
        
        # Match questions with user's answers
        if answers:
            for q_idx, question in enumerate(questions):
                if q_idx < len(answers):
                    user_answer = answers[q_idx]
                    is_correct = user_answer == question['correct_answer']
                    
                    quiz_data['questions'].append({
                        'question': question['question'],
                        'user_answer': user_answer,
                        'correct_answer': question['correct_answer'],
                        'is_correct': is_correct
                    })
        
        quiz_history.append(quiz_data)
    
    # Identify subject areas from recent quizzes
    recent_materials = [score.quiz.material for score in scores.order_by('-completed_at')[:5]]
    for material in recent_materials:
        subchapter = material.subchapter
        chapter = subchapter.chapter
        subject = chapter.subject
        
        if any(score.score >= 70 for score in scores if score.quiz.material == material):
            strengths.append(f"{subject.name} - {chapter.name} - {subchapter.name}")
        else:
            weaknesses.append(f"{subject.name} - {chapter.name} - {subchapter.name}")
    
    user_data = {
        'avg_score': float(avg_score),
        'strengths': strengths[:3],  # Top 3 strengths
        'weaknesses': weaknesses[:3]  # Top 3 weaknesses
    }
    
    # Generate recommendations using OpenAI
    recommendations = generate_study_recommendations(user_data, quiz_history)
    
    # Save recommendations to database
    saved_recommendations = []
    for weakness in weaknesses[:2]:  # Use top 2 weaknesses
        parts = weakness.split(' - ')
        if len(parts) == 3:
            subject_name, chapter_name, subchapter_name = parts
            
            try:
                subchapter = Subchapter.objects.get(
                    name=subchapter_name,
                    chapter__name=chapter_name,
                    chapter__subject__name=subject_name
                )
                
                for rec_text in recommendations[:2]:  # Save first 2 recommendations per weakness
                    recommendation = StudyRecommendation.objects.create(
                        user=user,
                        subchapter=subchapter,
                        recommendation=rec_text
                    )
                    saved_recommendations.append(recommendation)
                    
                recommendations = recommendations[2:]  # Remove used recommendations
                if not recommendations:
                    break
                    
            except Subchapter.DoesNotExist:
                continue
    
    serializer = StudyRecommendationSerializer(saved_recommendations, many=True)
    return Response(serializer.data)

# Student report
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report(request):
    """Generate a comprehensive report of student performance"""
    user = request.user
    
    # Get all quiz scores for the user
    scores = QuizScore.objects.filter(user=user).select_related('quiz__material__subchapter__chapter__subject')
    
    if not scores.exists():
        return Response({'message': 'No quiz data available yet'}, status=status.HTTP_200_OK)
    
    # Overall statistics
    total_quizzes = scores.count()
    avg_score = scores.aggregate(avg=Avg('score'))['avg']
    highest_score = scores.aggregate(max=Max('score'))['max']
    
    # Subject area performance
    subject_performance = {}
    for score in scores:
        quiz = score.quiz
        material = quiz.material
        subchapter = material.subchapter
        chapter = subchapter.chapter
        subject = chapter.subject
        
        subject_name = subject.name
        if subject_name not in subject_performance:
            subject_performance[subject_name] = {
                'total_quizzes': 0,
                'total_score': 0,
                'chapters': {}
            }
            
        subject_data = subject_performance[subject_name]
        subject_data['total_quizzes'] += 1
        subject_data['total_score'] += float(score.score)
        
        chapter_name = chapter.name
        if chapter_name not in subject_data['chapters']:
            subject_data['chapters'][chapter_name] = {
                'total_quizzes': 0,
                'total_score': 0,
                'subchapters': {}
            }
            
        chapter_data = subject_data['chapters'][chapter_name]
        chapter_data['total_quizzes'] += 1
        chapter_data['total_score'] += float(score.score)
        
        subchapter_name = subchapter.name
        if subchapter_name not in chapter_data['subchapters']:
            chapter_data['subchapters'][subchapter_name] = {
                'total_quizzes': 0,
                'total_score': 0,
                'quizzes': []
            }
            
        subchapter_data = chapter_data['subchapters'][subchapter_name]
        subchapter_data['total_quizzes'] += 1
        subchapter_data['total_score'] += float(score.score)
        
        quiz_data = {
            'id': quiz.id,
            'title': material.title,
            'level': quiz.level,
            'score': float(score.score),
            'date': score.completed_at.strftime('%Y-%m-%d %H:%M')
        }
        subchapter_data['quizzes'].append(quiz_data)
    
    # Calculate averages
    for subject_name, subject_data in subject_performance.items():
        if subject_data['total_quizzes'] > 0:
            subject_data['avg_score'] = subject_data['total_score'] / subject_data['total_quizzes']
            
        for chapter_name, chapter_data in subject_data['chapters'].items():
            if chapter_data['total_quizzes'] > 0:
                chapter_data['avg_score'] = chapter_data['total_score'] / chapter_data['total_quizzes']
                
            for subchapter_name, subchapter_data in chapter_data['subchapters'].items():
                if subchapter_data['total_quizzes'] > 0:
                    subchapter_data['avg_score'] = subchapter_data['total_score'] / subchapter_data['total_quizzes']
    
    # Recent activity
    recent_scores = QuizScore.objects.filter(user=user).order_by('-completed_at')[:5]
    recent_activity = []
    
    for score in recent_scores:
        quiz = score.quiz
        recent_activity.append({
            'quiz_id': quiz.id,
            'title': quiz.material.title,
            'level': quiz.level,
            'score': float(score.score),
            'date': score.completed_at.strftime('%Y-%m-%d %H:%M')
        })
    
    # Compose the report
    report = {
        'username': user.username,
        'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'summary': {
            'total_quizzes': total_quizzes,
            'avg_score': float(avg_score) if avg_score else 0,
            'highest_score': float(highest_score) if highest_score else 0
        },
        'subject_performance': subject_performance,
        'recent_activity': recent_activity,
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return Response(report)