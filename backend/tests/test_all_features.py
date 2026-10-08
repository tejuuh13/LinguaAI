import pytest
from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)


def test_auth_and_user_creation():
    reg_res = client.post("/api/auth/register", json={
        "name": "Integration User",
        "email": "integration@lingua.ai",
        "password": "securepassword123",
        "target_language": "Spanish",
        "level": "Intermediate",
        "goal": "Daily Conversation"
    })
    assert reg_res.status_code in [200, 400]  # 200 or already registered

    log_res = client.post("/api/auth/login", json={
        "email": "integration@lingua.ai",
        "password": "securepassword123"
    })
    assert log_res.status_code == 200
    assert log_res.json()["name"] == "Integration User"


def test_feature_1_learning_plan():
    res = client.get("/api/learning-plan/1")
    assert res.status_code == 200
    data = res.json()
    assert "daily_plan" in data
    assert len(data["daily_plan"]) == 7
    assert len(data["weeks"]) == 4


def test_feature_2_ai_tutor_chat():
    res = client.post("/api/tutor/chat", json={
        "language": "Spanish",
        "level": "Intermediate",
        "goal": "Daily Conversation",
        "message": "Hola, ¿cómo estás?",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["suggested_followups"]) >= 1


def test_feature_3_vocabulary_builder():
    res = client.get("/api/vocab/Spanish")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    assert "word" in data[0]
    assert "meaning" in data[0]

    # Test mastery update
    mastery_res = client.post("/api/vocab/update-mastery", json={
        "user_id": 1,
        "word_id": data[0]["id"],
        "is_correct": True
    })
    assert mastery_res.status_code == 200


def test_feature_4_mistakes_revision():
    res = client.get("/api/revision/mistakes/1")
    assert res.status_code == 200
    data = res.json()
    assert "most_frequent_weakness" in data
    assert "quiz_items" in data

    if data["quiz_items"]:
        q = data["quiz_items"][0]
        retry_res = client.post("/api/revision/evaluate", json={
            "mistake_id": q["mistake_id"],
            "user_attempt": q["target_correct_phrase"],
            "user_id": 1
        })
        assert retry_res.status_code == 200


def test_feature_5_mock_interview():
    start_res = client.post("/api/interview/start", json={
        "user_id": 1,
        "language": "English",
        "level": "Intermediate",
        "role": "Software Engineer",
        "interview_type": "Technical Interview"
    })
    assert start_res.status_code == 200
    q_data = start_res.json()
    assert "question" in q_data

    ans_res = client.post("/api/interview/answer", json={
        "session_id": q_data["session_id"],
        "language": "English",
        "level": "Intermediate",
        "role": "Software Engineer",
        "interview_type": "Technical Interview",
        "question": q_data["question"],
        "answer": "I have extensive experience building scalable cloud microservices.",
        "question_number": 1
    })
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert "communication_score" in ans_data
    assert "overall_score" in ans_data

    comp_res = client.post("/api/interview/complete", params={
        "session_id": q_data["session_id"],
        "role": "Software Engineer",
        "language": "English",
        "interview_type": "Technical Interview"
    })
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert len(comp_data["strengths"]) >= 1
    assert len(comp_data["ai_recommendations"]) >= 1


def test_feature_6_progress_dashboard():
    res = client.get("/api/progress/1")
    assert res.status_code == 200
    data = res.json()
    assert "grammar_score" in data
    assert "overall_progress" in data


def test_feature_7_admin_dashboard():
    res = client.get("/api/admin/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "total_learners" in data
    assert "avg_overall_score" in data
    assert "system_status" in data

    users_res = client.get("/api/admin/users")
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 1


def test_10_level_practice_quest():
    res = client.get("/api/practice/levels")
    assert res.status_code == 200
    data = res.json()
    assert data["total_levels"] == 10

    trans_res = client.post("/api/practice/translate", json={
        "from_language": "English",
        "to_language": "Spanish",
        "text": "Hello, my name is Alex",
        "level": 1
    })
    assert trans_res.status_code == 200
    assert "translated_text" in trans_res.json()
    assert "transliteration_english" in trans_res.json()
