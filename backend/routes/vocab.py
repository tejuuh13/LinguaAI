import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ..database.database import get_db
from ..database.models import User, UserVocabulary, Progress, Mistake
from ..services.groq_service import _call_groq_json

router = APIRouter(prefix="/api/vocab", tags=["vocab"])
logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


class VocabCard(BaseModel):
    id: int
    word: str
    meaning: str
    example_sentence: str
    difficulty: str
    pronunciation: str
    synonyms: Optional[str] = "N/A"
    antonyms: Optional[str] = "N/A"
    language: str
    mastery_score: int = 50
    correct_count: int = 0
    incorrect_count: int = 0


class VocabGenerateRequest(BaseModel):
    user_id: int = 1
    language: str = "Spanish"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"
    topic: Optional[str] = "High Frequency Vocabulary"


class MasteryUpdateRequest(BaseModel):
    user_id: int = 1
    word_id: int
    is_correct: bool


BASE_VOCAB_COLLECTION = {
    "spanish": [
        {
            "id": 1,
            "word": "Persuadir",
            "meaning": "To convince someone to do or believe something through reasoning.",
            "example_sentence": "Ella me persuadió para unirme al proyecto.",
            "difficulty": "Intermediate",
            "pronunciation": "pehr-swah-DEER",
            "synonyms": "Convencer, inducir",
            "antonyms": "Disuadir, desalentar",
            "language": "Spanish",
        },
        {
            "id": 2,
            "word": "Desarrollar",
            "meaning": "To develop, grow, or expand something progressively.",
            "example_sentence": "Necesitamos desarrollar una nueva estrategia para el equipo.",
            "difficulty": "Intermediate",
            "pronunciation": "deh-sah-rro-YAR",
            "synonyms": "Crear, construir, evolucionar",
            "antonyms": "Destruir, reducir",
            "language": "Spanish",
        },
        {
            "id": 3,
            "word": "Imprescindible",
            "meaning": "Absolutely essential or indispensable.",
            "example_sentence": "El agua y el descanso son imprescindibles para la salud.",
            "difficulty": "Advanced",
            "pronunciation": "eem-preh-seen-DEE-bleh",
            "synonyms": "Esencial, fundamental, indispensable",
            "antonyms": "Innecesario, prescindible",
            "language": "Spanish",
        },
        {
            "id": 4,
            "word": "El Viaje",
            "meaning": "The trip, journey, or travel experience.",
            "example_sentence": "El viaje en tren duró cuatro horas a través de las montañas.",
            "difficulty": "Beginner",
            "pronunciation": "el vee-AH-heh",
            "synonyms": "Trayecto, recorrido",
            "antonyms": "Estancia, permanencia",
            "language": "Spanish",
        },
    ],
    "telugu": [
        {
            "id": 1,
            "word": "ప్రేరేపించు (Prerepinchuu)",
            "meaning": "To persuade or inspire someone toward an action.",
            "example_sentence": "ఆమె నన్ను ప్రాజెక్ట్‌లో చేరమని ప్రేరేపించింది.",
            "difficulty": "Intermediate",
            "pronunciation": "Pray-ray-pin-choo",
            "synonyms": "ఉత్సాహపరచు (Encourage)",
            "antonyms": "నిరుత్సాహపరచు (Discourage)",
            "language": "Telugu",
        },
        {
            "id": 2,
            "word": "అభ్యాసం (Abhyasam)",
            "meaning": "Practice or diligent study.",
            "example_sentence": "రోజూ అభ్యాసం చేయడం ద్వారా భాషలో పట్టు వస్తుంది.",
            "difficulty": "Beginner",
            "pronunciation": "Abh-yaa-sam",
            "synonyms": "సాధన (Practice)",
            "antonyms": "అలసత్వం (Neglect)",
            "language": "Telugu",
        },
        {
            "id": 3,
            "word": "ప్రయాణం (Prayanam)",
            "meaning": "Journey or travel expedition.",
            "example_sentence": "మా ప్రయాణం ఎంతో ఆహ్లాదకరంగా సాగింది.",
            "difficulty": "Beginner",
            "pronunciation": "Pra-yaa-nam",
            "synonyms": "యాత్ర (Trip)",
            "antonyms": "విశ్రాంతి (Rest)",
            "language": "Telugu",
        },
    ],
    "hindi": [
        {
            "id": 1,
            "word": "मनाना / समझाना (Manaana)",
            "meaning": "To persuade or convince someone.",
            "example_sentence": "उसने मुझे इस परियोजना में शामिल होने के लिए मना लिया।",
            "difficulty": "Intermediate",
            "pronunciation": "Ma-naa-naa",
            "synonyms": "राज़ी करना (Convince)",
            "antonyms": "रोकना (Dissuade)",
            "language": "Hindi",
        },
        {
            "id": 2,
            "word": "अनिवार्य (Anivarya)",
            "meaning": "Indispensable, mandatory, or essential.",
            "example_sentence": "सफलता के लिए नियमित अभ्यास अनिवार्य है।",
            "difficulty": "Advanced",
            "pronunciation": "A-ni-vaar-ya",
            "synonyms": "ज़रूरी, आवश्यक",
            "antonyms": "ऐच्छिक (Optional)",
            "language": "Hindi",
        },
    ],
    "french": [
        {
            "id": 1,
            "word": "Persuader",
            "meaning": "To convince someone through logic or appeal.",
            "example_sentence": "Elle m'a persuadé de rejoindre l'équipe.",
            "difficulty": "Intermediate",
            "pronunciation": "pehr-swah-DAY",
            "synonyms": "Convaincre",
            "antonyms": "Dissuader",
            "language": "French",
        },
        {
            "id": 2,
            "word": "Développer",
            "meaning": "To develop or expand systems.",
            "example_sentence": "Nous développons une solution innovante.",
            "difficulty": "Intermediate",
            "pronunciation": "day-vuh-loh-PAY",
            "synonyms": "Concevoir, élaborer",
            "antonyms": "Détruire",
            "language": "French",
        },
    ],
    "german": [
        {
            "id": 1,
            "word": "Überzeugen",
            "meaning": "To convince or persuade someone.",
            "example_sentence": "Sie hat mich überzeugt, an dem Projekt mitzuarbeiten.",
            "difficulty": "Intermediate",
            "pronunciation": "oo-ber-TSOY-gen",
            "synonyms": "Überreden",
            "antonyms": "Entmutigen",
            "language": "German",
        },
        {
            "id": 2,
            "word": "Die Herausforderung",
            "meaning": "A demanding task or challenge.",
            "example_sentence": "Diese neue Aufgabe ist eine wunderbare Herausforderung.",
            "difficulty": "Intermediate",
            "pronunciation": "dee heh-ROWS-for-duh-roong",
            "synonyms": "Die Aufgabe",
            "antonyms": "Die Leichtigkeit",
            "language": "German",
        },
    ],
    "japanese": [
        {
            "id": 1,
            "word": "説得する (Settoku suru)",
            "meaning": "To persuade or convince someone.",
            "example_sentence": "彼女は私を説得してプロジェクトに参加させました。",
            "difficulty": "Intermediate",
            "pronunciation": "set-toh-koo soo-roo",
            "synonyms": "納得させる (Convince)",
            "antonyms": "思いとどまらせる (Dissuade)",
            "language": "Japanese",
        },
    ],
    "english": [
        {
            "id": 1,
            "word": "Persuade",
            "meaning": "To convince someone to do or believe something through reasoning.",
            "example_sentence": "She persuaded me to join the innovative project.",
            "difficulty": "Intermediate",
            "pronunciation": "per-SWAYD",
            "synonyms": "Convince, induce, sway",
            "antonyms": "Dissuade, deter",
            "language": "English",
        },
        {
            "id": 2,
            "word": "Indispensable",
            "meaning": "Absolutely necessary or essential.",
            "example_sentence": "Clear communication is indispensable for high-performing teams.",
            "difficulty": "Advanced",
            "pronunciation": "in-dih-SPEN-suh-bul",
            "synonyms": "Essential, vital, crucial",
            "antonyms": "Superfluous, expendable",
            "language": "English",
        },
    ],
}


@router.get("/{language}", response_model=List[VocabCard])
def get_vocabulary_cards(language: str, user_id: int = 1, db: Session = Depends(get_db)):
    """
    GET /api/vocab/{language}
    Retrieves vocabulary cards with translations, pronunciation, synonyms, and mastery metrics.
    """
    lang_key = language.strip().lower()

    # Query user saved vocab from SQLite
    db_items = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == user_id,
        UserVocabulary.language.ilike(language),
    ).all()

    if db_items:
        return [
            VocabCard(
                id=item.id,
                word=item.word,
                meaning=item.meaning,
                example_sentence=item.example_sentence or "",
                difficulty=item.difficulty or "Intermediate",
                pronunciation=item.pronunciation or "Pronounce clearly",
                synonyms=item.synonyms or "N/A",
                antonyms=item.antonyms or "N/A",
                language=item.language,
                mastery_score=item.mastery_score or 50,
                correct_count=item.correct_count or 0,
                incorrect_count=item.incorrect_count or 0,
            )
            for item in db_items
        ]

    # Return base collection
    raw_list = BASE_VOCAB_COLLECTION.get(lang_key, BASE_VOCAB_COLLECTION["english"])
    return [
        VocabCard(
            id=c["id"],
            word=c["word"],
            meaning=c["meaning"],
            example_sentence=c["example_sentence"],
            difficulty=c["difficulty"],
            pronunciation=c["pronunciation"],
            synonyms=c.get("synonyms", "N/A"),
            antonyms=c.get("antonyms", "N/A"),
            language=c["language"],
            mastery_score=60,
            correct_count=2,
            incorrect_count=0,
        )
        for c in raw_list
    ]


@router.post("/generate", response_model=List[VocabCard])
def generate_ai_vocabulary(req: VocabGenerateRequest, db: Session = Depends(get_db)):
    """
    POST /api/vocab/generate
    Dynamically generates personalized vocabulary cards using Groq Llama 3.3.
    """
    prompt = f"""You are a master lexicographer and language teacher.
Generate 4 rich vocabulary flashcards in {req.language} for a {req.level} learner with the goal '{req.goal}'.
Focus Topic: {req.topic}

Return ONLY a JSON object:
{{
  "cards": [
    {{
      "word": "...",
      "meaning": "Clear English explanation...",
      "example_sentence": "Full example sentence in {req.language}...",
      "difficulty": "{req.level}",
      "pronunciation": "Phonetic pronunciation guide in English letters...",
      "synonyms": "...",
      "antonyms": "..."
    }}
  ]
}}
"""
    data = _call_groq_json(prompt, max_tokens=1000)
    cards_out = []

    if data and "cards" in data:
        for idx, item in enumerate(data.get("cards", [])):
            vocab_obj = UserVocabulary(
                user_id=req.user_id,
                word=item.get("word", "Vocabulary"),
                meaning=item.get("meaning", "Meaning"),
                example_sentence=item.get("example_sentence", ""),
                pronunciation=item.get("pronunciation", ""),
                synonyms=item.get("synonyms", "N/A"),
                antonyms=item.get("antonyms", "N/A"),
                language=req.language,
                difficulty=item.get("difficulty", req.level),
                mastery_score=50,
                correct_count=0,
                incorrect_count=0,
            )
            db.add(vocab_obj)
            db.commit()
            db.refresh(vocab_obj)

            cards_out.append(
                VocabCard(
                    id=vocab_obj.id,
                    word=vocab_obj.word,
                    meaning=vocab_obj.meaning,
                    example_sentence=vocab_obj.example_sentence,
                    difficulty=vocab_obj.difficulty,
                    pronunciation=vocab_obj.pronunciation,
                    synonyms=vocab_obj.synonyms,
                    antonyms=vocab_obj.antonyms,
                    language=vocab_obj.language,
                    mastery_score=vocab_obj.mastery_score,
                    correct_count=vocab_obj.correct_count,
                    incorrect_count=vocab_obj.incorrect_count,
                )
            )
        return cards_out

    return get_vocabulary_cards(req.language, req.user_id, db)


@router.post("/update-mastery")
def update_word_mastery(req: MasteryUpdateRequest, db: Session = Depends(get_db)):
    """
    POST /api/vocab/update-mastery
    Updates the spaced repetition mastery score and count for a vocabulary item.
    """
    item = db.query(UserVocabulary).filter(UserVocabulary.id == req.word_id).first()
    if not item:
        return {"status": "success", "message": "Mastery simulated."}

    if req.is_correct:
        item.correct_count = (item.correct_count or 0) + 1
        item.mastery_score = min(100, (item.mastery_score or 50) + 15)
        item.next_review = utc_now() + timedelta(days=3)
    else:
        item.incorrect_count = (item.incorrect_count or 0) + 1
        item.mastery_score = max(10, (item.mastery_score or 50) - 15)
        item.next_review = utc_now() + timedelta(hours=12)

    item.last_reviewed = utc_now()
    db.commit()

    return {
        "status": "success",
        "word_id": item.id,
        "mastery_score": item.mastery_score,
        "correct_count": item.correct_count,
        "incorrect_count": item.incorrect_count,
    }
