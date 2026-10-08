import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..database.models import User, LearningSession, Progress, Mistake
from ..models.schemas import (
    ProgressDashboardResponse,
    MistakeItem,
    AssessmentEvaluation,
    LessonEvaluation,
    FinalAssessmentEvaluation,
)


class AssessmentService:
    @staticmethod
    def get_or_create_user(
        db: Session,
        name: str = "Learner",
        target_language: str = "English",
        level: str = "Intermediate",
        goal: str = "Daily Conversation",
        user_id: Optional[int] = None,
    ) -> User:
        """Finds existing user or creates a new user with baseline progress record."""
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.target_language = target_language
                user.level = level
                user.goal = goal
                db.commit()
                db.refresh(user)
                return user

        user = User(
            name=name or "Learner",
            target_language=target_language,
            level=level,
            goal=goal,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize progress row
        progress = Progress(
            user_id=user.id,
            grammar_score=70.0,
            vocabulary_score=70.0,
            conversation_score=70.0,
            pronunciation_score=70.0,
        )
        db.add(progress)
        db.commit()

        return user

    @staticmethod
    def save_assessment_result(
        db: Session,
        user_id: int,
        evaluation: AssessmentEvaluation,
    ) -> LearningSession:
        """Records initial assessment session and updates user baseline progress."""
        session = LearningSession(
            user_id=user_id,
            activity_type="initial_assessment",
            initial_score=float(evaluation.overall_score),
            final_score=float(evaluation.overall_score),
            feedback=evaluation.summary_feedback or "Initial assessment completed.",
        )
        db.add(session)

        # Update progress table
        progress = db.query(Progress).filter(Progress.user_id == user_id).first()
        if not progress:
            progress = Progress(user_id=user_id)
            db.add(progress)

        progress.grammar_score = float(evaluation.grammar_score)
        progress.vocabulary_score = float(evaluation.vocabulary_score)
        progress.conversation_score = float(evaluation.conversation_score)
        progress.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def save_lesson_step(
        db: Session,
        user_id: int,
        session_id_str: str,
        evaluation: LessonEvaluation,
    ):
        """Records mistakes and incrementally updates progress scores."""
        # Find or create session record
        session = db.query(LearningSession).filter(
            LearningSession.user_id == user_id,
            LearningSession.activity_type == "practice"
        ).order_by(LearningSession.id.desc()).first()

        if not session:
            session = LearningSession(
                user_id=user_id,
                activity_type="practice",
                initial_score=float(evaluation.overall_score),
                final_score=float(evaluation.overall_score),
                feedback=evaluation.explanation,
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        else:
            session.final_score = float(evaluation.overall_score)
            db.commit()

        # Record mistakes
        for m in evaluation.mistakes:
            mistake_record = Mistake(
                user_id=user_id,
                session_id=session.id,
                category=m.category,
                original_text=m.original,
                correct_text=m.correct,
                explanation=m.explanation,
            )
            db.add(mistake_record)

        # Incrementally blend progress scores
        progress = db.query(Progress).filter(Progress.user_id == user_id).first()
        if progress:
            progress.grammar_score = round(progress.grammar_score * 0.7 + evaluation.grammar_score * 0.3, 1)
            progress.vocabulary_score = round(progress.vocabulary_score * 0.7 + evaluation.vocabulary_score * 0.3, 1)
            progress.conversation_score = round(progress.conversation_score * 0.7 + evaluation.conversation_score * 0.3, 1)
            progress.updated_at = datetime.now(timezone.utc)

        db.commit()

    @staticmethod
    def save_final_assessment(
        db: Session,
        user_id: int,
        evaluation: FinalAssessmentEvaluation,
    ) -> LearningSession:
        """Records final assessment and locks in final scores."""
        session = LearningSession(
            user_id=user_id,
            activity_type="final_assessment",
            initial_score=float(evaluation.initial_overall_score),
            final_score=float(evaluation.final_overall_score),
            feedback=evaluation.recommendation_summary,
        )
        db.add(session)

        progress = db.query(Progress).filter(Progress.user_id == user_id).first()
        if progress:
            progress.grammar_score = float(evaluation.final_grammar_score)
            progress.vocabulary_score = float(evaluation.final_vocabulary_score)
            progress.conversation_score = float(evaluation.final_conversation_score)
            progress.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_progress_dashboard(db: Session, user_id: int) -> ProgressDashboardResponse:
        """Gathers aggregated progress, scores, mistake history, and recommendations."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = AssessmentService.get_or_create_user(db, user_id=user_id)

        progress = db.query(Progress).filter(Progress.user_id == user.id).first()
        grammar = int(progress.grammar_score) if progress else 75
        vocab = int(progress.vocabulary_score) if progress else 80
        conv = int(progress.conversation_score) if progress else 78
        pron = int(progress.pronunciation_score) if progress else 80
        overall = int(round((grammar + vocab + conv) / 3))

        # Check initial session score
        init_sess = db.query(LearningSession).filter(
            LearningSession.user_id == user.id,
            LearningSession.activity_type == "initial_assessment"
        ).first()
        initial_score = int(init_sess.initial_score) if init_sess else max(50, overall - 12)
        improvement = max(0, overall - initial_score)

        # Recent mistakes
        raw_mistakes = db.query(Mistake).filter(Mistake.user_id == user.id).order_by(Mistake.id.desc()).limit(10).all()
        mistake_items = [
            MistakeItem(
                id=m.id,
                category=m.category,
                original_text=m.original_text,
                correct_text=m.correct_text,
                explanation=m.explanation,
                created_at=m.created_at.strftime("%Y-%m-%d %H:%M"),
            )
            for m in raw_mistakes
        ]

        # Weak areas & strengths calculation
        weak_areas = []
        if grammar < 75:
            weak_areas.append("Past Tense & Auxiliary Verbs")
        if vocab < 75:
            weak_areas.append("Idiomatic Expressions")
        if conv < 75:
            weak_areas.append("Spontaneous Conversational Flow")
        if not weak_areas:
            weak_areas = ["Articles & Prepositions in dialogue", "Complex sentence connectors"]

        strengths = []
        if vocab >= 75:
            strengths.append(f"Practical {user.target_language} vocabulary")
        if conv >= 75:
            strengths.append("Conversational response readiness")
        if grammar >= 75:
            strengths.append("Grammatical structure consistency")
        if not strengths:
            strengths = ["Active engagement", "Auditory comprehension"]

        return ProgressDashboardResponse(
            user_id=user.id,
            name=user.name,
            target_language=user.target_language,
            level=user.level,
            goal=user.goal,
            overall_progress=overall,
            grammar_score=grammar,
            vocabulary_score=vocab,
            conversation_score=conv,
            pronunciation_score=pron,
            initial_score=initial_score,
            current_score=overall,
            improvement=improvement,
            strengths=strengths,
            weak_areas=weak_areas,
            recent_mistakes=mistake_items,
            recommended_next_topic="Articles & Prepositions in Dialogue",
        )
