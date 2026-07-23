# SOCRATES AI Microservice (FastAPI)

## Overview
This directory contains the Python FastAPI microservice that handles AI/ML workloads for SOCRATES, including AI Tutoring, Smart Tutor Matchmaking, RAG Vector Search, and Session Summarization.

## Quick Start Commands

```bash
# Navigate to ai-service directory
cd ai-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Uvicorn development server
uvicorn main:app --reload --port 8000
```

## API Documentation
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`
