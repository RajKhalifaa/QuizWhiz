#!/usr/bin/env python
"""
Script to run the Django development server.
"""
import os
import sys
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_project.settings')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Django development server.")
    
    # Add arguments
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to (default: 8000)")
    
    args = parser.parse_args()
    
    # Import Django's management module
    from django.core.management import execute_from_command_line
    
    # Run the server
    print(f"Starting Django development server at {args.host}:{args.port}")
    execute_from_command_line(['manage.py', 'runserver', f'{args.host}:{args.port}'])