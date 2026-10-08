@echo off
title LinguaAI - Enterprise AI Language Learning Tutor
color 0b

echo =========================================================================
echo               LINGUAAI - AI LANGUAGE LEARNING TUTOR
echo                   Enterprise Hackathon Edition
echo =========================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://0.0.0.0:8000 ...
start "LinguaAI Backend (FastAPI)" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://0.0.0.0:3000 ...
start "LinguaAI Frontend (Vite)" cmd /k "cd frontend && npx vite --host 0.0.0.0 --port 3000"

timeout /t 2 /nobreak >nul

echo.
echo =========================================================================
echo LinguaAI is now running!
echo - Local URL:   http://localhost:3000/
echo - Network URL: http://10.250.5.88:3000/ (Open from any laptop on Wi-Fi)
echo - API Swagger: http://localhost:8000/docs
echo =========================================================================
echo.
echo Opening browser...
start http://localhost:3000/
pause
