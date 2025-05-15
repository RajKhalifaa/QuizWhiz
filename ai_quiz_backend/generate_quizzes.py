"""
Script to automatically generate quizzes from existing study materials.

This script allows teachers to generate quizzes for all or specific study materials
without having to use the web interface.
"""
import os
import sys
import django
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_project.settings')
django.setup()

# Import Django models and utilities after setting up Django
from quiz_api.models import StudyMaterial, Quiz
from quiz_api.openai_utils import extract_text_from_document, generate_quiz
import time

def list_study_materials():
    """List all study materials with their IDs."""
    materials = StudyMaterial.objects.select_related('subchapter__chapter__subject').all()
    
    if not materials:
        print("No study materials found. Please upload some materials first.")
        return
    
    print("\nAvailable study materials:")
    print("-" * 100)
    print(f"{'ID':4} | {'Title':30} | {'Subject/Chapter/Subchapter':40} | {'Existing Quizzes':20}")
    print("-" * 100)
    
    for material in materials:
        subject = material.subchapter.chapter.subject.name
        chapter = material.subchapter.chapter.name
        subchapter = material.subchapter.name
        hierarchy = f"{subject} > {chapter} > {subchapter}"
        
        # Get existing quizzes for this material
        quiz_count = Quiz.objects.filter(material=material).count()
        quiz_info = f"{quiz_count} quiz(es)"
        
        print(f"{material.id:<4} | {material.title[:30]:30} | {hierarchy[:40]:40} | {quiz_info:20}")

def generate_material_quiz(material_id, level):
    """Generate a quiz for a study material."""
    try:
        # Get the study material
        material = StudyMaterial.objects.get(id=material_id)
        
        # Check if a quiz with this level already exists
        existing_quiz = Quiz.objects.filter(material=material, level=level).first()
        if existing_quiz:
            print(f"A {level} quiz already exists for '{material.title}'. Skipping.")
            return False
        
        print(f"\nGenerating {level} quiz for '{material.title}'...")
        
        # Get the file path
        file_path = material.document.path
        
        # Extract text from the document
        text_content = extract_text_from_document(file_path, material.file_type)
        
        if not text_content:
            print(f"Error: Could not extract text from '{material.title}'.")
            return False
        
        # Generate quiz questions
        print("Calling OpenAI to generate questions...")
        questions = generate_quiz(text_content, level)
        
        if not questions:
            print("Error: Failed to generate quiz questions.")
            return False
        
        # Create the quiz
        quiz = Quiz.objects.create(
            material=material,
            level=level
        )
        quiz.set_questions(questions)
        quiz.save()
        
        print(f"Successfully generated a {level} quiz with {len(questions)} questions for '{material.title}'.")
        return True
        
    except StudyMaterial.DoesNotExist:
        print(f"Error: Study material with ID {material_id} does not exist.")
        return False
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return False

def generate_all_quizzes(level):
    """Generate quizzes for all study materials that don't have quizzes of the specified level."""
    materials = StudyMaterial.objects.all()
    
    if not materials:
        print("No study materials found. Please upload some materials first.")
        return
    
    success_count = 0
    total_count = 0
    
    for material in materials:
        # Check if a quiz with this level already exists
        existing_quiz = Quiz.objects.filter(material=material, level=level).first()
        if existing_quiz:
            print(f"A {level} quiz already exists for '{material.title}'. Skipping.")
            continue
        
        total_count += 1
        if generate_material_quiz(material.id, level):
            success_count += 1
            
        # Add a delay to avoid hitting API rate limits
        if total_count < len(materials):
            print("Waiting for 5 seconds before generating the next quiz...")
            time.sleep(5)
    
    print(f"\nGenerated {success_count} out of {total_count} quizzes at {level} level.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate quizzes from study materials.")
    
    # Add arguments
    parser.add_argument("--list", action="store_true", help="List all available study materials")
    parser.add_argument("--material-id", type=int, help="ID of the study material to generate a quiz for")
    parser.add_argument("--level", choices=["Beginner", "Intermediate", "Advanced"], 
                        default="Beginner", help="Difficulty level of the quiz")
    parser.add_argument("--all", action="store_true", help="Generate quizzes for all study materials")
    
    args = parser.parse_args()
    
    if args.list:
        list_study_materials()
    elif args.material_id:
        generate_material_quiz(args.material_id, args.level)
    elif args.all:
        generate_all_quizzes(args.level)
    else:
        parser.print_help()