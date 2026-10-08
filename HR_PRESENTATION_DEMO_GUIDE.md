# 🎯 LinguaAI — Official HR Presentation & Project Demo Guide

This guide is designed for presenting **LinguaAI — Enterprise Adaptive AI Language Learning Tutor** to HR executives, technical recruiters, judges, and evaluation panels.

---

## 📁 Repository Architecture & Folder Structure Map

When presenting the codebase to an HR interviewer or technical lead, use this clean architecture breakdown:

```text
ai-language-tutor/
│
├── 🧠 backend/                     # High-Performance Asynchronous Python Core (FastAPI)
│   ├── database/                  # SQLite Schema, SQLAlchemy ORM Models & Migrations
│   │   ├── models.py              # User, Progress, Mistake, Vocab, Plan, Interview ORM models
│   │   └── database.py            # Session pooling & path resolution
│   ├── routes/                    # Modular REST API Endpoints (8 Business Domains)
│   │   ├── auth.py                # Salted SHA-256 Authentication & Multi-Device Sessions
│   │   ├── translation_practice.py# 10-Level Translation Quest with Transliteration
│   │   ├── tutor_chat.py          # Dedicated Real-Time Conversational AI Tutor
│   │   ├── interview.py           # Technical & HR Mock Interview Simulator with Reports
│   │   ├── vocab.py               # Spaced Repetition Vocabulary & Lexicon Engine
│   │   ├── mistakes.py            # Weakness Identification & Mistake Revision Lab
│   │   ├── plan.py                # 7-Day & 4-Week Dynamic Curriculum Generator
│   │   ├── progress.py            # Learner Skill Analytics & Delta Calculation
│   │   ├── assessment.py          # Initial 5-Question Diagnostic Assessment
│   │   ├── lesson.py              # Step-by-Step Adaptive Learning Flow
│   │   ├── voice.py               # Multipart Audio Upload & Transcription Pipe
│   │   └── admin.py               # Aggregated Telemetry & HR Metrics Engine
│   ├── services/                  # Business Logic & Machine Learning Services
│   │   ├── groq_service.py        # Centralized Llama 3.3 70B LLM Inference Engine
│   │   ├── whisper_service.py     # Local Whisper Speech-to-Text & Language Detector
│   │   └── assessment_service.py  # Score Aggregation & SQLite Persistence
│   ├── tests/                     # Pytest Automated Test Suite (15 Test Cases Passing)
│   │   ├── test_all_features.py   # Comprehensive End-to-End API Integration Suite
│   │   └── test_api.py            # Core Assessment, Voice, & Progress Tests
│   └── main.py                    # Application Entrypoint with CORS & Global Routers
│
├── 💻 frontend/                    # Modern Single-Page Application (React 19 + Vite)
│   ├── src/
│   │   ├── pages/                 # Full-Featured UI Views
│   │   │   ├── AuthPage.jsx           # Secure Sign In & Registration Interface
│   │   │   ├── PracticePage.jsx       # 10-Level From ⇄ To Translation & Speech Quest
│   │   │   ├── ChatPage.jsx           # Live AI Conversational Tutor
│   │   │   ├── MockInterviewPage.jsx  # Career & Behavioral Interview Simulator
│   │   │   ├── VocabGrammarPage.jsx   # Spaced Repetition Lexicon & Vocab Cards
│   │   │   ├── MistakeRevisionPage.jsx# Mistake Recovery & Weak Topic Lab
│   │   │   ├── LearningPlanPage.jsx   # 7-Day Intensive + 4-Week Curriculum Roadmap
│   │   │   ├── DashboardPage.jsx      # Skill Deltas, Streak, & KPI Dashboard
│   │   │   └── AdminDashboardPage.jsx # HR & System Telemetry Control Center
│   │   ├── components/            # Reusable UI Components
│   │   │   ├── Navbar.jsx             # Executive Header with Language & Profile Badge
│   │   │   ├── VoiceRecorder.jsx      # Microphone Web Audio Stream with Live Fallback
│   │   │   ├── AudioPlayer.jsx        # Native Web SpeechSynthesis Text-to-Speech
│   │   │   ├── ScoreCard.jsx          # Progress & Skill Breakdown Visualizer
│   │   │   └── MistakeList.jsx        # Mistake Explanation & Categorization Chips
│   │   ├── hooks/
│   │   │   └── useAudioRecorder.js    # Zero-Latency Speech-to-Text Capture Hook
│   │   └── services/
│   │       └── api.js                 # Unified Axios Client for all 8 Backend Domains
│   └── package.json               # Frontend Tooling & Production Build Script
│
└── 📄 README.md                   # Full Technical Documentation & Setup Manual
```

---

## 🎙️ 5-Minute Live Presentation Script for HR

### ⏱️ Minute 1: Problem Statement & Innovation
> *"Hello everyone. Traditional language learning apps rely on static, multiple-choice quizzes that fail to develop spontaneous spoken fluency and professional communication. **LinguaAI** is an enterprise-grade adaptive AI Language Learning Tutor. It combines local speech recognition via Whisper, ultra-fast LLM reasoning via Groq Llama 3.3 70B, and spaced repetition SQLite persistence to deliver real-time pronunciation feedback, customized learning plans, and career mock interviews."*

### ⏱️ Minute 2: Multi-Device Sync & 10-Level Practice Quest
> *"Let's see it live. First, we have **Salted SHA-256 Authentication**. Because our backend runs on `0.0.0.0`, any teammate on our local network can log in simultaneously from their laptop at `http://10.250.5.88:3000/` and sync their profile instantly.*
>
> *Next, in the **10-Level Practice Tab**, we solved a major pain point for beginners learning languages with unfamiliar alphabets like Telugu or Hindi: we generate **English Romanized Transliteration** ('HOW TO SPEAK IN ENGLISH LETTERS') alongside word-by-word pronunciation cards. Learners can speak into the microphone, get instant pronunciation accuracy scores, and unlock levels upon scoring 75%+."*

### ⏱️ Minute 3: AI Conversational Tutor & AI Mock Interview
> *"Next is our **AI Tutor Chat**, which acts as a personal language coach aware of your goals and weak areas, offering real-time grammar corrections and pronunciation guides.*
>
> *For job seekers, we built the **AI Mock Interview Simulator**. It supports Technical, HR Behavioral, and Management interviews, evaluating candidates on 4 distinct vectors: **Communication, Grammar, Vocabulary, and Relevance**, before generating a comprehensive hiring report with actionable strengths and AI recommendations."*

### ⏱️ Minute 4: Spaced Repetition Lexicon & Mistake Revision
> *"In the **Vocabulary Deck**, we implement algorithmic spaced repetition where learners track words by mastery score, synonyms, and antonyms, with dynamic AI word generation.*
>
> *In the **Mistake Revision Lab**, the system groups every recorded error from SQLite, identifies your most frequent weakness (such as Past Tense Verbs), and automatically generates targeted retries until mastery is achieved."*

### ⏱️ Minute 5: Analytics & HR Telemetry Control Center
> *"Finally, our **Performance Analytics Dashboard** tracks learning streaks (`🔥 7 Day Streak`), score improvement deltas (`Grammar: 48% -> 74% (+26%)`), and words mastered.*
>
> *Our **HR / Admin Telemetry Dashboard** provides aggregated analytics across all learners, displaying total active enrollment, average proficiency improvements, most common mistake categories, and system pipeline health."*

---

## 💡 Top Anticipated HR / Technical Questions & Answers

| Question | Strong Answer |
| :--- | :--- |
| **Q1: Why did you choose SQLite with SQLAlchemy?** | *"SQLite provides zero-latency, serverless local persistence that is perfectly portable for offline-capable edge deployments and hackathon demos, while SQLAlchemy ORM allows seamless migration to PostgreSQL or MySQL in production with zero code refactoring."* |
| **Q2: How does the speech pipeline avoid latency?** | *"We employ a hybrid architecture: client-side Web Speech API for instantaneous live visual transcription, paired with a local `faster-whisper` PyTorch model on the backend for multi-lingual acoustic analysis and language verification."* |
| **Q3: How do you prevent LLM hallucination?** | *"We enforce strict Pydantic JSON schemas with deterministic system prompts, temperature tuning, and fallback heuristics in `groq_service.py` to ensure consistent data contracts."* |
| **Q4: How did you test the application?** | *"We built an automated Pytest test suite covering all 8 API modules and business flows. All 15 automated integration test cases pass with 100% success in 2.24s."* |
