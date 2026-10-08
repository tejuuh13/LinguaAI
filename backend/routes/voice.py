import os
import uuid
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from ..models.schemas import VoiceTranscribeResponse
from ..services.whisper_service import WhisperService

router = APIRouter(prefix="/api/voice", tags=["voice"])
logger = logging.getLogger(__name__)

TEMP_AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_audio")
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(
    audio: UploadFile = File(...),
    target_language: str = Form("English"),
):
    """
    POST /api/voice/transcribe
    Accepts recorded voice audio from browser, processes via local Whisper model,
    detects spoken language, transcribes speech, and compares against target_language.
    Temporary audio is deleted immediately after transcription for security.
    """
    ext = os.path.splitext(audio.filename or "")[1]
    if not ext:
        ext = ".webm"

    temp_filename = f"rec_{uuid.uuid4().hex[:10]}{ext}"
    temp_path = os.path.join(TEMP_AUDIO_DIR, temp_filename)

    try:
        # Save temporary audio file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # Transcribe & detect language with Whisper
        result = WhisperService.transcribe_audio(temp_path, target_language=target_language)

        return VoiceTranscribeResponse(
            transcript=result.get("transcript", ""),
            detected_language=result.get("detected_language", "Unknown"),
            language_match=result.get("language_match", True),
            confidence=result.get("confidence", 1.0),
            warning=result.get("warning"),
            error=result.get("error"),
        )
    except Exception as e:
        logger.error(f"Voice upload/transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")
    finally:
        # Security: Remove temp audio recording
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
