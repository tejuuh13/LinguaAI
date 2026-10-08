import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from ..database.database import get_db
from ..database.models import User, Progress, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    target_language: str = "Spanish"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    target_language: str
    level: str
    goal: str
    message: str


@router.post("/register", response_model=AuthUserResponse)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    POST /api/auth/register
    Creates a new user account with securely salted password hash in SQLite.
    """
    email_clean = req.email.strip().lower()
    name_clean = req.name.strip() or "Learner"

    if not req.password or len(req.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long.",
        )

    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in.",
        )

    pwd_hash, salt = hash_password(req.password)

    new_user = User(
        name=name_clean,
        email=email_clean,
        password_hash=pwd_hash,
        salt=salt,
        target_language=req.target_language,
        level=req.level,
        goal=req.goal,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize Progress row
    progress = Progress(
        user_id=new_user.id,
        grammar_score=70.0,
        vocabulary_score=70.0,
        conversation_score=70.0,
        pronunciation_score=70.0,
    )
    db.add(progress)
    db.commit()

    logger.info(f"New user registered: {new_user.id} ({new_user.email})")

    return AuthUserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        target_language=new_user.target_language,
        level=new_user.level,
        goal=new_user.goal,
        message="Account created successfully! Welcome to LinguaAI.",
    )


@router.post("/login", response_model=AuthUserResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """
    POST /api/auth/login
    Authenticates user credentials against stored salt and hash in SQLite.
    """
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not user.password_hash or not user.salt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not verify_password(req.password, user.salt, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    logger.info(f"User logged in: {user.id} ({user.email})")

    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        target_language=user.target_language,
        level=user.level,
        goal=user.goal,
        message="Login successful. Welcome back!",
    )


@router.get("/me/{user_id}", response_model=AuthUserResponse)
def get_current_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    GET /api/auth/me/{user_id}
    Retrieves current user's profile and preferences.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        target_language=user.target_language,
        level=user.level,
        goal=user.goal,
        message="User profile loaded.",
    )
