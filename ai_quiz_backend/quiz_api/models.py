from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class Subject(models.Model):
    """Subject/course model (e.g., Mathematics, Science)"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Chapter(models.Model):
    """Chapter within a subject"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.subject.name} - {self.name}"
    
    class Meta:
        ordering = ['order', 'name']

class Subchapter(models.Model):
    """Subchapter within a chapter"""
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='subchapters')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.chapter.name} - {self.name}"
    
    class Meta:
        ordering = ['order', 'name']

class StudyMaterial(models.Model):
    """Study materials for a subchapter (PDFs, DOCX files)"""
    subchapter = models.ForeignKey(Subchapter, on_delete=models.CASCADE, related_name='study_materials')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    document = models.FileField(upload_to='study_materials/')
    file_type = models.CharField(max_length=50)
    file_size = models.CharField(max_length=20)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_materials')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class Quiz(models.Model):
    """Quiz generated from study material"""
    LEVEL_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]
    
    material = models.ForeignKey(StudyMaterial, on_delete=models.CASCADE, related_name='quizzes')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    questions_json = models.TextField()  # Stores JSON representation of questions
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.material.title} Quiz - {self.level}"
    
    def get_questions(self):
        """Returns the quiz questions as Python objects"""
        return json.loads(self.questions_json)
    
    def set_questions(self, questions):
        """Sets the quiz questions from Python objects"""
        self.questions_json = json.dumps(questions)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Quizzes'

class QuizScore(models.Model):
    """Student scores on quizzes"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_scores')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='scores')
    score = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage score
    time_taken = models.CharField(max_length=20)  # Formatted time (e.g., "5:30")
    answers_json = models.TextField(blank=True, null=True)  # Stores student's answers as JSON
    completed_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz} - {self.score}%"
    
    def get_answers(self):
        """Returns the student's answers as Python objects"""
        if self.answers_json:
            return json.loads(self.answers_json)
        return []
    
    def set_answers(self, answers):
        """Sets the student's answers from Python objects"""
        self.answers_json = json.dumps(answers)
    
    class Meta:
        ordering = ['-completed_at']

class StudyRecommendation(models.Model):
    """Personalized study recommendations for students"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    subchapter = models.ForeignKey(Subchapter, on_delete=models.CASCADE, related_name='recommendations')
    recommendation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Recommendation for {self.user.username} - {self.subchapter.name}"
    
    class Meta:
        ordering = ['-created_at']
