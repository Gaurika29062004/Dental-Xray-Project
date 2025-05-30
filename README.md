# 🦷 Dental X-Ray AI Diagnostic System

A full-stack AI-powered application to analyze dental DICOM X-ray images, annotate findings, and generate diagnostic reports.

---

## 🚀 Features

- Upload and view dental DICOM X-rays
- AI-based annotation using Roboflow
- Dynamic diagnostic report generation using GPT (OpenRouter API)
- Download report as PDF
- Patient info capture (Name, Age, Gender)
- Dark/light mode toggle
- Welcome screen with smooth transition

---

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router
- **Backend**: FastAPI, Python, Roboflow API, OpenRouter AI
- **PDF Export**: html2pdf.js

---

## 🗂 Project Structure

dental-xray-ai/
├── backend/
│ └── main.py, model.py, etc.
├── frontend/
│ ├── src/
│ │ ├── App.js
│ │ ├── WelcomeScreen.js
│ │ ├── App.css
│ │ └── ...
│ └── public/
├── README.md
└── .gitignore

Backend Setup (FastAPI)
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8010

Frontend Setup (React)
cd frontend
npm install
npm start
