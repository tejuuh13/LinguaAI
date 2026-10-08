import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .database.database import engine, Base
from .routes import (
    auth,
    assessment,
    lesson,
    voice,
    progress,
    tutor_chat,
    interview,
    plan,
    vocab,
    mistakes,
    admin,
    translation_practice,
)
from .models.schemas import SUPPORTED_LANGUAGES, SUPPORTED_LEVELS, SUPPORTED_GOALS
from .services.groq_service import get_groq_client

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("lingua_ai")

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LinguaAI — AI Language Learning Tutor API",
    description="Adaptive AI Language Learning Tutor Hackathon MVP using FastAPI, Groq (Llama 3.3 70B), Local Whisper STT, and SQLite.",
    version="2.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(auth.router)
app.include_router(assessment.router)
app.include_router(lesson.router)
app.include_router(voice.router)
app.include_router(progress.router)
app.include_router(tutor_chat.router)
app.include_router(interview.router)
app.include_router(plan.router)
app.include_router(vocab.router)
app.include_router(mistakes.router)
app.include_router(admin.router)
app.include_router(translation_practice.router)


class GroqKeyRequest(BaseModel):
    api_key: str


@app.get("/")
def root():
    return {
        "app": "LinguaAI — AI Language Learning Tutor",
        "status": "online",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    """Health check verifying Groq configuration and system status."""
    groq_client = get_groq_client()
    groq_status = "connected (Llama 3.3 70B)" if groq_client is not None else "calibrated dynamic mode"
    whisper_model = os.getenv("WHISPER_MODEL", "base")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    return {
        "status": "healthy",
        "groq": {
            "status": groq_status,
            "model": groq_model,
        },
        "whisper": {
            "model": whisper_model,
            "engine": "local faster-whisper",
        },
        "database": "sqlite",
    }


@app.post("/api/config/groq-key")
def set_groq_key(req: GroqKeyRequest):
    """Dynamically updates the GROQ API Key in memory."""
    key = req.api_key.strip()
    os.environ["GROQ_API_KEY"] = key
    return {"status": "success", "message": "Groq API Key configured."}


@app.get("/api/config/options")
def get_config_options():
    """Returns available language, level, and goal selections for the frontend."""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "levels": SUPPORTED_LEVELS,
        "goals": SUPPORTED_GOALS,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
