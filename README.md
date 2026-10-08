# 🎙️ LinguaAI — Adaptive AI Language Learning Tutor

An end-to-end AI-powered Language Learning Tutor built for rapid, personalized language acquisition. Powered by **FastAPI**, **Groq (Llama 3.3 70B)**, **Local Whisper Speech-to-Text & Language Detection**, **Web SpeechSynthesis**, and **React**.

---

## 🌟 Core Learning Loop

```text
ASSESS
   ↓
IDENTIFY WEAKNESS
   ↓
PERSONALIZE
   ↓
PRACTICE
   ↓
SPEAK
   ↓
TRANSCRIBE
   ↓
EVALUATE
   ↓
ADAPT
   ↓
REASSESS
   ↓
SCORE
   ↓
RECOMMEND
```

---

## 🚀 Key Features

1. **Multilingual Support & Goal Selection**:
   - Supports English, Hindi, Telugu, Spanish, French, German, and Japanese.
   - Tailored learning goals: *Daily Conversation, Travel & Exploration, Job Interview, General Mastery, Academic*.
2. **AI Initial Diagnostic Assessment**:
   - Generates 5 dynamic diagnostic questions across Grammar, Vocabulary, Sentence Construction, and Conversation.
   - Evaluates answers to pinpoint exact, actionable weak areas (e.g., "Past tense irregular verbs", "Definite articles").
3. **Personalized & Adaptive Practice**:
   - Exercises specifically generated to address identified weaknesses.
   - Dynamically adapts the follow-up question based on mistakes made in the previous step.
4. **Speech & Audio Intelligence**:
   - **Speech-to-Text & Spoken Language Identification**: Local Whisper model automatically transcribes speech and detects spoken language, warning if you speak in the wrong language.
   - **Text-to-Speech**: Browser `SpeechSynthesis` reads questions and corrections aloud with native accent voices.
   - **Text Fallback**: Full fallback to typing answers if a microphone is unavailable.
5. **SQLite Persistence & Analytics Dashboard**:
   - Tracks session scores, improvement deltas (`+X`), mistake histories with explanations, and next topic recommendations.

---

## 🏗️ Architecture

```text
                     USER
                      │
             ┌────────┴────────┐
             ↓                 ↓
          TEXT INPUT        VOICE INPUT (Microphone Web Audio)
             │                 │
             │              Local Whisper (STT + Language Detection)
             │                 │
             │             Transcript + Language Match
             │                 │
             └────────┬────────┘
                      ↓
               React UI (Vite + Tailwind CSS)
                      │
             REST API (JSON)
                      │
                      ↓
               FastAPI Backend
                      │
                      ├─► SQLite Database (Users, Sessions, Progress, Mistakes)
                      │
                      └─► Groq Service (Centralized Groq API)
                               │
                               ▼
                         Llama 3.3 70B
                      (Structured JSON)
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti, Axios |
| **Backend** | Python 3.13, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2 |
| **LLM Inference** | **Groq API** running **Llama 3.3 70B** (`llama-3.3-70b-versatile`) |
| **Speech-to-Text** | **Local Whisper** (`faster-whisper` / `openai-whisper` base model) |
| **Text-to-Speech** | **Browser SpeechSynthesis API** (No paid TTS required) |
| **Database** | **SQLite** (`language_tutor.db`) |

---

## 🔑 Groq API & Environment Configuration

Create a `.env` file inside `backend/`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=base
DATABASE_URL=sqlite:///./language_tutor.db
PORT=8000
```

> **Security Note:** The `GROQ_API_KEY` is exclusively managed on the FastAPI backend and is **never** exposed to the frontend or browser.

---

## 💻 Local Setup & Execution Guide (Windows / Mac / Linux)

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm**
- **FFmpeg** (For Whisper audio decoding)

#### Installing FFmpeg on Windows:
```powershell
winget install -e --id Gyan.FFmpeg
```
*(Or download standard binaries and add to your system PATH)*

---

### Step 1: Backend Setup & Launch

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# (On Linux/macOS: source venv/bin/activate)

# Install backend dependencies
pip install -r requirements.txt

# Run FastAPI backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be live at `http://127.0.0.1:8000` (Interactive Swagger docs at `http://127.0.0.1:8000/docs`).

---

### Step 2: Frontend Setup & Launch

```powershell
# In a new terminal, navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

The application UI will open at `http://localhost:3000` (or `http://localhost:5173`).

---

## 📡 API Endpoints Reference

### Assessment APIs
- `POST /api/assessment/start`: Initializes learner profile and generates 5 diagnostic questions.
- `POST /api/assessment/evaluate`: Evaluates responses, computes category scores, and extracts weak areas.

### Practice & Lesson APIs
- `POST /api/lesson/start`: Generates targeted first exercise addressing top identified weakness.
- `POST /api/lesson/evaluate`: Evaluates user voice/text answer, provides corrections, explanation, mistake breakdown, and crafts adaptive next question.
- `POST /api/lesson/final-assessment`: Calculates total growth (+X delta), persistent weaknesses, and next topic recommendations.

### Voice & Analytics APIs
- `POST /api/voice/transcribe`: Accepts audio file, runs local Whisper STT, identifies spoken language, verifies target language match, and removes raw audio.
- `GET /api/progress/{user_id}`: Retrieves comprehensive skill levels, progress percentage, and mistake history from SQLite.
- `GET /api/health`: System health and Groq / Whisper status check.

---

## 🎬 Final Demo Walkthrough Flow

1. **Launch App**: Open `http://localhost:3000`.
2. **Setup**: Select Language (`Spanish` / `English` / `Telugu` / `Hindi`), Expected Level (`Intermediate`), Goal (`Daily Conversation`).
3. **Assessment**: Complete the 5 diagnostic questions. Click `🔊 Listen` to hear questions read aloud.
4. **Weakness Diagnosis**: Review scores (Grammar, Vocabulary, Conversation) and specific diagnosed weak areas.
5. **Personalized Practice**:
   - Tutor generates a customized situational prompt targeting the weak area.
   - Click `🔊 Listen to Tutor` to hear native pronunciation.
   - Click `🎙️ Click to Speak` and answer in target language (or type via Text Fallback).
   - Local Whisper transcribes speech and detects language match.
   - Llama 3.3 70B delivers instant score, natural phrasing correction, explanation, and specific mistake highlights.
6. **Adaptive Drill**: Next question dynamically adapts to reinforce the correction.
7. **Final Assessment**: View **LESSON COMPLETE 🎉** report with initial vs final score growth (+delta), strengths developed, and recommended next topic.
8. **Dashboard**: Inspect permanent SQLite progress analytics and mistake history.
