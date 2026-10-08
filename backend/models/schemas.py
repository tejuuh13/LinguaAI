from typing import List, Optional
from pydantic import BaseModel, Field


# Available language and goal configurations
SUPPORTED_LANGUAGES = [
    "English",
    "Hindi",
    "Telugu",
    "Spanish",
    "French",
    "German",
    "Japanese",
]

SUPPORTED_LEVELS = ["Beginner", "Intermediate", "Advanced"]

SUPPORTED_GOALS = [
    "General Learning",
    "Daily Conversation",
    "Travel",
    "Job Interview",
    "Academic",
]


# User Schemas
class UserCreate(BaseModel):
    name: str = "Learner"
    target_language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"


class UserResponse(BaseModel):
    id: int
    name: str
    target_language: str
    level: str
    goal: str
    created_at: str


# Assessment Schemas
class AssessmentQuestion(BaseModel):
    id: int
    type: str  # grammar, vocabulary, conversation, sentence_construction
    question: str
    options: Optional[List[str]] = None
    hint: Optional[str] = None
    target_language: Optional[str] = None


class StartAssessmentRequest(BaseModel):
    user_id: Optional[int] = None
    name: Optional[str] = "Learner"
    language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"


class StartAssessmentResponse(BaseModel):
    assessment_id: str
    user_id: int
    language: str
    level: str
    goal: str
    questions: List[AssessmentQuestion]


class AssessmentAnswerItem(BaseModel):
    id: int
    type: str
    question: str
    user_answer: str


class EvaluateAssessmentRequest(BaseModel):
    assessment_id: str
    user_id: Optional[int] = 1
    language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"
    answers: List[AssessmentAnswerItem]


class AssessmentEvaluation(BaseModel):
    assessment_id: str
    user_id: Optional[int] = 1
    grammar_score: int = Field(..., ge=0, le=100)
    vocabulary_score: int = Field(..., ge=0, le=100)
    conversation_score: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)
    estimated_level: str
    weak_areas: List[str]
    strengths: List[str]
    summary_feedback: Optional[str] = ""


# Lesson & Practice Schemas
class StartLessonRequest(BaseModel):
    user_id: Optional[int] = 1
    language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"
    weak_areas: Optional[List[str]] = None
    previous_mistakes: Optional[List[str]] = None


class LessonExercise(BaseModel):
    id: int
    category: str
    topic: str
    question: str
    prompt_instruction: str
    context: Optional[str] = None
    suggested_starter: Optional[str] = None


class StartLessonResponse(BaseModel):
    session_id: str
    user_id: int
    exercise: LessonExercise
    focus_area: str


class MistakeDetail(BaseModel):
    original: str
    correct: str
    category: str = "grammar"
    explanation: Optional[str] = ""


class EvaluateLessonRequest(BaseModel):
    user_id: Optional[int] = 1
    session_id: str
    language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"
    question: str
    response: str
    response_mode: str = "voice"  # "voice" or "text"
    detected_language: Optional[str] = None
    topic: Optional[str] = "General"
    previous_mistakes: Optional[List[str]] = []
    exercise_number: Optional[int] = 1


class LessonEvaluation(BaseModel):
    grammar_score: int = Field(..., ge=0, le=100)
    vocabulary_score: int = Field(..., ge=0, le=100)
    conversation_score: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)
    correction: str
    explanation: str
    mistakes: List[MistakeDetail] = []
    next_question: str
    next_question_category: Optional[str] = "grammar"
    recommended_focus: str
    mastery_achieved: bool = False


# Voice Schemas
class VoiceTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    language_match: bool
    confidence: Optional[float] = 1.0
    warning: Optional[str] = None
    error: Optional[str] = None


# Final Assessment Schemas
class FinalAssessmentRequest(BaseModel):
    user_id: Optional[int] = 1
    session_id: str
    language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"
    initial_scores: dict
    practice_history: Optional[List[dict]] = []


class FinalAssessmentEvaluation(BaseModel):
    initial_overall_score: int
    final_grammar_score: int
    final_vocabulary_score: int
    final_conversation_score: int
    final_overall_score: int
    improvement_delta: int
    strengths_developed: List[str]
    persistent_weaknesses: List[str]
    recommendation_summary: str
    recommended_next_topic: str
    recommended_topic_reason: str
    recommended_difficulty: str


# Progress Dashboard Schemas
class MistakeItem(BaseModel):
    id: int
    category: str
    original_text: str
    correct_text: str
    explanation: Optional[str]
    created_at: str


class ProgressDashboardResponse(BaseModel):
    user_id: int
    name: str
    target_language: str
    level: str
    goal: str
    overall_progress: int
    grammar_score: int
    vocabulary_score: int
    conversation_score: int
    pronunciation_score: int
    initial_score: int
    current_score: int
    improvement: int
    strengths: List[str]
    weak_areas: List[str]
    recent_mistakes: List[MistakeItem]
    recommended_next_topic: str
