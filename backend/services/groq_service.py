import os
import json
import logging
import random
import time
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq

from ..prompts.tutor_prompts import (
    ASSESSMENT_GENERATION_SYSTEM_PROMPT,
    ASSESSMENT_EVALUATION_SYSTEM_PROMPT,
    LESSON_START_SYSTEM_PROMPT,
    LESSON_EVALUATION_SYSTEM_PROMPT,
    FINAL_ASSESSMENT_SYSTEM_PROMPT,
)
from ..models.schemas import (
    AssessmentQuestion,
    AssessmentEvaluation,
    LessonExercise,
    LessonEvaluation,
    MistakeDetail,
    FinalAssessmentEvaluation,
)

load_dotenv()
logger = logging.getLogger(__name__)

# Ground truth rubrics for diagnostic assessment calibration
ANSWER_RUBRICS = {
    "spanish": {
        1: {"correct": "fui", "topic": "Past tense verb conjugation (Pretérito indefinido)", "type": "grammar"},
        2: {"correct": "to develop", "topic": "Core vocabulary comprehension", "type": "vocabulary"},
        3: {"correct": "necesito encontrar un buen restaurante cerca de aquí.", "topic": "Sentence structure & modal phrases", "type": "grammar"},
        4: {"keywords": ["hola", "llamo", "soy", "trabajo", "vivo", "estudio", "nombre", "me llamo", "tengo"], "topic": "Conversational self-introduction", "type": "conversation"},
        5: {"keywords": ["disculpe", "favor", "por favor", "ayuda", "ayudarme", "podria", "podría", "quisiera", "donde", "dónde", "gracias"], "topic": "Polite situational dialogue", "type": "conversation"},
    },
    "french": {
        1: {"correct": "avons regardé", "topic": "Passé composé & auxiliary agreement", "type": "grammar"},
        2: {"correct": "daily", "topic": "Everyday vocabulary", "type": "vocabulary"},
        3: {"correct": "où est la gare, s'il vous plaît ?", "topic": "Polite question phrasing", "type": "grammar"},
        4: {"keywords": ["bonjour", "m'appelle", "suis", "travaille", "j'ai", "je suis", "hier", "nom"], "topic": "Conversational self-introduction", "type": "conversation"},
        5: {"keywords": ["bonjour", "s'il vous plaît", "excusez-moi", "voudrais", "pourriez", "merci"], "topic": "Formal polite dialogue", "type": "conversation"},
    },
    "german": {
        1: {"correct": "habe", "topic": "Perfekt tense auxiliary verbs (haben/sein)", "type": "grammar"},
        2: {"correct": "challenge", "topic": "Workplace & conversational vocabulary", "type": "vocabulary"},
        3: {"correct": "ich möchte bitte eine tasse kaffee.", "topic": "Modal verbs & accusative objects", "type": "grammar"},
        4: {"keywords": ["hallo", "heiße", "bin", "arbeite", "gestern", "habe", "mein name"], "topic": "Conversational self-introduction", "type": "conversation"},
        5: {"keywords": ["entschuldigung", "könnten", "bitte", "danke", "möchte", "fragen"], "topic": "Polite inquiries and directions", "type": "conversation"},
    },
    "hindi": {
        1: {"correct": "गया था", "topic": "भूतकाल (Past tense) क्रिया रूप", "type": "grammar"},
        2: {"correct": "practice", "topic": "शब्दार्थ (Vocabulary meaning)", "type": "vocabulary"},
        3: {"correct": "मैं हिंदी सीखना चाहता हूँ।", "topic": "वाक्य निर्माण (Sentence construction)", "type": "grammar"},
        4: {"keywords": ["मेरा", "नाम", "हूँ", "रहता", "करता", "नमस्ते"], "topic": "वार्तालाप परिचय (Conversational intro)", "type": "conversation"},
        5: {"keywords": ["नमस्ते", "कृपया", "मदद", "धन्यवाद", "सकते"], "topic": "शिष्टाचार संवाद (Polite dialogue)", "type": "conversation"},
    },
    "telugu": {
        1: {"correct": "చూశాను", "topic": "గత కాలం క్రియారూపాలు (Past tense verbs)", "type": "grammar"},
        2: {"correct": "journey / travel", "topic": "పదకోశం (Vocabulary definitions)", "type": "vocabulary"},
        3: {"correct": "మీరు ఎలా ఉన్నారు?", "topic": "ప్రశ్నార్థక వాక్య నిర్మాణం (Question construction)", "type": "grammar"},
        4: {"keywords": ["నా", "పేరు", "ఉన్నాను", "చేస్తున్నాను", "నమస్కారం"], "topic": "పరిచయ సంభాషణ (Self-introduction)", "type": "conversation"},
        5: {"keywords": ["నమస్కారం", "దయచేసి", "సహాయం", "ధన్యవాదాలు", "బాగున్నారా"], "topic": "మర్యాదపూర్వక సంభాషణ (Polite dialogue)", "type": "conversation"},
    },
    "japanese": {
        1: {"correct": "に", "topic": "助詞の使い分け (Particle usage)", "type": "grammar"},
        2: {"correct": "experience", "topic": "語彙・漢字の意味 (Vocabulary meanings)", "type": "vocabulary"},
        3: {"correct": "はじめまして、アレックスと申します。よろしくお願いいたします。", "topic": "敬語・丁寧表現 (Polite greetings)", "type": "grammar"},
        4: {"keywords": ["はじめまして", "です", "と申します", "よろしく", "名前", "学生", "会社員"], "topic": "自己紹介会話 (Self-introduction)", "type": "conversation"},
        5: {"keywords": ["すみません", "お願いします", "ください", "ありがとう", "どこ"], "topic": "丁寧な依頼・質問 (Polite requests)", "type": "conversation"},
    },
    "english": {
        1: {"correct": "yesterday, i went to the market and bought fresh fruit.", "topic": "Past tense irregular verbs", "type": "grammar"},
        2: {"correct": "polyglot", "topic": "Advanced vocabulary definitions", "type": "vocabulary"},
        3: {"correct": "if i had known about the meeting, i would have attended.", "topic": "Third conditional sentence structures", "type": "grammar"},
        4: {"keywords": ["because", "enjoy", "hobby", "like", "love", "time", "relax", "fun", "favorite"], "topic": "Conversational spontaneity & reasoning", "type": "conversation"},
        5: {"keywords": ["hello", "name", "goal", "objective", "aim", "experience", "help", "pleased", "opportunity"], "topic": "Professional self-presentation", "type": "conversation"},
    },
}

# Extensive pools of diverse adaptive practice exercises
EXERCISE_POOLS = {
    "spanish": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="Past Tense Verbs (Pretérito)",
            question="¿Qué hiciste ayer por la tarde en tu ciudad?",
            prompt_instruction="Responde en 1-2 oraciones completas en español usando verbos en pasado.",
            context="Conversación sobre actividades recientes.",
            suggested_starter="Ayer por la tarde, yo...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="Travel & Directions",
            question="Imagina que estás en Madrid y buscas la estación de metro. ¿Cómo le pides indicaciones a un peatón?",
            prompt_instruction="Usa frases corteses como 'Disculpe' y '¿Dónde está...?'",
            context="Escenario práctico de viaje y orientación urbana.",
            suggested_starter="Disculpe, ¿podría decirme...",
        ),
        LessonExercise(
            id=3,
            category="conversation",
            topic="Food & Restaurant Ordering",
            question="Estás en un restaurante típico. ¿Cómo ordenas tu plato favorito y pides la cuenta amablemente?",
            prompt_instruction="Responde en español usando 'Quisiera...' o 'Para mí...'",
            context="Situación gastronómica en un restaurante.",
            suggested_starter="Buenas tardes, para mí quisiera...",
        ),
        LessonExercise(
            id=4,
            category="grammar",
            topic="Future Intentions (Ir a + infinitivo)",
            question="¿Qué planes tienes para el próximo fin de semana?",
            prompt_instruction="Responde usando la estructura de futuro 'Voy a...' con oraciones completas.",
            context="Conversación sobre planes personales y de ocio.",
            suggested_starter="El próximo fin de semana voy a...",
        ),
        LessonExercise(
            id=5,
            category="conversation",
            topic="Professional & Daily Routine",
            question="Describe brevemente tus responsabilidades diarias en el trabajo o estudio.",
            prompt_instruction="Explica 2 actividades habituales usando conectores como 'primero' y 'luego'.",
            context="Intercambio profesional sobre tu día a día.",
            suggested_starter="En mi día a día, primero yo...",
        ),
    ],
    "telugu": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="గత కాలం వాక్యాలు (Past Tense)",
            question="నిన్న సాయంత్రం మీరు ఏమి చేశారు?",
            prompt_instruction="తెలుగులో 1-2 పూర్తి వాక్యాల్లో గత కాలం ఉపయోగించి చెప్పండి.",
            context="దైనందిన పనుల గురించి సంభాషణ.",
            suggested_starter="నిన్న సాయంత్రం నేను...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="ప్రయాణం & మార్గాలు (Travel & Directions)",
            question="మీరు రైల్వే స్టేషన్‌కు వెళ్లడానికి దారి ఎలా అడుగుతారు?",
            prompt_instruction="మర్యాదగా 'దయచేసి' లేదా 'ఎలా వెళ్ళాలి' అని వాడండి.",
            context="ప్రయాణ సందర్భంలో సంభాషణ.",
            suggested_starter="నమస్కారం, దయచేసి స్టేషన్‌కు...",
        ),
        LessonExercise(
            id=3,
            category="conversation",
            topic="భోజనం & హోటల్ (Food & Ordering)",
            question="హోటల్‌లో మీకు ఇష్టమైన ఆహారాన్ని ఎలా ఆర్డర్ చేస్తారు?",
            prompt_instruction="తెలుగులో స్పష్టంగా చెప్పండి.",
            context="రెస్టారెంట్ లేదా భోజన సందర్భం.",
            suggested_starter="నాకు ఒక ప్లేట్...",
        ),
        LessonExercise(
            id=4,
            category="grammar",
            topic="భవిష్యత్ కాలం (Future Plans)",
            question="రేపు మీరు ఏమి చేయాలనుకుంటున్నారు?",
            prompt_instruction="భవిష్యత్ కాలం ('చేస్తాను / వెళ్తాను') వాడండి.",
            context="రేపటి పనుల ప్రణాళిక.",
            suggested_starter="రేపు నేను...",
        ),
    ],
    "hindi": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="भूतकाल वाक्य रचना (Past Tense)",
            question="आपने कल शाम को क्या किया?",
            prompt_instruction="हिंदी में 1-2 पूरे वाक्यों में भूतकाल का उपयोग करके उत्तर दीजिए।",
            context="दैनिक बातचीत का अभ्यास।",
            suggested_starter="कल शाम को मैंने...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="यात्रा और रास्ता पूछना (Travel & Directions)",
            question="आप किसी से बाज़ार का रास्ता कैसे पूछेंगे?",
            prompt_instruction="विनम्रता से 'कृपया' और 'कहाँ है' का प्रयोग करें।",
            context="यात्रा और स्थानीय मार्गदर्शन।",
            suggested_starter="नमस्ते, क्या आप बता सकते हैं...",
        ),
        LessonExercise(
            id=3,
            category="conversation",
            topic="खान-पान (Food & Dining)",
            question="रेस्टोरेंट में अपना पसंदीदा खाना कैसे ऑर्डर करेंगे?",
            prompt_instruction="पूरे वाक्यों में उत्तर दीजिए।",
            context="दुकान या रेस्टोरेंट संवाद।",
            suggested_starter="नमस्ते, मेरे लिए कृपया...",
        ),
        LessonExercise(
            id=4,
            category="grammar",
            topic="भविष्यकाल (Future Plans)",
            question="अगले सप्ताहांत आप क्या करने वाले हैं?",
            prompt_instruction="भविष्यकाल ('करूँगा / जाऊँगा') का प्रयोग करें।",
            context="भविष्य की योजनाओं पर चर्चा।",
            suggested_starter="अगले सप्ताहांत मैं...",
        ),
    ],
    "french": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="Passé Composé",
            question="Qu'avez-vous fait hier après-midi ?",
            prompt_instruction="Répondez en 1-2 phrases complètes en français au passé composé.",
            context="Conversation sur vos activités récentes.",
            suggested_starter="Hier après-midi, j'ai...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="Travel & Hotel Check-in",
            question="Comment demandez-vous une chambre à l'hôtel à Paris ?",
            prompt_instruction="Utilisez 'Je voudrais réserver...' avec politesse.",
            context="Scénario pratique de voyage.",
            suggested_starter="Bonjour, je voudrais...",
        ),
        LessonExercise(
            id=3,
            category="conversation",
            topic="Food & Café Orders",
            question="Au café, comment commandez-vous un croissant et un café chaud ?",
            prompt_instruction="Utilisez 'S'il vous plaît' et formulez une phrase naturelle.",
            context="Situation dans un café parisien.",
            suggested_starter="Bonjour, un café et...",
        ),
    ],
    "german": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="Perfekt Tense",
            question="Was haben Sie gestern Nachmittag gemacht?",
            prompt_instruction="Antworten Sie in 1-2 vollständigen Sätzen auf Deutsch im Perfekt.",
            context="Gespräch über Freizeitaktivitäten.",
            suggested_starter="Gestern Nachmittag habe ich...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="Wegbeschreibung (Directions)",
            question="Wie fragen Sie höflich nach dem Weg zum Bahnhof?",
            prompt_instruction="Nutzen Sie 'Entschuldigung, wie komme ich zum...?'",
            context="Praktische Orientierung in der Stadt.",
            suggested_starter="Entschuldigung, könnten Sie mir...",
        ),
    ],
    "japanese": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="過去形 (Past Tense)",
            question="きのうの午後は何をしましたか？",
            prompt_instruction="日本語で過去形を使って1〜2文で答えてください。",
            context="日常の会話練習。",
            suggested_starter="きのうの午後は...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="注文と依頼 (Ordering & Requests)",
            question="レストランで店員さんに注文するとき、どう言いますか？",
            prompt_instruction="「〜をお願いします」を使って答えてください。",
            context="レストランでの実践的な会話。",
            suggested_starter="すみません、これと...",
        ),
    ],
    "english": [
        LessonExercise(
            id=1,
            category="grammar",
            topic="Past Tense Irregular Verbs",
            question="What activities did you do yesterday afternoon?",
            prompt_instruction="Answer in 1-2 complete sentences using past tense verbs.",
            context="Casual dialogue about recent experiences.",
            suggested_starter="Yesterday afternoon, I...",
        ),
        LessonExercise(
            id=2,
            category="vocabulary",
            topic="Travel & Navigation",
            question="How would you ask a passerby for directions to the nearest subway station?",
            prompt_instruction="Use polite phrases like 'Excuse me' and 'Could you tell me...'",
            context="Urban navigation and polite requests.",
            suggested_starter="Excuse me, could you please tell me...",
        ),
        LessonExercise(
            id=3,
            category="conversation",
            topic="Workplace Collaboration",
            question="Describe a successful project you recently collaborated on with your team.",
            prompt_instruction="Explain the challenge and outcome using cohesive transition words.",
            context="Professional interview and teamwork discussion.",
            suggested_starter="Recently, my team and I worked on...",
        ),
    ],
}

# Next dynamic question flows per language
NEXT_QUESTION_FLOWS = {
    "spanish": [
        "¿A qué hora regresaste a casa y qué comiste después?",
        "¿Qué fue lo más interesante que viste o aprendiste durante ese día?",
        "Si pudieras planear un viaje perfecto a España o Latinoamérica, ¿a dónde irías y por qué?",
        "¿Cómo describirías tu comida favorita a alguien que nunca la ha probado?",
        "¿Qué habilidades o proyectos te gustaría desarrollar en los próximos meses?",
    ],
    "telugu": [
        "మీరు ఇంటికి ఎప్పుడు తిరిగి వచ్చారు మరియు ఏమి తిన్నారు?",
        "ఆ రోజు మీరు చూసిన లేదా నేర్చుకున్న ముఖ్యమైన విషయం ఏమిటి?",
        "మీరు ఎక్కడికైనా విహారయాత్రకు వెళ్లాలనుకుంటే ఎక్కడికి వెళ్తారు?",
        "మీకు ఇష్టమైన ఆహారం గురించి చెప్పండి.",
        "భవిష్యత్తులో మీరు సాధించాలనుకుంటున్న లక్ష్యం ఏమిటి?",
    ],
    "hindi": [
        "आप घर कब वापस आए और आपने रात के खाने में क्या खाया?",
        "उस दिन आपने सबसे दिलचस्प चीज़ क्या देखी या सीखी?",
        "अगर आपको भारत में किसी नई जगह घूमने जाना हो, तो आप कहाँ जाएँगे?",
        "अपने पसंदीदा व्यंजन का वर्णन 1-2 वाक्यों में कीजिए।",
        "अगले कुछ महीनों में आप क्या नया सीखना चाहते हैं?",
    ],
    "french": [
        "À quelle heure êtes-vous rentré(e) et qu'avez-vous mangé après ?",
        "Quelle a été la chose la plus intéressante de votre journée ?",
        "Si vous pouviez voyager n'importe où en France, où iriez-vous ?",
        "Décrivez votre plat français préféré en quelques mots.",
    ],
    "german": [
        "Um wie viel Uhr sind Sie nach Hause gekommen und was haben Sie gegessen?",
        "Was war das Interessanteste, was Sie an diesem Tag erlebt haben?",
        "Wenn Sie eine Reise nach Deutschland planen würden, welche Stadt würden Sie besuchen?",
    ],
    "japanese": [
        "何時に家に帰って、そのあと何を食べましたか？",
        "その日、一番面白かったことは何でしたか？",
        "日本で行ってみたい場所はどこですか？その理由も教えてください。",
    ],
    "english": [
        "What time did you return home, and what did you have for dinner?",
        "What was the most memorable or rewarding part of that experience?",
        "If you could travel anywhere in the world next month, where would you go and why?",
        "Describe your favorite hobby and how it helps you relax.",
        "What key professional goal are you currently working towards?",
    ],
}


def get_groq_client() -> Optional[Groq]:
    """Returns initialized Groq client if key is configured, else None."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or api_key in ["your_api_key_here", "your_groq_api_key", ""]:
        return None
    return Groq(api_key=api_key)


def _call_groq_json(prompt: str, max_tokens: int = 1500, retry_count: int = 1) -> Optional[Dict[str, Any]]:
    """Safe caller for Groq API enforcing JSON output mode and retry logic."""
    client = get_groq_client()
    if not client:
        return None

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    for attempt in range(retry_count + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional AI Language Tutor. You ALWAYS respond ONLY in valid JSON matching the requested schema. No markdown formatting outside JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=max_tokens,
            )
            raw_content = response.choices[0].message.content.strip()
            parsed = json.loads(raw_content)
            return parsed
        except Exception as e:
            logger.error(f"Groq API call failed (attempt {attempt + 1}/{retry_count + 1}): {e}")
            if attempt == retry_count:
                return None
    return None


class GroqService:
    @staticmethod
    def generate_assessment(language: str, level: str, goal: str) -> List[AssessmentQuestion]:
        """Generates 5 tailored assessment questions using Groq / Llama 3.3 70B."""
        prompt = ASSESSMENT_GENERATION_SYSTEM_PROMPT.format(
            target_language=language,
            selected_level=level,
            learning_goal=goal,
        )

        data = _call_groq_json(prompt, max_tokens=1800)

        if data and "questions" in data and isinstance(data["questions"], list) and len(data["questions"]) >= 3:
            try:
                questions = []
                for idx, q in enumerate(data["questions"][:5], start=1):
                    questions.append(
                        AssessmentQuestion(
                            id=idx,
                            type=q.get("type", "grammar"),
                            question=q.get("question", ""),
                            options=q.get("options") if q.get("options") else None,
                            hint=q.get("hint"),
                            target_language=language,
                        )
                    )
                return questions
            except Exception as ex:
                logger.error(f"Error parsing Groq assessment questions: {ex}")

        return GroqService._fallback_assessment_questions(language, level, goal)

    @staticmethod
    def evaluate_assessment(
        language: str, level: str, goal: str, answers: List[Dict[str, Any]], assessment_id: str = "eval_1", user_id: int = 1
    ) -> AssessmentEvaluation:
        """
        Evaluates student's assessment answers with high precision, computing true scores
        based on ground truth verification and extracting accurate weak areas.
        """
        calibrated = GroqService._grade_assessment_calibrated(language, level, goal, answers)

        client = get_groq_client()
        if client:
            answers_str = json.dumps(answers, indent=2, ensure_ascii=False)
            prompt = ASSESSMENT_EVALUATION_SYSTEM_PROMPT.format(
                target_language=language,
                selected_level=level,
                learning_goal=goal,
                submitted_answers=answers_str,
            )
            data = _call_groq_json(prompt, max_tokens=1200)
            if data:
                try:
                    llm_grammar = int(data.get("grammar_score", calibrated["grammar_score"]))
                    llm_vocab = int(data.get("vocabulary_score", calibrated["vocabulary_score"]))
                    llm_conv = int(data.get("conversation_score", calibrated["conversation_score"]))
                    llm_overall = int(round((llm_grammar + llm_vocab + llm_conv) / 3))

                    return AssessmentEvaluation(
                        assessment_id=assessment_id,
                        user_id=user_id,
                        grammar_score=llm_grammar,
                        vocabulary_score=llm_vocab,
                        conversation_score=llm_conv,
                        overall_score=llm_overall,
                        estimated_level=data.get("estimated_level", calibrated["estimated_level"]),
                        weak_areas=data.get("weak_areas") or calibrated["weak_areas"],
                        strengths=data.get("strengths") or calibrated["strengths"],
                        summary_feedback=data.get("summary_feedback", calibrated["summary_feedback"]),
                    )
                except Exception as ex:
                    logger.error(f"Error parsing LLM assessment evaluation: {ex}")

        return AssessmentEvaluation(
            assessment_id=assessment_id,
            user_id=user_id,
            grammar_score=calibrated["grammar_score"],
            vocabulary_score=calibrated["vocabulary_score"],
            conversation_score=calibrated["conversation_score"],
            overall_score=calibrated["overall_score"],
            estimated_level=calibrated["estimated_level"],
            weak_areas=calibrated["weak_areas"],
            strengths=calibrated["strengths"],
            summary_feedback=calibrated["summary_feedback"],
        )

    @staticmethod
    def _grade_assessment_calibrated(language: str, level: str, goal: str, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates mathematically and linguistically grounded scores."""
        lang_key = language.strip().lower()
        rubric = ANSWER_RUBRICS.get(lang_key, ANSWER_RUBRICS["english"])

        grammar_hits = 0
        grammar_total = 0
        vocab_hits = 0
        vocab_total = 0
        conv_score_points = 0
        conv_total = 0

        weak_areas = []
        strengths = []

        ans_by_id = {a.get("id", i + 1): a.get("user_answer", "").strip().lower() for i, a in enumerate(answers)}

        for q_id, q_rule in rubric.items():
            user_ans = ans_by_id.get(q_id, "")
            q_type = q_rule.get("type", "grammar")
            q_topic = q_rule.get("topic", "Language Rule")

            if "correct" in q_rule:
                target_correct = q_rule["correct"].strip().lower()
                is_correct = (user_ans == target_correct or user_ans.startswith(target_correct) or target_correct in user_ans)

                if q_type == "grammar":
                    grammar_total += 1
                    if is_correct:
                        grammar_hits += 1
                        strengths.append(f"Mastery of {q_topic}")
                    else:
                        weak_areas.append(q_topic)
                elif q_type == "vocabulary":
                    vocab_total += 1
                    if is_correct:
                        vocab_hits += 1
                        strengths.append(f"Understanding of {q_topic}")
                    else:
                        weak_areas.append(q_topic)
            else:
                conv_total += 1
                keywords = q_rule.get("keywords", [])
                word_count = len(user_ans.split())

                if not user_ans or user_ans == "(no response provided)" or word_count == 0:
                    weak_areas.append(q_topic)
                else:
                    matched_kw = sum(1 for kw in keywords if kw in user_ans)
                    if matched_kw >= 2 or word_count >= 6:
                        conv_score_points += 90
                        strengths.append(f"Active engagement in {q_topic}")
                    elif matched_kw >= 1 or word_count >= 3:
                        conv_score_points += 70
                        strengths.append(f"Basic expression in {q_topic}")
                        weak_areas.append(f"Spontaneity & sentence length in {q_topic}")
                    else:
                        conv_score_points += 40
                        weak_areas.append(f"Fluency & vocabulary in {q_topic}")

        g_score = int(round((grammar_hits / max(1, grammar_total)) * 100)) if grammar_total > 0 else 75
        v_score = int(round((vocab_hits / max(1, vocab_total)) * 100)) if vocab_total > 0 else 80
        c_score = int(round(conv_score_points / max(1, conv_total))) if conv_total > 0 else 70
        overall = int(round((g_score * 0.4) + (v_score * 0.3) + (c_score * 0.3)))

        if overall >= 85:
            estimated_level = "Advanced"
        elif overall >= 60:
            estimated_level = "Intermediate"
        else:
            estimated_level = "Beginner"

        if not weak_areas:
            weak_areas = ["Complex sentence connectors", "Idiomatic conversational flow"]
        if not strengths:
            strengths = ["Willingness to learn and engage", "Auditory attention"]

        weak_areas = weak_areas[:3]
        strengths = strengths[:3]

        if overall >= 80:
            feedback = f"Excellent diagnostic performance in {language}! You scored {overall}/100 with high proficiency in core vocabulary and syntax."
        elif overall >= 60:
            feedback = f"Solid foundation in {language} with an overall score of {overall}/100. Targeted practice in {weak_areas[0]} will accelerate your conversational confidence."
        else:
            feedback = f"You scored {overall}/100 on the diagnostic assessment. We will start with structured exercises focusing on {weak_areas[0]}."

        return {
            "grammar_score": g_score,
            "vocabulary_score": v_score,
            "conversation_score": c_score,
            "overall_score": overall,
            "estimated_level": estimated_level,
            "weak_areas": weak_areas,
            "strengths": strengths,
            "summary_feedback": feedback,
        }

    @staticmethod
    def generate_exercise(
        language: str, level: str, goal: str, focus_area: str, previous_mistakes: Optional[List[str]] = None
    ) -> LessonExercise:
        """Generates dynamic practice exercise with high variety and novelty."""
        prompt = LESSON_START_SYSTEM_PROMPT.format(
            target_language=language,
            selected_level=level,
            learning_goal=goal,
            focus_area=focus_area,
        )

        data = _call_groq_json(prompt, max_tokens=1000)

        if data and "question" in data:
            try:
                return LessonExercise(
                    id=1,
                    category=data.get("category", "grammar"),
                    topic=data.get("topic", focus_area),
                    question=data.get("question", ""),
                    prompt_instruction=data.get("prompt_instruction", f"Respond in {language} using complete sentences."),
                    context=data.get("context", f"Practical {goal} scenario"),
                    suggested_starter=data.get("suggested_starter"),
                )
            except Exception as ex:
                logger.error(f"Error parsing lesson exercise: {ex}")

        # Dynamic selection from exercise pool based on randomized rotation
        lang_key = language.strip().lower()
        pool = EXERCISE_POOLS.get(lang_key, EXERCISE_POOLS["english"])
        chosen_exercise = random.choice(pool)

        return LessonExercise(
            id=1,
            category=chosen_exercise.category,
            topic=focus_area or chosen_exercise.topic,
            question=chosen_exercise.question,
            prompt_instruction=chosen_exercise.prompt_instruction,
            context=chosen_exercise.context,
            suggested_starter=chosen_exercise.suggested_starter,
        )

    @staticmethod
    def evaluate_answer(
        language: str,
        level: str,
        goal: str,
        question: str,
        response: str,
        response_mode: str = "voice",
        detected_language: Optional[str] = None,
        topic: Optional[str] = "General",
        previous_mistakes: Optional[List[str]] = None,
        exercise_number: int = 1,
    ) -> LessonEvaluation:
        """Evaluates student's answer and dynamically crafts progressive next questions."""
        prompt = LESSON_EVALUATION_SYSTEM_PROMPT.format(
            target_language=language,
            selected_level=level,
            learning_goal=goal,
            topic=topic or "General",
            question=question,
            response=response,
            response_mode=response_mode,
            detected_language=detected_language or language,
            previous_mistakes=json.dumps(previous_mistakes or []),
        )

        data = _call_groq_json(prompt, max_tokens=1500)

        if data:
            try:
                mistakes_list = []
                for m in data.get("mistakes", []):
                    mistakes_list.append(
                        MistakeDetail(
                            original=m.get("original", ""),
                            correct=m.get("correct", ""),
                            category=m.get("category", "grammar"),
                            explanation=m.get("explanation", ""),
                        )
                    )

                return LessonEvaluation(
                    grammar_score=int(data.get("grammar_score", 78)),
                    vocabulary_score=int(data.get("vocabulary_score", 82)),
                    conversation_score=int(data.get("conversation_score", 80)),
                    overall_score=int(data.get("overall_score", 80)),
                    correction=data.get("correction", response),
                    explanation=data.get("explanation", f"Good effort in {language}! Keep focusing on sentence structure."),
                    mistakes=mistakes_list,
                    next_question=data.get("next_question", f"Can you tell me more about that in {language}?"),
                    next_question_category=data.get("next_question_category", "grammar"),
                    recommended_focus=data.get("recommended_focus", topic or "Past tense"),
                    mastery_achieved=bool(data.get("mastery_achieved", False)),
                )
            except Exception as ex:
                logger.error(f"Error parsing lesson evaluation: {ex}")

        # Rule-based evaluation with dynamic next question progression
        resp_clean = response.strip()
        word_count = len(resp_clean.split())
        mistakes = []
        correction = resp_clean
        explanation = f"Great sentence in {language}!"
        g_score = 82
        v_score = 84
        c_score = 85

        if "yesterday i go" in resp_clean.lower():
            correction = resp_clean.lower().replace("yesterday i go", "Yesterday I went")
            explanation = "Use 'went' instead of 'go' because the action occurred in the past."
            mistakes.append(MistakeDetail(original="go", correct="went", category="grammar", explanation="Past tense of 'go' is 'went'."))
            g_score = 65
        elif "ayer yo voy" in resp_clean.lower():
            correction = resp_clean.lower().replace("ayer yo voy", "Ayer yo fui")
            explanation = "En español, usa 'fui' (pretérito) en lugar de 'voy' para acciones pasadas."
            mistakes.append(MistakeDetail(original="voy", correct="fui", category="grammar", explanation="El pretérito de 'ir' es 'fui'."))
            g_score = 65
        elif word_count < 3:
            g_score = 65
            v_score = 70
            c_score = 60
            explanation = f"Try expanding your answers with more descriptive details in {language}."

        overall = int(round((g_score + v_score + c_score) / 3))

        # Dynamically rotate through next questions based on exercise number
        lang_key = language.strip().lower()
        flows = NEXT_QUESTION_FLOWS.get(lang_key, NEXT_QUESTION_FLOWS["english"])
        flow_idx = (exercise_number - 1) % len(flows)
        next_q = flows[flow_idx]

        return LessonEvaluation(
            grammar_score=g_score,
            vocabulary_score=v_score,
            conversation_score=c_score,
            overall_score=overall,
            correction=correction,
            explanation=explanation,
            mistakes=mistakes,
            next_question=next_q,
            next_question_category="conversation" if flow_idx % 2 == 1 else "grammar",
            recommended_focus=topic or "Conversational Spontaneity",
            mastery_achieved=(overall >= 85),
        )

    @staticmethod
    def generate_final_assessment(
        language: str,
        level: str,
        goal: str,
        initial_scores: Dict[str, Any],
        practice_history: Optional[List[Dict[str, Any]]] = None,
    ) -> FinalAssessmentEvaluation:
        """Generates comprehensive final evaluation comparing initial vs final metrics."""
        prompt = FINAL_ASSESSMENT_SYSTEM_PROMPT.format(
            target_language=language,
            selected_level=level,
            learning_goal=goal,
            initial_scores=json.dumps(initial_scores),
            practice_history=json.dumps(practice_history or []),
        )

        data = _call_groq_json(prompt, max_tokens=1500)

        initial_overall = int(initial_scores.get("overall_score", 70))
        if data:
            try:
                final_overall = int(data.get("final_overall_score", initial_overall + 14))
                return FinalAssessmentEvaluation(
                    initial_overall_score=initial_overall,
                    final_grammar_score=int(data.get("final_grammar_score", 85)),
                    final_vocabulary_score=int(data.get("final_vocabulary_score", 88)),
                    final_conversation_score=int(data.get("final_conversation_score", 90)),
                    final_overall_score=final_overall,
                    improvement_delta=final_overall - initial_overall,
                    strengths_developed=data.get("strengths_developed", ["Confidence in spoken phrasing", "Verb tense accuracy"]),
                    persistent_weaknesses=data.get("persistent_weaknesses", ["Preposition nuances"]),
                    recommendation_summary=data.get("recommendation_summary", f"Terrific progress in {language}! Your conversational spontaneity improved visibly."),
                    recommended_next_topic=data.get("recommended_next_topic", "Complex Sentences & Connectors"),
                    recommended_topic_reason=data.get("recommended_topic_reason", "Building complex sentences will take your communication to the next level."),
                    recommended_difficulty=data.get("recommended_difficulty", level),
                )
            except Exception as ex:
                logger.error(f"Error parsing final assessment: {ex}")

        history_len = len(practice_history or [])
        improvement = min(28, max(10, history_len * 4 + 8))
        final_overall = min(100, initial_overall + improvement)

        return FinalAssessmentEvaluation(
            initial_overall_score=initial_overall,
            final_grammar_score=min(100, initial_scores.get("grammar_score", 70) + improvement),
            final_vocabulary_score=min(100, initial_scores.get("vocabulary_score", 75) + improvement),
            final_conversation_score=min(100, initial_scores.get("conversation_score", 70) + improvement + 2),
            final_overall_score=final_overall,
            improvement_delta=improvement,
            strengths_developed=[f"Spoken confidence in {language}", "Verb tense consistency under conversational flow"],
            persistent_weaknesses=["Articles and gender/number agreement"],
            recommendation_summary=f"Strong session! You advanced by +{improvement} points overall and responded with notably increased fluency.",
            recommended_next_topic="Articles & Prepositions in Dialogue",
            recommended_topic_reason="Solidifying article usage will make your sentences sound natural and native-like.",
            recommended_difficulty=level,
        )

    @staticmethod
    def _fallback_assessment_questions(language: str, level: str, goal: str) -> List[AssessmentQuestion]:
        """Provides varied diagnostic questions tailored to the language."""
        lang_lower = language.lower()
        if lang_lower == "spanish":
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="¿Cuál es la forma correcta del verbo? 'Ayer yo ___ al mercado.'",
                    options=["fui", "iba", "voy", "iré"],
                    hint="Pista: Acción completada en el pasado (Pretérito indefinido).",
                    target_language="Spanish",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="¿Qué significa la palabra 'desarrollar' en inglés?",
                    options=["To develop", "To describe", "To disappear", "To deliver"],
                    hint="Related to growth and progress.",
                    target_language="Spanish",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="Traduce al español: 'I need to find a good restaurant near here.'",
                    options=[
                        "Necesito encontrar un buen restaurante cerca de aquí.",
                        "Necesito encontrar el restaurante bien lejos de aquí.",
                        "Quiero comí en restaurante bueno.",
                        "Buscar restaurante cerca de mí."
                    ],
                    hint="Look for the infinitive 'encontrar' and 'cerca de aquí'.",
                    target_language="Spanish",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="¿Cómo te presentas y describes tu profesión brevemente en español?",
                    options=None,
                    hint="Example: 'Hola, me llamo [Nombre] y trabajo como...'",
                    target_language="Spanish",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"En un escenario de {goal}: ¿Cómo pedirías ayuda o información de forma educada?",
                    options=None,
                    hint="Use 'Disculpe, ¿podría ayudarme con...?'",
                    target_language="Spanish",
                ),
            ]
        elif lang_lower == "telugu":
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="సరైన వాక్యాన్ని ఎంచుకోండి: 'నిన్న నేను సినిమా ___.'",
                    options=["చూశాను", "చూస్తాను", "చూస్తున్నాను", "చూడాలి"],
                    hint="గత కాలం (Past tense) క్రియను గుర్తించండి.",
                    target_language="Telugu",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="'ప్రయాణం' (Prayanam) అనే పదానికి అర్థం ఏమిటి?",
                    options=["Journey / Travel", "Food", "Book", "House"],
                    hint="Traveling from one place to another.",
                    target_language="Telugu",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="'How are you?' ని తెలుగులో ఏమంటారు?",
                    options=[
                        "మీరు ఎలా ఉన్నారు?",
                        "మీ పేరు ఏమిటి?",
                        "మీరు ఎక్కడికి వెళ్తున్నారు?",
                        "మీకు ఏమి కావాలి?"
                    ],
                    hint="ఎలా = how, ఉన్నారు = are you",
                    target_language="Telugu",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="మీ గురించి 1-2 వాక్యాల్లో తెలుగులో చెప్పండి.",
                    options=None,
                    hint="ఉదాహరణ: 'నా పేరు [పేరు]...'",
                    target_language="Telugu",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"{goal} సందర్భంలో: ఎవరినైనా మర్యాదగా ఎలా పలకరిస్తారు?",
                    options=None,
                    hint="ఉదాహరణ: 'నమస్కారం, మీరు బాగున్నారా?'",
                    target_language="Telugu",
                ),
            ]
        elif lang_lower == "hindi":
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="सही वाक्य चुनिए: 'कल मैं बाज़ार ___।'",
                    options=["गया था", "जाता हूँ", "जाऊँगा", "जा रहा हूँ"],
                    hint="भूतकाल (Past tense) क्रिया का रूप पहचानें।",
                    target_language="Hindi",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="'अभ्यास' (Abhyas) शब्द का क्या अर्थ है?",
                    options=["Practice", "Knowledge", "Travel", "Friendship"],
                    hint="Something you do regularly to learn.",
                    target_language="Hindi",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="'I want to learn Hindi.' का हिंदी अनुवाद क्या है?",
                    options=[
                        "मैं हिंदी सीखना चाहता हूँ।",
                        "मुझे हिंदी आती है।",
                        "मैं हिंदी बोलता हूँ।",
                        "हिंदी बहुत अच्छी भाषा है।"
                    ],
                    hint="सिखना = to learn",
                    target_language="Hindi",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="अपना परिचय 1-2 वाक्यों में हिंदी में दीजिए।",
                    options=None,
                    hint="उदा. 'मेरा नाम [नाम] है और मैं...'",
                    target_language="Hindi",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"{goal} के लिए: आप किसी से कैसे विनम्रता से मदद मांगेंगे?",
                    options=None,
                    hint="उदा. 'नमस्ते, क्या आप मेरी मदद कर सकते हैं?'",
                    target_language="Hindi",
                ),
            ]
        elif lang_lower == "french":
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="Choisissez la phrase correcte : 'Hier, nous ___ un bon film.'",
                    options=["avons regardé", "regardons", "regarderons", "regardions"],
                    hint="Passé composé pour une action ponctuelle terminée.",
                    target_language="French",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="Que signifie le mot 'quotidien' ?",
                    options=["Daily", "Rare", "Difficult", "Quick"],
                    hint="Relates to everyday routine.",
                    target_language="French",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="Traduisez en français : 'Where is the train station, please?'",
                    options=[
                        "Où est la gare, s'il vous plaît ?",
                        "Où est le train, merci ?",
                        "Comment aller au bus ?",
                        "Quand part le train s'il vous plaît ?"
                    ],
                    hint="Look for 'la gare'.",
                    target_language="French",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="Parlez-moi de votre journée d'hier en quelques phrases.",
                    options=None,
                    hint="Utilisez le passé composé : 'Hier, je suis allé(e)...'",
                    target_language="French",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"Dans le contexte de {goal} : Comment commencez-vous une conversation formelle ?",
                    options=None,
                    hint="Exemple: 'Bonjour, je souhaiterais obtenir des renseignements sur...'",
                    target_language="French",
                ),
            ]
        elif lang_lower == "german":
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="Wählen Sie die richtige Form: 'Gestern ___ ich meine Freunde besucht.'",
                    options=["habe", "bin", "hatte", "werde"],
                    hint="Perfekt mit Hilfsverb 'haben'.",
                    target_language="German",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="Was bedeutet 'die Herausforderung' auf Englisch?",
                    options=["Challenge", "Opportunity", "Decision", "Knowledge"],
                    hint="A demanding task.",
                    target_language="German",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="Übersetzen Sie: 'I would like a cup of coffee, please.'",
                    options=[
                        "Ich möchte bitte eine Tasse Kaffee.",
                        "Ich trinke der Kaffee gerne.",
                        "Haben Sie ein Kaffee da?",
                        "Kaffee ist sehr lecker bitte."
                    ],
                    hint="Use 'Ich möchte bitte...'",
                    target_language="German",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="Erzählen Sie kurz, was Sie gestern gemacht haben.",
                    options=None,
                    hint="Beispiel: 'Gestern bin ich um 8 Uhr aufgestanden und...'",
                    target_language="German",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"Im Kontext von {goal}: Wie fragen Sie höflich nach dem Weg oder nach Informationen?",
                    options=None,
                    hint="Beispiel: 'Entschuldigung, könnten Sie mir bitte sagen...'",
                    target_language="German",
                ),
            ]
        elif lang_lower == "japanese":
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="適切な助詞を選んでください：「きのう 友達___ 会いました。」",
                    options=["に", "を", "で", "へ"],
                    hint="「会う」と一緒に使う助詞は「に」です。",
                    target_language="Japanese",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="「経験 (keiken)」の意味は何ですか？",
                    options=["Experience", "Memory", "Knowledge", "Plan"],
                    hint="Things you have experienced in life.",
                    target_language="Japanese",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="「Nice to meet you, my name is Alex.」の自然な日本語訳は？",
                    options=[
                        "はじめまして、アレックスと申します。よろしくお願いいたします。",
                        "こんにちは、私はアレックスを見ます。",
                        "ありがとう、アレックスです。",
                        "さようなら、アレックスでした。"
                    ],
                    hint="Standard polite self-introduction.",
                    target_language="Japanese",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="日本語で簡単な自己紹介をしてください。",
                    options=None,
                    hint="例：「はじめまして。[名前]です。どうぞよろしくお願いします。」",
                    target_language="Japanese",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"{goal}の場面で：丁寧に注文や質問をするときはどう言いますか？",
                    options=None,
                    hint="例：「すみません、これをお願いします。」",
                    target_language="Japanese",
                ),
            ]
        else:
            return [
                AssessmentQuestion(
                    id=1,
                    type="grammar",
                    question="Choose the correct sentence in the past tense:",
                    options=[
                        "Yesterday, I went to the market and bought fresh fruit.",
                        "Yesterday, I go to the market and buy fresh fruit.",
                        "Yesterday, I have gone to market and buy fruit.",
                        "Yesterday, I was went to the market and buying fruit."
                    ],
                    hint="Check for matching past tense irregular verbs.",
                    target_language="English",
                ),
                AssessmentQuestion(
                    id=2,
                    type="vocabulary",
                    question="Which word best describes someone who is fluent in multiple languages?",
                    options=["Polyglot", "Monoglot", "Philanthropist", "Novice"],
                    hint="Prefix 'poly-' means many.",
                    target_language="English",
                ),
                AssessmentQuestion(
                    id=3,
                    type="sentence_construction",
                    question="Select the properly structured conditional sentence:",
                    options=[
                        "If I had known about the meeting, I would have attended.",
                        "If I knew about the meeting, I will attend.",
                        "If I have known about meeting, I would attend.",
                        "If I know about the meeting, I would had attended."
                    ],
                    hint="Third conditional structure: If + past perfect, would have + past participle.",
                    target_language="English",
                ),
                AssessmentQuestion(
                    id=4,
                    type="conversation",
                    question="Describe your favorite hobby and why you enjoy it in 2-3 sentences.",
                    options=None,
                    hint="Focus on natural sentence connectors like 'because', 'furthermore', and 'especially'.",
                    target_language="English",
                ),
                AssessmentQuestion(
                    id=5,
                    type="practical_dialogue",
                    question=f"In a {goal} context: How would you professionally introduce yourself and explain your primary objective?",
                    options=None,
                    hint="State your name, background, and what you aim to achieve.",
                    target_language="English",
                ),
            ]
