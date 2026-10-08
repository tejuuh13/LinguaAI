from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
from ..models.schemas import (
    UserCreate,
    UserResponse,
    ProgressDashboardResponse,
)
from ..services.assessment_service import AssessmentService

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/{user_id}", response_model=ProgressDashboardResponse)
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    GET /api/progress/{user_id}
    Retrieves aggregated dashboard data: overall progress, category scores,
    initial vs final improvement, weak areas, and recent mistakes.
    """
    try:
        return AssessmentService.get_progress_dashboard(db=db, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress: {str(e)}")


@router.post("/user", response_model=UserResponse)
def create_or_update_user(req: UserCreate, db: Session = Depends(get_db)):
    """
    POST /api/progress/user
    Creates or registers a learner session.
    """
    try:
        user = AssessmentService.get_or_create_user(
            db=db,
            name=req.name,
            target_language=req.target_language,
            level=req.level,
            goal=req.goal,
        )
        return UserResponse(
            id=user.id,
            name=user.name,
            target_language=user.target_language,
            level=user.level,
            goal=user.goal,
            created_at=user.created_at.isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
