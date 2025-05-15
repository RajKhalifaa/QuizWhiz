from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Subject, Chapter, Subchapter, StudyMaterial, Quiz, QuizScore, StudyRecommendation

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name']
        
    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'created_at']

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'subject', 'name', 'description', 'order', 'created_at']
        
class ChapterDetailSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    
    class Meta:
        model = Chapter
        fields = ['id', 'subject', 'name', 'description', 'order', 'created_at']

class SubchapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subchapter
        fields = ['id', 'chapter', 'name', 'description', 'order', 'created_at']

class SubchapterDetailSerializer(serializers.ModelSerializer):
    chapter = ChapterSerializer(read_only=True)
    
    class Meta:
        model = Subchapter
        fields = ['id', 'chapter', 'name', 'description', 'order', 'created_at']

class StudyMaterialSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = StudyMaterial
        fields = ['id', 'subchapter', 'title', 'description', 'document', 
                 'file_type', 'file_size', 'uploaded_by', 'created_at']
        
class StudyMaterialDetailSerializer(serializers.ModelSerializer):
    subchapter = SubchapterDetailSerializer(read_only=True)
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = StudyMaterial
        fields = ['id', 'subchapter', 'title', 'description', 'document', 
                 'file_type', 'file_size', 'uploaded_by', 'created_at']

class QuizQuestionSerializer(serializers.Serializer):
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    correct_answer = serializers.CharField()
    explanation = serializers.CharField(required=False, allow_blank=True)

class QuizSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'material', 'level', 'questions', 'created_at']
        
    def get_questions(self, obj):
        questions = obj.get_questions()
        return questions
    
class QuizDetailSerializer(serializers.ModelSerializer):
    material = StudyMaterialSerializer(read_only=True)
    questions = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'material', 'level', 'questions', 'created_at']
        
    def get_questions(self, obj):
        questions = obj.get_questions()
        return questions

class QuizScoreSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    answers = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizScore
        fields = ['id', 'user', 'quiz', 'score', 'time_taken', 'answers', 'completed_at']
        
    def get_answers(self, obj):
        return obj.get_answers()
    
class QuizScoreCreateSerializer(serializers.ModelSerializer):
    answers = serializers.JSONField(write_only=True)
    
    class Meta:
        model = QuizScore
        fields = ['quiz', 'score', 'time_taken', 'answers']
        
    def create(self, validated_data):
        answers = validated_data.pop('answers')
        user = self.context['request'].user
        quiz_score = QuizScore.objects.create(user=user, **validated_data)
        quiz_score.set_answers(answers)
        quiz_score.save()
        return quiz_score

class StudyRecommendationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    subchapter = SubchapterDetailSerializer(read_only=True)
    
    class Meta:
        model = StudyRecommendation
        fields = ['id', 'user', 'subchapter', 'recommendation', 'created_at']

class LeaderboardSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = QuizScore
        fields = ['id', 'user', 'quiz', 'score', 'time_taken', 'completed_at']