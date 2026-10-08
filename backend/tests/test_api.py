import pytest
from fastapi.testclient import TestClient
from ..main import app
from ..services.whisper_service import WhisperService

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "groq" in data
    assert "whisper" in data


def test_config_options():
    response = client.get("/api/config/options")
    assert response.status_code == 200
    data = response.json()
    assert "English" in data["languages"]
    assert "Spanish" in data["languages"]
    assert "Intermediate" in data["levels"]
    assert "Daily Conversation" in data["goals"]


def test_assessment_flow():
    # 1. Start assessment
    start_payload = {
        "name": "Test Learner",
        "language": "Spanish",
        "level": "Intermediate",
        "goal": "Travel",
    }
    res = client.post("/api/assessment/start", json=start_payload)
    assert res.status_code == 200
    start_data = res.json()
    assert "assessment_id" in start_data
    assert len(start_data["questions"]) >= 3
    user_id = start_data["user_id"]

    # 2. Evaluate assessment
    eval_payload = {
        "assessment_id": start_data["assessment_id"],
        "user_id": user_id,
        "language": "Spanish",
        "level": "Intermediate",
        "goal": "Travel",
        "answers": [
            {
                "id": 1,
                "type": "grammar",
                "question": "Choose correct verb",
                "user_answer": "fui",
            },
            {
                "id": 2,
                "type": "vocabulary",
                "question": "What is desarrollar?",
                "user_answer": "To develop",
            },
        ],
    }
    eval_res = client.post("/api/assessment/evaluate", json=eval_payload)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["grammar_score"] > 0
    assert len(eval_data["weak_areas"]) > 0


def test_lesson_and_adaptive_flow():
    # 1. Start lesson
    lesson_payload = {
        "user_id": 1,
        "language": "English",
        "level": "Intermediate",
        "goal": "Daily Conversation",
        "weak_areas": ["Past tense irregular verbs"],
    }
    res = client.post("/api/lesson/start", json=lesson_payload)
    assert res.status_code == 200
    data = res.json()
    assert "exercise" in data
    session_id = data["session_id"]

    # 2. Evaluate step
    step_payload = {
        "user_id": 1,
        "session_id": session_id,
        "language": "English",
        "level": "Intermediate",
        "goal": "Daily Conversation",
        "question": data["exercise"]["question"],
        "response": "Yesterday I go to college and met my friends.",
        "response_mode": "text",
        "detected_language": "English",
        "topic": "Past tense irregular verbs",
        "exercise_number": 1,
    }
    step_res = client.post("/api/lesson/evaluate", json=step_payload)
    assert step_res.status_code == 200
    eval_data = step_res.json()
    assert "correction" in eval_data
    assert "next_question" in eval_data

    # 3. Final assessment
    final_payload = {
        "user_id": 1,
        "session_id": session_id,
        "language": "English",
        "level": "Intermediate",
        "goal": "Daily Conversation",
        "initial_scores": {"overall_score": 68},
        "practice_history": [],
    }
    final_res = client.post("/api/lesson/final-assessment", json=final_payload)
    assert final_res.status_code == 200
    final_data = final_res.json()
    assert "final_overall_score" in final_data
    assert "recommended_next_topic" in final_data


def test_progress_dashboard():
    res = client.get("/api/progress/1")
    assert res.status_code == 200
    data = res.json()
    assert "overall_progress" in data
    assert "grammar_score" in data


def test_spoken_language_detection_helpers():
    assert WhisperService.detect_language_from_text("I am learning English every day") == "English"
    assert WhisperService.detect_language_from_text("Hola, ¿cómo estás hoy?") == "Spanish"
    assert WhisperService.detect_language_from_text("नमस्ते, मैं आज अच्छा हूँ") == "Hindi"
    assert WhisperService.language_matches_target("English", "I am learning English every day") is True
    assert WhisperService.language_matches_target("English", "Hola, ¿cómo estás hoy?") is False
