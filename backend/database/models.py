import hashlib
import os
import json
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes password with SHA-256 and unique salt."""
    if not salt:
        salt = os.urandom(16).hex()
    pwd_hash = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return pwd_hash, salt


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Verifies candidate password against stored salt and hash."""
    pwd_hash, _ = hash_password(password, salt)
    return pwd_hash == expected_hash


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), default="Learner")
    email = Column(String(120), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    salt = Column(String(64), nullable=True)
    target_language = Column(String(50), nullable=False, default="Spanish")
    level = Column(String(50), nullable=False, default="Intermediate")
    goal = Column(String(100), nullable=False, default="Daily Conversation")
    created_at = Column(DateTime, default=utc_now)

    sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="user", cascade="all, delete-orphan")
    learning_plans = relationship("LearningPlanModel", back_populates="user", cascade="all, delete-orphan")
    vocab_items = relationship("UserVocabulary", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("InterviewSessionModel", back_populates="user", cascade="all, delete-orphan")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(50), default="practice")  # initial_assessment, practice, final_assessment
    initial_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="sessions")
    mistakes = relationship("Mistake", back_populates="session", cascade="all, delete-orphan")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    grammar_score = Column(Float, default=70.0)
    vocabulary_score = Column(Float, default=70.0)
    conversation_score = Column(Float, default=70.0)
    pronunciation_score = Column(Float, default=70.0)
    learning_streak = Column(Integer, default=3)
    lessons_completed = Column(Integer, default=5)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="progress")


class Mistake(Base):
    __tablename__ = "mistakes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"), nullable=True)
    category = Column(String(50), default="grammar")
    original_text = Column(String(255), nullable=False)
    correct_text = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="mistakes")
    session = relationship("LearningSession", back_populates="mistakes")


class LearningPlanModel(Base):
    __tablename__ = "learning_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_language = Column(String(50), nullable=False)
    current_level = Column(String(50), nullable=False)
    target_goal = Column(String(100), nullable=False)
    plan_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="learning_plans")


class UserVocabulary(Base):
    __tablename__ = "user_vocabulary"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String(100), nullable=False)
    meaning = Column(Text, nullable=False)
    example_sentence = Column(Text, nullable=True)
    pronunciation = Column(String(100), nullable=True)
    synonyms = Column(String(255), nullable=True)
    antonyms = Column(String(255), nullable=True)
    language = Column(String(50), nullable=False)
    difficulty = Column(String(50), default="Intermediate")
    mastery_score = Column(Integer, default=50)  # 0 to 100
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    last_reviewed = Column(DateTime, default=utc_now)
    next_review = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="vocab_items")


class InterviewSessionModel(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(100), default="Software Engineer")
    interview_type = Column(String(50), default="Technical")
    target_language = Column(String(50), default="English")
    difficulty = Column(String(50), default="Intermediate")
    communication_score = Column(Integer, default=80)
    grammar_score = Column(Integer, default=75)
    vocabulary_score = Column(Integer, default=78)
    relevance_score = Column(Integer, default=85)
    overall_score = Column(Integer, default=79)
    report_json = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="interviews")
