# AI-Powered Quiz Platform for Malaysian Standard 1 Students

This Django-based backend provides an API for an AI-powered educational quiz application for Malaysian Standard 1 students. The system allows teachers to upload study materials and automatically generates quizzes from these materials using OpenAI's GPT models. Students can take quizzes and receive personalized learning recommendations based on their performance.

## Features

- **Hierarchical Content Structure**: Subjects > Chapters > Subchapters > Study Materials
- **Study Material Management**: Upload and organize PDFs and DOCX files
- **AI-Powered Quiz Generation**: Create quizzes with varying difficulty levels (Beginner, Intermediate, Advanced)
- **Quiz Taking and Scoring**: Students can take quizzes and receive immediate feedback
- **Performance Analytics**: Track student progress and performance
- **Personalized Recommendations**: AI-generated study recommendations based on quiz results
- **Leaderboards**: Competitive element to motivate students

## Setup and Installation

### Prerequisites

- Python 3.8+
- PostgreSQL database
- OpenAI API key

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Database settings
PGDATABASE=your_database_name
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGHOST=your_database_host
PGPORT=your_database_port

# OpenAI API settings
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. Install required Python packages:

```bash
pip install -r requirements.txt
```

2. Run the setup script to create database tables and initial data:

```bash
python setup.py
```

3. Test the setup:

```bash
python test_setup.py
```

4. Start the development server:

```bash
python run_server.py
```

The API will be available at http://localhost:8000/api/

## Usage

### Admin Interface

Access the Django admin interface at http://localhost:8000/admin/ to manage subjects, chapters, subchapters, study materials, quizzes, and user data.

### Command-line Tools

#### Upload Study Materials

```bash
python upload_material.py --list-subchapters  # List available subchapters
python upload_material.py --list-users  # List available users

python upload_material.py --subchapter-id 1 --file-path /path/to/document.pdf --title "Title" --description "Description" --username admin
```

#### Generate Quizzes

```bash
python generate_quizzes.py --list  # List available study materials

python generate_quizzes.py --material-id 1 --level Beginner  # Generate quiz for specific material
python generate_quizzes.py --all --level Intermediate  # Generate quizzes for all materials
```

## API Endpoints

### Authentication

- `POST /api/register/`: Register a new user
- `POST /api/login/`: Log in and obtain a token
- `GET /api/user/`: Get current user details

### Content Management

- `GET /api/subjects/`: List subjects
- `GET /api/chapters/?subject_id=1`: List chapters for a subject
- `GET /api/subchapters/?chapter_id=1`: List subchapters for a chapter
- `GET /api/materials/?subchapter_id=1`: List study materials for a subchapter

### Quizzes

- `POST /api/generate-quiz/1/`: Generate a quiz for a study material
- `GET /api/quizzes/?material_id=1`: List quizzes for a study material
- `GET /api/quizzes/1/`: Get details of a specific quiz
- `POST /api/scores/`: Submit quiz score
- `GET /api/leaderboard/material/1/`: Get leaderboard for a study material

### Recommendations

- `GET /api/recommendations/`: Get personalized study recommendations
- `GET /api/student-report/`: Get detailed student performance report