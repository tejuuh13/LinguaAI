import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..models.schemas import (
    StartLessonRequest,
    StartLessonResponse,
    EvaluateLessonRequest,
    LessonEvaluation,
    FinalAssessmentRequest,
    FinalAssessmentEvaluation,
)
from ..services.groq_service import GroqService
from ..services.assessment_service import AssessmentService

router = APIRouter(prefix="/api/lesson", tags=["lesson"])


@router.post("/start", response_model=StartLessonResponse)
def start_lesson(req: StartLessonRequest, db: Session = Depends(get_db)):
    """
    POST /api/lesson/start
    Generates personalized first practice exercise addressing identified weakness.
    """
    try:
        user_id = req.user_id or 1
        session_id = f"sess_{uuid.uuid4().hex[:8]}"

        # Pick primary weak area
        focus_area = "Past tense verbs"
        if req.weak_areas and len(req.weak_areas) > 0:
            focus_area = req.weak_areas[0]

        exercise = GroqService.generate_exercise(
            language=req.language,
            level=req.level,
            goal=req.goal,
            focus_area=focus_area,
            previous_mistakes=req.previous_mistakes,
        )

        return StartLessonResponse(
            session_id=session_id,
            user_id=user_id,
            exercise=exercise,
            focus_area=focus_area,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start lesson: {str(e)}")


@router.post("/evaluate", response_model=LessonEvaluation)
def evaluate_lesson_step(req: EvaluateLessonRequest, db: Session = Depends(get_db)):
    """
    POST /api/lesson/evaluate
    Evaluates student answer, scores grammar/vocab/conversation, provides friendly explanation
    and generates adaptive next question based on mistakes.
    """
    try:
        user_id = req.user_id or 1
        evaluation = GroqService.evaluate_answer(
            language=req.language,
            level=req.level,
            goal=req.goal,
            question=req.question,
            response=req.response,
            response_mode=req.response_mode,
            detected_language=req.detected_language,
            topic=req.topic,
            previous_mistakes=req.previous_mistakes,
        )

        # Record progress and mistakes in SQLite
        AssessmentService.save_lesson_step(
            db=db,
            user_id=user_id,
            session_id_str=req.session_id,
            evaluation=evaluation,
        )

        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate lesson step: {str(e)}")


@router.post("/final-assessment", response_model=FinalAssessmentEvaluation)
def conduct_final_assessment(req: FinalAssessmentRequest, db: Session = Depends(get_db)):
    """
    POST /api/lesson/final-assessment
    Computes final scores vs initial scores, calculates improvement delta, and produces personalized recommendations.
    """
    try:
        user_id = req.user_id or 1
        evaluation = GroqService.generate_final_assessment(
            language=req.language,
            level=req.level,
            goal=req.goal,
            initial_scores=req.initial_scores,
            practice_history=req.practice_history,
        )

        # Persist final assessment
        AssessmentService.save_final_assessment(
            db=db,
            user_id=user_id,
            evaluation=evaluation,
        )

        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to conduct final assessment: {str(e)}")
