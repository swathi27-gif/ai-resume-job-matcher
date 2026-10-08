# AI Resume Analyzer + Job Match Recommendation System

A full-stack web application that analyzes resumes using AI and recommends suitable job roles based on the candidate's skills.

## Features

- Upload resume in PDF format
- Extract resume text automatically
- AI-powered resume analysis using Ollama and Llama 3.2
- Extract skills, education, experience and projects
- Generate resume score
- Identify missing skills
- Match candidate skills with job requirements
- Calculate job match percentage
- Search and filter recommended jobs
- Store analyzed resumes in MongoDB Atlas

## Tech Stack

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js
- Multer
- PDF-Parse

### AI
- Ollama
- Llama 3.2

### Database
- MongoDB Atlas
- Mongoose

## Project Flow

Resume PDF
→ Text Extraction
→ AI Resume Analysis
→ Skill Extraction
→ Job Matching
→ Match Percentage
→ MongoDB Storage

## Project Structure

```text
ai-resume-job-matcher/
├── backend/
│   ├── jobs.js
│   ├── Resume.js
│   ├── server.js
│   └── .env
├── frontend/
│   └── src/
├── .gitignore
└── package.json