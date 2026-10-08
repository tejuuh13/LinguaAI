import logging
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ..database.database import get_db
from ..database.models import Mistake, User, Progress
from ..services.groq_service import _call_groq_json

router = APIRouter(tags=["mistakes", "revision"])
logger = logging.getLogger(__name__)


class MistakeQuizItem(BaseModel):
    mistake_id: int
    category: str
    original_wrong_phrase: str
    target_correct_phrase: str
    prompt: str
    explanation: Optional[str] = None


class RevisionOverviewResponse(BaseModel):
    user_id: int
    total_mistakes: int
    most_frequent_weakness: str
    weakness_breakdown: Dict[str, int]
    quiz_items: List[MistakeQuizItem]


class RetryAttemptRequest(BaseModel):
    mistake_id: int
    user_attempt: str
    user_id: Optional[int] = 1


class RetryAttemptResponse(BaseModel):
    is_correct: bool
    feedback: str
    score: int
    resolved: bool


@router.get("/api/revision/mistakes/{user_id}", response_model=RevisionOverviewResponse)
@router.get("/api/mistakes/overview/{user_id}", response_model=RevisionOverviewResponse)
def get_revision_mistakes_overview(user_id: int, db: Session = Depends(get_db)):
    """
    GET /api/revision/mistakes/{user_id}
    Retrieves all recorded mistakes from SQLite, groups by topic, and identifies the most frequent weakness.
    """
    mistakes = db.query(Mistake).filter(Mistake.user_id == user_id).order_by(Mistake.id.desc()).all()

    categories = [m.category or "Grammar" for m in mistakes]
    counts = dict(Counter(categories))
    most_frequent = max(counts, key=counts.get) if counts else "Past Tense Verbs"

    quiz_items = []
    for m in mistakes[:10]:
        quiz_items.append(
            MistakeQuizItem(
                mistake_id=m.id,
                category=m.category or "Grammar",
                original_wrong_phrase=m.original_text,
                target_correct_phrase=m.correct_text,
                prompt=f"Correct this error: '{m.original_text}'",
                explanation=m.explanation,
            )
        )

    if not quiz_items:
        # Fallback starter revision items
        quiz_items = [
            MistakeQuizItem(
                mistake_id=1,
                category="Past Tense Verbs",
                original_wrong_phrase="Yesterday I go to market",
                target_correct_phrase="Yesterday I went to market",
                prompt="Fix the verb tense: 'Yesterday I go to market.'",
                explanation="Use past tense 'went' for events that took place yesterday.",
            ),
            MistakeQuizItem(
                mistake_id=2,
                category="Articles",
                original_wrong_phrase="I want to buy car",
                target_correct_phrase="I want to buy a car",
                prompt="Add the missing article: 'I want to buy car.'",
                explanation="Singular countable nouns require an article ('a car').",
            ),
            MistakeQuizItem(
                mistake_id=3,
                category="Prepositions",
                original_wrong_phrase="She is married with a doctor",
                target_correct_phrase="She is married to a doctor",
                prompt="Fix the preposition: 'She is married with a doctor.'",
                explanation="In English, use 'married to', not 'married with'.",
            ),
        ]
        counts = {"Past Tense Verbs": 1, "Articles": 1, "Prepositions": 1}
        most_frequent = "Past Tense Verbs"

    return RevisionOverviewResponse(
        user_id=user_id,
        total_mistakes=len(mistakes),
        most_frequent_weakness=most_frequent,
        weakness_breakdown=counts,
        quiz_items=quiz_items,
    )


@router.get("/api/mistakes/quiz/{user_id}", response_model=List[MistakeQuizItem])
def get_mistake_revision_quiz(user_id: int, db: Session = Depends(get_db)):
    """
    GET /api/mistakes/quiz/{user_id}
    Retrieves dynamic retry questions derived from learner's recorded mistakes.
    """
    overview = get_revision_mistakes_overview(user_id, db)
    return overview.quiz_items


@router.post("/api/revision/evaluate", response_model=RetryAttemptResponse)
@router.post("/api/mistakes/retry", response_model=RetryAttemptResponse)
def submit_retry_attempt(req: RetryAttemptRequest, db: Session = Depends(get_db)):
    """
    POST /api/revision/evaluate & POST /api/mistakes/retry
    Validates learner's retry attempt on a past mistake with Groq LLM validation and updates SQLite.
    """
    mistake = db.query(Mistake).filter(Mistake.id == req.mistake_id).first()

    target_phrase = mistake.correct_text if mistake else "correct answer"
    user_attempt = req.user_attempt.strip()

    # Prompt Groq for intelligent semantic evaluation of correction
    prompt = f"""Evaluate if this learner's corrected sentence accurately fixes the grammar/vocabulary error.

Original Error: "{mistake.original_text if mistake else 'incorrect phrase'}"
Target Correction: "{target_phrase}"
Student's Retry Attempt: "{user_attempt}"

Return ONLY a JSON object:
{{
  "is_correct": true,
  "score": 100,
  "feedback": "Encouraging explanation..."
}}
"""
    data = _call_groq_json(prompt, max_tokens=300)

    if data and "is_correct" in data:
        is_corr = bool(data.get("is_correct"))
        score = int(data.get("score", 100 if is_corr else 50))
        feedback = data.get("feedback", "Good effort!")
    else:
        # Fallback comparison
        attempt_clean = user_attempt.lower()
        target_clean = target_phrase.lower()
        is_corr = (target_clean in attempt_clean or attempt_clean in target_clean or attempt_clean == target_clean)
        score = 100 if is_corr else 50
        feedback = "🎉 Spot on! You corrected the mistake accurately." if is_corr else f"Almost! Expected: '{target_phrase}'."

    if is_corr and mistake:
        try:
            mistake.resolved = True
            progress = db.query(Progress).filter(Progress.user_id == mistake.user_id).first()
            if progress:
                progress.grammar_score = min(100.0, (progress.grammar_score or 70.0) + 2.0)
            db.commit()
        except Exception as e:
            logger.warning(f"Error marking mistake resolved in SQLite: {e}")

    return RetryAttemptResponse(
        is_correct=is_corr,
        feedback=feedback,
        score=score,
        resolved=is_corr,
    )
