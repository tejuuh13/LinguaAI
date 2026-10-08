from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ..database.database import get_db
from ..database.models import User, Progress, Mistake
from ..services.groq_service import _call_groq_json

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    user_id: Optional[int] = 1
    language: str = "English"
    level: str = "Intermediate"
    goal: str = "Daily Conversation"
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    correction: Optional[str] = None
    grammar_hint: Optional[str] = None
    pronunciation_guide: Optional[str] = None
    suggested_followups: List[str] = []


CHAT_PROMPT_TEMPLATE = """You are a warm, encouraging multilingual AI Language Tutor chatting live with a student.

Target Language: {language}
Proficiency Level: {level}
Goal: {goal}
Learner Weak Areas: {weak_areas}

Student's Message: "{message}"
Previous Chat History:
{history_str}

Instructions:
1. Respond naturally, warmly, and helpfully in {language} matching the {level} difficulty.
2. If the user asked a question (e.g. "Explain present perfect", "Difference between affect and effect", "Give examples of professional phrasing"), give a clear, pedagogical explanation with examples in {language} and English.
3. If the user made a grammar/vocabulary error in {language}, provide a gentle 'correction' and a short 'grammar_hint'.
4. Provide a 'pronunciation_guide' in Roman letters if the response includes tricky phrases or non-Latin script.
5. Provide 2-3 short 'suggested_followups' that the student could ask or say next.

Return ONLY a valid JSON object matching:
{{
  "reply": "Your friendly reply in {language}...",
  "correction": "Corrected user sentence if there was an error, else null",
  "grammar_hint": "Brief explanation of rule if corrected, else null",
  "pronunciation_guide": "Romanized pronunciation guide or phonetic tip, else null",
  "suggested_followups": [
    "Suggested followup option 1",
    "Suggested followup option 2"
  ]
}}
"""


@router.post("/api/tutor/chat", response_model=ChatResponse)
@router.post("/api/chat/message", response_model=ChatResponse)
def handle_tutor_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    POST /api/tutor/chat & POST /api/chat/message
    Interactive conversation with AI Language Tutor in the target language.
    """
    try:
        weak_areas = ["Verb conjugations", "Prepositions"]
        if req.user_id:
            mistakes = db.query(Mistake).filter(Mistake.user_id == req.user_id).limit(5).all()
            if mistakes:
                weak_areas = list(set(m.category for m in mistakes))

        history_str = "\n".join([f"{m.role}: {m.content}" for m in (req.history or [])[-6:]])
        prompt = CHAT_PROMPT_TEMPLATE.format(
            language=req.language,
            level=req.level,
            goal=req.goal,
            weak_areas=", ".join(weak_areas),
            message=req.message,
            history_str=history_str or "(Beginning of conversation)",
        )

        data = _call_groq_json(prompt, max_tokens=1000)

        if data and "reply" in data:
            return ChatResponse(
                reply=data.get("reply", "Hello! It's wonderful to practice with you."),
                correction=data.get("correction"),
                grammar_hint=data.get("grammar_hint"),
                pronunciation_guide=data.get("pronunciation_guide"),
                suggested_followups=data.get("suggested_followups", []),
            )

        # Fallback dynamic conversational responses by language
        lang_lower = req.language.lower()
        if lang_lower == "spanish":
            return ChatResponse(
                reply="¡Muy bien! Me alegra mucho practicar español contigo hoy. ¿De qué te gustaría hablar?",
                pronunciation_guide="Moo-ee byehn! Meh ah-LEH-grah MOO-choh prahk-tee-KAHR ess-pah-NYOHL...",
                suggested_followups=["Me gustaría hablar sobre mis viajes.", "¿Cómo se dice 'develop' en español?"],
            )
        elif lang_lower == "french":
            return ChatResponse(
                reply="Très bien ! C'est un plaisir d'échanger avec vous. Quel sujet souhaitez-vous aborder aujourd'hui ?",
                pronunciation_guide="Tray byan ! Say tun pleh-ZEER day-shahn-ZHAY ah-VEK voo...",
                suggested_followups=["J'aimerais parler de mes passions.", "Comment se passe votre journée ?"],
            )
        elif lang_lower == "hindi":
            return ChatResponse(
                reply="बहुत बढ़िया! आपके साथ हिंदी में अभ्यास करके बहुत अच्छा लगा। आप किस बारे में बात करना चाहेंगे?",
                pronunciation_guide="Bahut badhiya! Aapke saath Hindi mein abhyas karke bahut achha laga...",
                suggested_followups=["मैं अपने काम के बारे में बताना चाहता हूँ।", "आज का मौसम बहुत अच्छा है।"],
            )
        elif lang_lower == "telugu":
            return ChatResponse(
                reply="చాలా బాగుంది! మీతో తెలుగులో మాట్లాడటం చాలా ఆనందంగా ఉంది. ఈ రోజు మనం దేని గురించి మాట్లాడుకుందాం?",
                pronunciation_guide="Chaala baagundi! Meetho Telugu lo maatlaadatam chaala aanandamgaa undi...",
                suggested_followups=["నా పనుల గురించి మాట్లాడాలనుకుంటున్నాను.", "మీరు ఎలా ఉన్నారు?"],
            )
        elif lang_lower == "german":
            return ChatResponse(
                reply="Sehr gut! Es freut mich sehr, heute mit Ihnen Deutsch zu üben. Worüber möchten Sie sprechen?",
                pronunciation_guide="ZAYR goot! Es froy-t mikh zayr, HOY-tuh mit EE-nen doytch tsoo OO-ben...",
                suggested_followups=["Ich möchte über meine Hobbys sprechen.", "Wie ist das Wetter bei Ihnen?"],
            )
        elif lang_lower == "japanese":
            return ChatResponse(
                reply="素晴らしいですね！一緒に日本語を練習しましょう。今日はどんなことについて話したいですか？",
                pronunciation_guide="Subarashii desu ne! Issho ni Nihongo o renshuu shimashou...",
                suggested_followups=["私の趣味について話したいです。", "最近のおすすめの映画はありますか？"],
            )
        else:
            return ChatResponse(
                reply="Great to chat with you! What language topic or phrase would you like to explore today?",
                suggested_followups=["I would like to discuss my daily routine.", "Can you explain the past continuous tense?"],
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
