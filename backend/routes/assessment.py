import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..models.schemas import (
    StartAssessmentRequest,
    StartAssessmentResponse,
    EvaluateAssessmentRequest,
    AssessmentEvaluation,
)
from ..services.groq_service import GroqService
from ..services.assessment_service import AssessmentService

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


@router.post("/start", response_model=StartAssessmentResponse)
def start_assessment(req: StartAssessmentRequest, db: Session = Depends(get_db)):
    """
    POST /api/assessment/start
    Initializes user session and generates 5 diagnostic assessment questions via Groq / Llama 3.3 70B.
    """
    try:
        user = AssessmentService.get_or_create_user(
            db=db,
            name=req.name or "Learner",
            target_language=req.language,
            level=req.level,
            goal=req.goal,
            user_id=req.user_id,
        )

        assessment_id = f"asm_{uuid.uuid4().hex[:8]}"
        questions = GroqService.generate_assessment(
            language=req.language,
            level=req.level,
            goal=req.goal,
        )

        return StartAssessmentResponse(
            assessment_id=assessment_id,
            user_id=user.id,
            language=req.language,
            level=req.level,
            goal=req.goal,
            questions=questions,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate assessment: {str(e)}")


@router.post("/evaluate", response_model=AssessmentEvaluation)
def evaluate_assessment(req: EvaluateAssessmentRequest, db: Session = Depends(get_db)):
    """
    POST /api/assessment/evaluate
    Evaluates user answers with Groq / Llama 3.3 70B, returns grammar, vocabulary, conversation,
    weak areas, and records baseline in SQLite.
    """
    try:
        answers_dict = [a.model_dump() for a in req.answers]
        user_id = req.user_id or 1

        evaluation = GroqService.evaluate_assessment(
            language=req.language,
            level=req.level,
            goal=req.goal,
            answers=answers_dict,
            assessment_id=req.assessment_id,
            user_id=user_id,
        )

        # Persist session and progress in SQLite
        AssessmentService.save_assessment_result(
            db=db,
            user_id=user_id,
            evaluation=evaluation,
        )

        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate assessment: {str(e)}")
