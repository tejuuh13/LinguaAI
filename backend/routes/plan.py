import os
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ..database.database import get_db
from ..database.models import User, Progress, LearningSession, Mistake, LearningPlanModel
from ..services.groq_service import _call_groq_json

router = APIRouter(tags=["plan"])
logger = logging.getLogger(__name__)


class DayPlan(BaseModel):
    day: int
    activity: str
    focus: str
    target_skill: str


class WeekPlan(BaseModel):
    week_number: int
    title: str
    focus_topic: str
    daily_exercises: List[str]
    target_skill_outcome: str


class LearningPlanGenerateRequest(BaseModel):
    user_id: int
    force_regenerate: bool = False


class LearningPlanResponse(BaseModel):
    user_id: int
    learner_name: str
    target_language: str
    current_level: str
    target_goal: str
    estimated_duration_weeks: int
    primary_weakness: str
    daily_plan: List[DayPlan]
    weeks: List[WeekPlan]
    projected_score_boost: int
    created_at: Optional[str] = None


DEFAULT_7_DAY_PLAN = [
    DayPlan(day=1, activity="Grammar Mastery", focus="Past & Auxiliary Verb Drills", target_skill="Grammar Accuracy"),
    DayPlan(day=2, activity="Conversation Simulation", focus="Self-Introduction & Routine Dialogue", target_skill="Fluency & Cadence"),
    DayPlan(day=3, activity="Vocabulary Expansion", focus="30 High-Frequency Goal Collocations", target_skill="Lexical Range"),
    DayPlan(day=4, activity="AI Mock Interview", focus="Scenario-based Roleplay & Answering", target_skill="Spontaneous Response"),
    DayPlan(day=5, activity="Pronunciation Practice", focus="Speech Rhythm, Stress & Phonetics", target_skill="Clarity & Intelligibility"),
    DayPlan(day=6, activity="Revision Room", focus="Targeted Retries on Recorded Mistakes", target_skill="Error Correction"),
    DayPlan(day=7, activity="Comprehensive Assessment", focus="Full Skill Evaluation & Final Score", target_skill="Mastery Benchmark"),
]


def generate_plan_for_user(user: User, db: Session) -> LearningPlanResponse:
    progress = db.query(Progress).filter(Progress.user_id == user.id).first()
    mistakes = db.query(Mistake).filter(Mistake.user_id == user.id, Mistake.resolved == False).limit(10).all()

    lang = user.target_language
    level = user.level
    goal = user.goal
    g_score = progress.grammar_score if progress else 65
    v_score = progress.vocabulary_score if progress else 70
    c_score = progress.conversation_score if progress else 68
    p_score = progress.pronunciation_score if progress else 72

    mistake_snippets = [f"{m.category}: {m.original_text} -> {m.correct_text}" for m in mistakes]

    prompt = f"""You are a master curriculum director.
Generate a tailored 7-Day Intensive Curriculum & 4-Week Learning Roadmap for this student:
- Name: {user.name}
- Target Language: {lang}
- Level: {level}
- Goal: {goal}
- Current Scores: Grammar {g_score}%, Vocab {v_score}%, Conversation {c_score}%, Pronunciation {p_score}%
- Recent Recorded Mistakes: {mistake_snippets or ['General past tense verb conjugation and prepositions']}

Return ONLY a JSON object:
{{
  "primary_weakness": "...",
  "projected_score_boost": 18,
  "daily_plan": [
    {{"day": 1, "activity": "...", "focus": "...", "target_skill": "..."}},
    {{"day": 2, "activity": "...", "focus": "...", "target_skill": "..."}},
    {{"day": 3, "activity": "...", "focus": "...", "target_skill": "..."}},
    {{"day": 4, "activity": "...", "focus": "...", "target_skill": "..."}},
    {{"day": 5, "activity": "...", "focus": "...", "target_skill": "..."}},
    {{"day": 6, "activity": "...", "focus": "...", "target_skill": "..."}},
    {{"day": 7, "activity": "...", "focus": "...", "target_skill": "..."}}
  ],
  "weeks": [
    {{
      "week_number": 1,
      "title": "...",
      "focus_topic": "...",
      "daily_exercises": ["...", "...", "..."],
      "target_skill_outcome": "..."
    }},
    {{
      "week_number": 2,
      "title": "...",
      "focus_topic": "...",
      "daily_exercises": ["...", "...", "..."],
      "target_skill_outcome": "..."
    }},
    {{
      "week_number": 3,
      "title": "...",
      "focus_topic": "...",
      "daily_exercises": ["...", "...", "..."],
      "target_skill_outcome": "..."
    }},
    {{
      "week_number": 4,
      "title": "...",
      "focus_topic": "...",
      "daily_exercises": ["...", "...", "..."],
      "target_skill_outcome": "..."
    }}
  ]
}}
"""
    data = _call_groq_json(prompt, max_tokens=1500)

    if data and "daily_plan" in data and "weeks" in data:
        daily_items = [DayPlan(**dp) for dp in data.get("daily_plan", [])]
        week_items = [WeekPlan(**wp) for wp in data.get("weeks", [])]
        primary_weakness = data.get("primary_weakness", f"Grammar & Conversational Flow in {lang}")
        projected_boost = int(data.get("projected_score_boost", 18))
    else:
        daily_items = DEFAULT_7_DAY_PLAN
        week_items = [
            WeekPlan(
                week_number=1,
                title="Foundational Grammar & Tense Mastery",
                focus_topic=f"Past & Auxiliary Verbs in {lang}",
                daily_exercises=[
                    "Day 1-2: Regular and irregular past tense verbs in dialogue",
                    "Day 3-4: 5-minute daily voice practice describing past activities",
                    "Day 5-7: Sentence correction drills & AI tutor check-in",
                ],
                target_skill_outcome="Achieve 85%+ accuracy in conversational verb conjugations.",
            ),
            WeekPlan(
                week_number=2,
                title="Goal-Specific Vocabulary & Collocations",
                focus_topic=f"Essential {goal} Phraseology in {lang}",
                daily_exercises=[
                    "Day 8-9: 30 high-frequency vocabulary flashcards with native pronunciation",
                    "Day 10-11: Practical situational roleplay with speech recognition",
                    "Day 12-14: Listening comprehension & shadowing practice",
                ],
                target_skill_outcome=f"Confidently navigate 5 core {goal} scenarios without hesitations.",
            ),
            WeekPlan(
                week_number=3,
                title="Complex Sentences & Connectors",
                focus_topic=f"Sentence Connectors (because, although, furthermore) in {lang}",
                daily_exercises=[
                    "Day 15-16: Multi-clause sentence building drills",
                    "Day 17-19: 10-minute AI voice conversation sessions with instant feedback",
                    "Day 20-21: Review and clear all recorded mistake cards in the Revision Room",
                ],
                target_skill_outcome="Form fluid, structured sentences with natural flow.",
            ),
            WeekPlan(
                week_number=4,
                title="Spontaneous Fluency & Real-World Simulation",
                focus_topic=f"Real-Time Dialogue & Mock {goal} Simulation",
                daily_exercises=[
                    "Day 22-24: Mock Interview / Real-world scenario simulations",
                    "Day 25-26: Final comprehensive diagnostic reassessment",
                    "Day 27-28: Capstone conversation evaluation & certificate achievement",
                ],
                target_skill_outcome="Full conversational readiness with native pronunciation benchmark.",
            ),
        ]
        primary_weakness = f"Past Tense Verbs & Conversational Flow in {lang}"
        projected_boost = 18

    res_obj = LearningPlanResponse(
        user_id=user.id,
        learner_name=user.name,
        target_language=user.target_language,
        current_level=user.level,
        target_goal=user.goal,
        estimated_duration_weeks=4,
        primary_weakness=primary_weakness,
        daily_plan=daily_items,
        weeks=week_items,
        projected_score_boost=projected_boost,
    )

    # Persist in SQLite
    try:
        existing_plan = db.query(LearningPlanModel).filter(LearningPlanModel.user_id == user.id).first()
        plan_json_str = res_obj.model_dump_json()
        if existing_plan:
            existing_plan.plan_json = plan_json_str
            existing_plan.target_language = user.target_language
            existing_plan.current_level = user.level
            existing_plan.target_goal = user.goal
        else:
            new_plan = LearningPlanModel(
                user_id=user.id,
                target_language=user.target_language,
                current_level=user.level,
                target_goal=user.goal,
                plan_json=plan_json_str,
            )
            db.add(new_plan)
        db.commit()
    except Exception as e:
        logger.warning(f"Error persisting learning plan in SQLite: {e}")

    return res_obj


@router.get("/api/learning-plan/{user_id}", response_model=LearningPlanResponse)
@router.get("/api/plan/{user_id}", response_model=LearningPlanResponse)
def get_personalized_learning_plan(user_id: int, db: Session = Depends(get_db)):
    """
    GET /api/learning-plan/{user_id}
    Retrieves or generates a personalized curriculum roadmap stored in SQLite.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, name="Learner", target_language="Spanish", level="Intermediate", goal="Daily Conversation")

    # Check cached plan
    stored = db.query(LearningPlanModel).filter(LearningPlanModel.user_id == user.id).first()
    if stored and stored.plan_json:
        try:
            cached_data = json.loads(stored.plan_json)
            return LearningPlanResponse(**cached_data)
        except Exception:
            pass

    return generate_plan_for_user(user, db)


@router.post("/api/learning-plan/generate", response_model=LearningPlanResponse)
@router.post("/api/plan/generate", response_model=LearningPlanResponse)
def generate_new_learning_plan(req: LearningPlanGenerateRequest, db: Session = Depends(get_db)):
    """
    POST /api/learning-plan/generate
    Forces generation of a fresh dynamic curriculum plan using Groq Llama 3.3.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return generate_plan_for_user(user, db)
