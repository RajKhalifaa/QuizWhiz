import openai
import json
import os
import logging
from django.conf import settings

# Configure logging
logger = logging.getLogger(__name__)

# Set up OpenAI API key
openai.api_key = settings.OPENAI_API_KEY

def extract_text_from_doc(file_path):
    """Extract text from Word document."""
    try:
        import docx
        doc = docx.Document(file_path)
        return " ".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        logger.error(f"Error extracting text from Word document: {e}")
        return None

def extract_text_from_pdf(file_path):
    """Extract text from PDF document."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return None

def extract_text_from_document(file_path, file_type):
    """Extract text from document based on file type."""
    file_type = file_type.lower()
    if "pdf" in file_type:
        return extract_text_from_pdf(file_path)
    elif "doc" in file_type or "docx" in file_type:
        return extract_text_from_doc(file_path)
    else:
        logger.warning(f"Unsupported file type for text extraction: {file_type}")
        return None

def generate_quiz(text_content, level="Beginner", num_questions=5):
    """
    Generate quiz questions based on study material content.
    Level can be "Beginner", "Intermediate", or "Advanced"
    """
    # Adjust quiz difficulty based on level
    if level == "Beginner":
        difficulty = "simple, focusing on basic recall and understanding"
    elif level == "Intermediate":
        difficulty = "moderately challenging, testing application and analysis"
    else:  # Advanced
        difficulty = "challenging, requiring synthesis and evaluation"
        
    # Define the prompt with detailed instructions
    prompt = f"""
    Create a quiz with {num_questions} multiple-choice questions based on the following study material.
    Make the questions {difficulty}, appropriate for Malaysian Standard 1 students.
    
    Each question should have 4 options with only one correct answer.
    Include a brief explanation for the correct answer.
    
    Format the response as a JSON array of objects with the following structure:
    [
      {{
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "Option that is correct",
        "explanation": "Brief explanation of why this answer is correct"
      }},
      ...
    ]
    
    Study material:
    {text_content[:4000]}  # Limit text to avoid token limits
    """
    
    try:
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator specializing in creating quizzes for primary school students in Malaysia."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        content = response.choices[0].message.content
        questions = json.loads(content)
        
        # Ensure the response is in the expected format
        if isinstance(questions, dict) and "questions" in questions:
            questions = questions["questions"]
            
        # Validate quiz format
        if not isinstance(questions, list):
            logger.error("Invalid quiz format returned from OpenAI")
            questions = []
            
        return questions
        
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return []

def generate_study_recommendations(user_data, question_data):
    """
    Generate personalized study recommendations based on quiz performance.
    
    Parameters:
    - user_data: Dictionary with user quiz history and performance
    - question_data: Quiz questions and user's answers
    
    Returns:
    - A list of personalized recommendations
    """
    try:
        # Format the user data and quiz data for the API
        prompt = f"""
        Based on the student's performance data, generate personalized study recommendations.
        
        Student Performance Summary:
        Average Score: {user_data.get('avg_score', 'N/A')}%
        Strengths: {', '.join(user_data.get('strengths', ['N/A']))}
        Weaknesses: {', '.join(user_data.get('weaknesses', ['N/A']))}
        
        Recent Quiz Results:
        {json.dumps(question_data, indent=2)}
        
        Provide 3-5 specific, actionable recommendations to help this student improve.
        Format your response as a JSON array of recommendation strings.
        Make recommendations appropriate for a Standard 1 student in Malaysia.
        """
        
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert educational advisor specializing in primary education in Malaysia."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        recommendations = json.loads(content)
        
        # Check if the response is in expected format
        if isinstance(recommendations, dict) and "recommendations" in recommendations:
            recommendations = recommendations["recommendations"]
            
        if not isinstance(recommendations, list):
            logger.error("Invalid recommendations format returned from OpenAI")
            recommendations = []
            
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating study recommendations: {e}")
        return []