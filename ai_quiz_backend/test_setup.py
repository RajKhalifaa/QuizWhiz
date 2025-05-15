"""
Test script to verify the configuration and setup of the Django project.
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

# Now we can import Django models
from django.contrib.auth.models import User
from quiz_api.models import Subject, Chapter, Subchapter

def test_database_connection():
    """Test connection to the database by performing a simple query."""
    try:
        # Try to get the count of users
        user_count = User.objects.count()
        print(f"Database connection successful. There are {user_count} users in the database.")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

def test_openai_api_key():
    """Test if the OpenAI API key is properly set."""
    from django.conf import settings
    
    if settings.OPENAI_API_KEY:
        print("OpenAI API key is set.")
        return True
    else:
        print("OpenAI API key is not set. Please make sure OPENAI_API_KEY is in your environment.")
        return False

def test_model_creation():
    """Test creating and saving a model instance."""
    try:
        # Create a test subject
        subject, created = Subject.objects.get_or_create(
            name="Test Subject",
            defaults={"description": "This is a test subject created by the setup script."}
        )
        
        if created:
            print(f"Created new test subject: {subject}")
        else:
            print(f"Found existing test subject: {subject}")
        
        # Create a test chapter
        chapter, created = Chapter.objects.get_or_create(
            name="Test Chapter",
            subject=subject,
            defaults={"description": "This is a test chapter.", "order": 1}
        )
        
        if created:
            print(f"Created new test chapter: {chapter}")
        else:
            print(f"Found existing test chapter: {chapter}")
        
        # Create a test subchapter
        subchapter, created = Subchapter.objects.get_or_create(
            name="Test Subchapter",
            chapter=chapter,
            defaults={"description": "This is a test subchapter.", "order": 1}
        )
        
        if created:
            print(f"Created new test subchapter: {subchapter}")
        else:
            print(f"Found existing test subchapter: {subchapter}")
            
        return True
    except Exception as e:
        print(f"Error creating test models: {e}")
        return False

if __name__ == "__main__":
    print("Testing Django setup...")
    
    db_success = test_database_connection()
    openai_success = test_openai_api_key()
    model_success = test_model_creation() if db_success else False
    
    if db_success and openai_success and model_success:
        print("\n✅ Setup test completed successfully! The application is properly configured.")
    else:
        print("\n❌ Setup test failed. Please address the issues above.")