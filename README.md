# Performance Analyzer

A comprehensive web application for analyzing student and teacher performance in educational institutions. This system helps administrators, teachers, and students track academic progress, manage assessments, and generate insightful reports.

## Features

- **Admin Dashboard**: Manage students, teachers, subjects, departments, and semesters. View aggregate performance reports.
- **Teacher Portal**: Record marks, view class performance analysis, and track student progress.
- **Student Portal**: View personal academic performance, marks, and progress reports.
- **Performance Analysis**: Graphical visualization of performance data for better insights.

## Tech Stack

- **Backend**: Python, FastAPI
- **Frontend**: React.js
- **Database**: SQLite (Default) / PostgreSQL (Compatible)
- **Styling**: CSS Modules / Custom CSS

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js & npm

### Backend Setup

1. Navigate to the backend directory (or root if `main.py` is in `backend/`):
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. **Admin**: Log in to configure the department, semesters, and subjects. Add teachers and students.
2. **Teacher**: Log in to their dashboard to enter marks for their assigned subjects.
3. **Student**: Log in to view their performance dashboard.
