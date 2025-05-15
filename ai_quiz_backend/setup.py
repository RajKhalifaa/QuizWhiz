"""
Setup script for the AI Quiz application.

This script:
1. Makes migrations for the models
2. Applies migrations to create database tables
3. Creates a superuser for accessing the admin panel
4. Creates initial data
"""
import os
import sys
import django
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_project.settings')
django.setup()

# Import Django modules after setting up Django
from django.core.management import call_command
from django.contrib.auth.models import User

def make_migrations():
    """Make migrations for the models."""
    print("Making migrations...")
    call_command('makemigrations', 'quiz_api')
    print("Migrations created.")

def apply_migrations():
    """Apply migrations to create database tables."""
    print("Applying migrations...")
    call_command('migrate')
    print("Migrations applied.")

def create_superuser():
    """Create a superuser for accessing the admin panel."""
    if User.objects.filter(is_superuser=True).exists():
        print("Superuser already exists.")
        return
    
    print("Creating superuser...")
    username = input("Enter username (default: admin): ") or "admin"
    email = input("Enter email (default: admin@example.com): ") or "admin@example.com"
    password = input("Enter password (default: adminpassword): ") or "adminpassword"
    
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created successfully.")

def create_initial_data():
    """Create initial data for the application."""
    from quiz_api.models import Subject, Chapter, Subchapter
    
    # Create sample subjects
    subjects = [
        {
            "name": "Mathematics",
            "description": "Mathematics for Standard 1 students"
        },
        {
            "name": "Science",
            "description": "Science for Standard 1 students"
        },
        {
            "name": "English",
            "description": "English language for Standard 1 students"
        },
        {
            "name": "Malay",
            "description": "Bahasa Malaysia for Standard 1 students"
        }
    ]
    
    print("Creating sample subjects...")
    created_subjects = []
    for subject_data in subjects:
        subject, created = Subject.objects.get_or_create(
            name=subject_data["name"],
            defaults={"description": subject_data["description"]}
        )
        created_subjects.append(subject)
        print(f"{'Created' if created else 'Found'} subject: {subject.name}")
    
    # Create sample chapters for Mathematics
    math_chapters = [
        {"name": "Numbers 1-10", "order": 1, "description": "Counting and writing numbers from 1 to 10"},
        {"name": "Addition", "order": 2, "description": "Basic addition of numbers"},
        {"name": "Subtraction", "order": 3, "description": "Basic subtraction of numbers"},
        {"name": "Shapes", "order": 4, "description": "Basic geometric shapes"}
    ]
    
    print("\nCreating sample chapters for Mathematics...")
    math_subject = next((s for s in created_subjects if s.name == "Mathematics"), None)
    created_chapters = []
    
    if math_subject:
        for chapter_data in math_chapters:
            chapter, created = Chapter.objects.get_or_create(
                name=chapter_data["name"],
                subject=math_subject,
                defaults={
                    "order": chapter_data["order"],
                    "description": chapter_data["description"]
                }
            )
            created_chapters.append(chapter)
            print(f"{'Created' if created else 'Found'} chapter: {chapter.name}")
        
        # Create sample subchapters for Numbers 1-10
        numbers_chapter = next((c for c in created_chapters if c.name == "Numbers 1-10"), None)
        if numbers_chapter:
            subchapters = [
                {"name": "Counting 1-5", "order": 1, "description": "Learning to count from 1 to 5"},
                {"name": "Counting 6-10", "order": 2, "description": "Learning to count from 6 to 10"},
                {"name": "Writing Numbers", "order": 3, "description": "Learning to write numbers 1 to 10"}
            ]
            
            print("\nCreating sample subchapters for Numbers 1-10...")
            for subchapter_data in subchapters:
                subchapter, created = Subchapter.objects.get_or_create(
                    name=subchapter_data["name"],
                    chapter=numbers_chapter,
                    defaults={
                        "order": subchapter_data["order"],
                        "description": subchapter_data["description"]
                    }
                )
                print(f"{'Created' if created else 'Found'} subchapter: {subchapter.name}")

if __name__ == "__main__":
    print("Setting up AI Quiz application...\n")
    
    make_migrations()
    apply_migrations()
    create_superuser()
    create_initial_data()
    
    print("\n✅ Setup completed successfully!")