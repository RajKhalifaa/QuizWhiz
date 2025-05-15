"""
Script to upload study materials from the command line.

This script allows teachers to upload PDF or DOCX files as study materials
without having to use the web interface.
"""
import os
import sys
import django
import argparse
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
load_dotenv()

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_project.settings')
django.setup()

# Import Django models after setting up Django
from django.contrib.auth.models import User
from quiz_api.models import Subject, Chapter, Subchapter, StudyMaterial
from django.core.files.base import ContentFile
import shutil

def get_file_size_str(file_path):
    """Get file size as a string in KB or MB."""
    size_bytes = os.path.getsize(file_path)
    size_kb = size_bytes / 1024
    
    if size_kb < 1024:
        return f"{size_kb:.2f} KB"
    else:
        size_mb = size_kb / 1024
        return f"{size_mb:.2f} MB"

def upload_material(subchapter_id, file_path, title, description, username):
    """Upload a study material file to a subchapter."""
    try:
        # Check if the file exists
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' does not exist.")
            return False
        
        # Check if the file is a PDF or DOCX
        file_extension = os.path.splitext(file_path)[1].lower()
        if file_extension not in ['.pdf', '.docx']:
            print(f"Error: File must be a PDF or DOCX, but got '{file_extension}'.")
            return False
        
        # Get the subchapter
        try:
            subchapter = Subchapter.objects.get(id=subchapter_id)
        except Subchapter.DoesNotExist:
            print(f"Error: Subchapter with ID {subchapter_id} does not exist.")
            return False
        
        # Get the user
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            print(f"Error: User '{username}' does not exist.")
            return False
        
        # Create the media directory if it doesn't exist
        media_root = os.path.join(BASE_DIR, 'media')
        study_materials_dir = os.path.join(media_root, 'study_materials')
        os.makedirs(study_materials_dir, exist_ok=True)
        
        # Get file information
        file_name = os.path.basename(file_path)
        file_size_str = get_file_size_str(file_path)
        file_type = file_extension[1:]  # Remove the dot
        
        # Copy the file to the media directory
        destination_path = os.path.join(study_materials_dir, file_name)
        shutil.copy2(file_path, destination_path)
        
        # Get the relative path for the database
        relative_path = os.path.join('study_materials', file_name)
        
        # Create the study material entry
        study_material = StudyMaterial.objects.create(
            subchapter=subchapter,
            title=title,
            description=description,
            document=relative_path,
            file_type=file_type,
            file_size=file_size_str,
            uploaded_by=user
        )
        
        print(f"Successfully uploaded '{file_name}' as '{title}' to subchapter '{subchapter.name}'.")
        return True
        
    except Exception as e:
        print(f"Error uploading material: {e}")
        return False

def list_subchapters():
    """List all available subchapters with their IDs."""
    subchapters = Subchapter.objects.select_related('chapter__subject').all()
    
    if not subchapters:
        print("No subchapters found. Please create some subchapters first.")
        return
    
    print("\nAvailable subchapters:")
    print("-" * 80)
    print(f"{'ID':4} | {'Subject':15} | {'Chapter':20} | {'Subchapter':25}")
    print("-" * 80)
    
    for subchapter in subchapters:
        print(f"{subchapter.id:<4} | {subchapter.chapter.subject.name[:15]:15} | {subchapter.chapter.name[:20]:20} | {subchapter.name[:25]:25}")

def list_users():
    """List all available users with their usernames."""
    users = User.objects.filter(is_active=True)
    
    if not users:
        print("No users found. Please create some users first.")
        return
    
    print("\nAvailable users:")
    print("-" * 40)
    print(f"{'Username':15} | {'Is Staff':8} | {'Is Superuser':12}")
    print("-" * 40)
    
    for user in users:
        print(f"{user.username[:15]:15} | {str(user.is_staff):8} | {str(user.is_superuser):12}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload study materials from the command line.")
    
    # Add arguments
    parser.add_argument("--list-subchapters", action="store_true", help="List all available subchapters")
    parser.add_argument("--list-users", action="store_true", help="List all available users")
    parser.add_argument("--subchapter-id", type=int, help="ID of the subchapter to upload to")
    parser.add_argument("--file-path", help="Path to the PDF or DOCX file to upload")
    parser.add_argument("--title", help="Title of the study material")
    parser.add_argument("--description", help="Description of the study material")
    parser.add_argument("--username", help="Username of the teacher uploading the material")
    
    args = parser.parse_args()
    
    if args.list_subchapters:
        list_subchapters()
    elif args.list_users:
        list_users()
    elif all([args.subchapter_id, args.file_path, args.title, args.username]):
        upload_material(
            args.subchapter_id,
            args.file_path,
            args.title,
            args.description or "",
            args.username
        )
    else:
        parser.print_help()