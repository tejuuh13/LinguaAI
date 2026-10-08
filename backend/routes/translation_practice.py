import os
import json
import logging
import re
import difflib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ..database.database import get_db
from ..database.models import User, Progress, LearningSession, Mistake
from ..services.groq_service import _call_groq_json, get_groq_client

router = APIRouter(prefix="/api/practice", tags=["translation_practice"])
logger = logging.getLogger(__name__)

# 10 Progressive Levels with Complete Script + English Transliteration (How to Speak)
LEVELS_DATA = [
    {
        "level": 1,
        "title": "Level 1: Essential Greetings & Introductions",
        "objective": "Master polite greetings, introducing your name, and courtesy phrases.",
        "starters": {
            "English": "Hello, my name is Alex and I am pleased to meet you.",
            "Spanish": "Hola, mi nombre es Alex y es un gusto conocerte.",
            "Hindi": "नमस्ते, मेरा नाम एलेक्स है और आपसे मिलकर खुशी हुई।",
            "Telugu": "నమస్కారం, నా పేరు అలెక్స్ మరియు మిమ్మల్ని కలవడం చాలా సంతోషం.",
            "French": "Bonjour, je m'appelle Alex et je suis ravi de vous rencontrer.",
            "German": "Hallo, mein Name ist Alex und ich freue mich, Sie kennenzulernen.",
            "Japanese": "はじめまして、私の名前はアレックスです。どうぞよろしくお願いします。",
        },
        "transliterations": {
            "English": "Hel-LOH, my name is Alex and I am pleased to meet you.",
            "Spanish": "OH-lah, mee NOHM-breh ess Alex ee ess oon GOOS-toh koh-noh-SEHR-teh.",
            "Hindi": "Namaste, mera naam Alex hai aur aapse milkar khushi hui.",
            "Telugu": "Namaskaram, naa peru Alex mariyu mimmalni kalavadam chaala santhosham.",
            "French": "Bohn-zhoor, zhuh mah-pell Alex ay zhuh swee rah-vee duh voo rahn-kohn-tray.",
            "German": "HAH-loh, myne NAH-muh ist Alex oont ikh froy-uh mikh, zee ken-nen-tsoo-lehr-nen.",
            "Japanese": "Hajimemashite, watashi no namae wa Alex desu. Douzo yoroshiku onegaishimasu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "నమస్కారం", "transliteration": "Namaskaram", "meaning": "Hello / Greetings"},
                {"word": "నా పేరు", "transliteration": "Naa peru", "meaning": "My name"},
                {"word": "అలెక్స్", "transliteration": "Alex", "meaning": "Alex"},
                {"word": "మరియు", "transliteration": "mariyu", "meaning": "and"},
                {"word": "మిమ్మల్ని కలవడం", "transliteration": "mimmalni kalavadam", "meaning": "meeting you"},
                {"word": "చాలా సంతోషం", "transliteration": "chaala santhosham", "meaning": "very happy / pleased"},
            ],
            "Hindi": [
                {"word": "नमस्ते", "transliteration": "Namaste", "meaning": "Hello"},
                {"word": "मेरा नाम", "transliteration": "Mera naam", "meaning": "My name"},
                {"word": "एलेक्स है", "transliteration": "Alex hai", "meaning": "is Alex"},
                {"word": "और आपसे मिलकर", "transliteration": "aur aapse milkar", "meaning": "and meeting you"},
                {"word": "खुशी हुई", "transliteration": "khushi hui", "meaning": "pleased / glad"},
            ],
            "Spanish": [
                {"word": "Hola", "transliteration": "OH-lah", "meaning": "Hello"},
                {"word": "mi nombre es", "transliteration": "mee NOHM-breh ess", "meaning": "my name is"},
                {"word": "y es un gusto", "transliteration": "ee ess oon GOOS-toh", "meaning": "and it is a pleasure"},
                {"word": "conocerte", "transliteration": "koh-noh-SEHR-teh", "meaning": "to meet you"},
            ],
        },
    },
    {
        "level": 2,
        "title": "Level 2: Daily Routine & Time Expressions",
        "objective": "Express times, morning routines, and everyday habits.",
        "starters": {
            "English": "Every morning at eight o'clock, I drink coffee and read.",
            "Spanish": "Cada mañana a las ocho en punto, tomo café y leo.",
            "Hindi": "हर सुबह आठ बजे, मैं कॉफ़ी पीता हूँ और पढ़ता हूँ।",
            "Telugu": "ప్రతి రోజు ఉదయం ఎనిమిది గంటలకు నేను కాఫీ తాగి చదువుతాను.",
            "French": "Chaque matin à huit heures, je bois du café et je lis.",
            "German": "Jeden Morgen um acht Uhr trinke ich Kaffee und lese.",
            "Japanese": "毎朝8時にコーヒーを飲んで本を読みます。",
        },
        "transliterations": {
            "English": "EV-ree MOR-ning at eight o'clock, I drink COF-fee and read.",
            "Spanish": "KAH-dah mah-NYAH-nah ah lahs OH-choh en POON-toh, TOH-moh kah-FEH ee LEH-oh.",
            "Hindi": "Har subah aath baje, main coffee peeta hoon aur padhta hoon.",
            "Telugu": "Prathi roju udayam enimidi gantalaku nenu coffee taagi chadavutaanu.",
            "French": "Shahk mah-tahn ah weet uhr, zhuh bwah dew kah-fay ay zhuh lee.",
            "German": "YEH-den MOR-gen oom akht oor TRIN-kuh ikh KAH-fay oont LEH-zuh.",
            "Japanese": "Maiasa hachiji ni koohii o nonde hon o yomimasu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "ప్రతి రోజు", "transliteration": "Prathi roju", "meaning": "Every day"},
                {"word": "ఉదయం", "transliteration": "udayam", "meaning": "morning"},
                {"word": "ఎనిమిది గంటలకు", "transliteration": "enimidi gantalaku", "meaning": "at 8 o'clock"},
                {"word": "నేను", "transliteration": "nenu", "meaning": "I"},
                {"word": "కాఫీ తాగి", "transliteration": "coffee taagi", "meaning": "drink coffee"},
                {"word": "చదువుతాను", "transliteration": "chadavutaanu", "meaning": "read / study"},
            ],
            "Hindi": [
                {"word": "हर सुबह", "transliteration": "Har subah", "meaning": "Every morning"},
                {"word": "आठ बजे", "transliteration": "aath baje", "meaning": "at 8 o'clock"},
                {"word": "मैं कॉफ़ी पीता हूँ", "transliteration": "main coffee peeta hoon", "meaning": "I drink coffee"},
                {"word": "और पढ़ता हूँ", "transliteration": "aur padhta hoon", "meaning": "and read"},
            ],
            "Spanish": [
                {"word": "Cada mañana", "transliteration": "KAH-dah mah-NYAH-nah", "meaning": "Every morning"},
                {"word": "a las ocho", "transliteration": "ah lahs OH-choh", "meaning": "at eight"},
                {"word": "tomo café", "transliteration": "TOH-moh kah-FEH", "meaning": "I drink coffee"},
                {"word": "y leo", "transliteration": "ee LEH-oh", "meaning": "and read"},
            ],
        },
    },
    {
        "level": 3,
        "title": "Level 3: Food, Café & Restaurant Ordering",
        "objective": "Confidently order meals, ask for recommendations, and request the bill.",
        "starters": {
            "English": "Excuse me, I would like to order the chef's special and the bill, please.",
            "Spanish": "Disculpe, quisiera pedir la especialidad del chef y la cuenta, por favor.",
            "Hindi": "माफ़ कीजिए, मैं शेफ़ का विशेष व्यंजन और बिल चाहता हूँ, कृपया।",
            "Telugu": "క్షమించండి, నాకు చెఫ్ స్పెషల్ వంటకం మరియు బిల్లు కావాలి, దయచేసి.",
            "French": "Excusez-moi, je voudrais commander la spécialité du chef et l'addition, s'il vous plaît.",
            "German": "Entschuldigung, ich möchte die Spezialität des Hauses und die Rechnung, bitte.",
            "Japanese": "すみません、シェフのおすすめ料理とお会計をお願いします。",
        },
        "transliterations": {
            "English": "Ex-CYOOZ me, I would like to OR-der the chef's SPE-shul and the bill, please.",
            "Spanish": "Dees-KOOL-peh, kee-SYEH-rah peh-DEER lah ess-peh-syah-lee-DAHD del chef ee lah KWEN-tah, por fah-VOR.",
            "Hindi": "Maaf kijiye, main chef ka vishesh vyanjan aur bill chahta hoon, kripya.",
            "Telugu": "Kshaminchandi, naaku chef special vantakam mariyu bill kaavali, dayachesi.",
            "French": "Ex-kew-zay mwah, zhuh voo-dray koh-mahn-day lah spay-syah-lee-tay dew chef ay lah-dee-syohn, seel voo pleh.",
            "German": "Ent-shool-dee-goong, ikh MUKH-tuh dee shpeh-tsyah-lee-TAYT des HOW-zes oont dee REKH-noong, BIT-tuh.",
            "Japanese": "Sumimasen, shefu no osusume ryouri to okaikei o onegaishimasu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "క్షమించండి", "transliteration": "Kshaminchandi", "meaning": "Excuse me / Pardon"},
                {"word": "నాకు", "transliteration": "naaku", "meaning": "to me / I want"},
                {"word": "చెఫ్ స్పెషల్ వంటకం", "transliteration": "chef special vantakam", "meaning": "chef's special dish"},
                {"word": "మరియు బిల్లు కావాలి", "transliteration": "mariyu bill kaavali", "meaning": "and bill needed"},
                {"word": "దయచేసి", "transliteration": "dayachesi", "meaning": "please"},
            ],
            "Hindi": [
                {"word": "माफ़ कीजिए", "transliteration": "Maaf kijiye", "meaning": "Excuse me"},
                {"word": "विशेष व्यंजन", "transliteration": "vishesh vyanjan", "meaning": "special dish"},
                {"word": "और बिल", "transliteration": "aur bill", "meaning": "and bill"},
                {"word": "कृपया", "transliteration": "kripya", "meaning": "please"},
            ],
        },
    },
    {
        "level": 4,
        "title": "Level 4: Travel, Directions & City Navigation",
        "objective": "Ask for directions, buy transit tickets, and navigate a new city.",
        "starters": {
            "English": "Could you please tell me how to get to the central train station?",
            "Spanish": "¿Podría decirme cómo llegar a la estación central de trenes, por favor?",
            "Hindi": "क्या आप बता सकते हैं कि सेंट्रल रेलवे स्टेशन कैसे पहुँचना है?",
            "Telugu": "దయచేసి సెంట్రల్ రైల్వే స్టేషన్‌కు ఎలా వెళ్లాలో చెప్పగలరా?",
            "French": "Pourriez-vous me dire comment aller à la gare centrale, s'il vous plaît ?",
            "German": "Könnten Sie mir bitte sagen, wie ich zum Hauptbahnhof komme?",
            "Japanese": "中央駅へはどう行けばいいか教えていただけますか？",
        },
        "transliterations": {
            "English": "Could you please tell me how to get to the central train station?",
            "Spanish": "Poh-DREE-ah deh-SEER-meh KOH-moh yeh-GAHR ah lah ess-tah-SYOHN sen-TRAHL deh TREH-ness, por fah-VOR?",
            "Hindi": "Kya aap bata sakte hain ki central railway station kaise pahunchna hai?",
            "Telugu": "Dayachesi central railway station-ku ela vellaalo cheppagalara?",
            "French": "Poo-ryay voo meh deer koh-mahn ah-lay ah lah gahr sahn-TRAHL, seel voo pleh?",
            "German": "KUN-ten zee meer BIT-tuh ZAH-gen, vee ikh tsoom HOWPT-bahn-hohf KOH-muh?",
            "Japanese": "Chuuou-eki e wa dou ikeba ii ka oshiete itadakemasu ka?",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "దయచేసి", "transliteration": "Dayachesi", "meaning": "Please"},
                {"word": "సెంట్రల్ రైల్వే స్టేషన్‌కు", "transliteration": "central railway station-ku", "meaning": "to central train station"},
                {"word": "ఎలా వెళ్లాలో", "transliteration": "ela vellaalo", "meaning": "how to go"},
                {"word": "చెప్పగలరా?", "transliteration": "cheppagalara?", "meaning": "can you tell?"},
            ],
        },
    },
    {
        "level": 5,
        "title": "Level 5: Shopping, Prices & Sizing",
        "objective": "Inquire about prices, ask for discounts, and select correct sizes.",
        "starters": {
            "English": "How much does this cost and do you have it in a medium size?",
            "Spanish": "¿Cuánto cuesta esto y lo tiene en una talla mediana?",
            "Hindi": "इसकी कीमत क्या है और क्या यह आपके पास मध्यम आकार में है?",
            "Telugu": "దీని ధర ఎంత మరియు ఇది మీడియం సైజులో ఉందా?",
            "French": "Combien cela coûte-t-il et l'avez-vous en taille moyenne ?",
            "German": "Wie viel kostet das und haben Sie es in mittlerer Größe?",
            "Japanese": "これはいくらですか？またMサイズはありますか？",
        },
        "transliterations": {
            "English": "How much does this cost and do you have it in a medium size?",
            "Spanish": "KWAN-toh KWESS-tah ESS-toh ee loh TYEH-neh en OO-nah TAH-yah meh-DYAH-nah?",
            "Hindi": "Iski keemat kya hai aur kya yeh aapke paas madhyam aakar mein hai?",
            "Telugu": "Deeni dhara entha mariyu idi medium size-lo undaa?",
            "French": "Kohm-byan suh-lah KOOT-teel ay lah-vay voo ahn TAH-yuh mwah-YEN?",
            "German": "Vee feel KOHS-tet dahs oont HAH-ben zee ess in MIT-luh-rer GRU-suh?",
            "Japanese": "Kore wa ikura desu ka? Mata emu saizu wa arimasu ka?",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "దీని ధర", "transliteration": "Deeni dhara", "meaning": "Price of this"},
                {"word": "ఎంత", "transliteration": "entha", "meaning": "how much"},
                {"word": "మరియు ఇది", "transliteration": "mariyu idi", "meaning": "and is this"},
                {"word": "మీడియం సైజులో ఉందా?", "transliteration": "medium size-lo undaa?", "meaning": "available in medium size?"},
            ],
        },
    },
    {
        "level": 6,
        "title": "Level 6: Work, Tech & Career Collaboration",
        "objective": "Discuss technical projects, meeting deadlines, and team goals.",
        "starters": {
            "English": "We are developing scalable software to optimize system performance.",
            "Spanish": "Estamos desarrollando software escalable para optimizar el rendimiento del sistema.",
            "Hindi": "हम सिस्टम के प्रदर्शन को बेहतर बनाने के लिए स्केलेबल सॉफ़्टवेयर विकसित कर रहे हैं।",
            "Telugu": "సిస్టమ్ పనితీరును మెరుగుపరచడానికి మేము స్కేలబుల్ సాఫ్ట్‌వేర్‌ను అభివృద్ధి చేస్తున్నాము.",
            "French": "Nous développons des logiciels évolutifs pour optimiser les performances du système.",
            "German": "Wir entwickeln skalierbare Software, um die Systemleistung zu optimieren.",
            "Japanese": "システムのパフォーマンスを最適化するために拡張性の高いソフトウェアを開発しています。",
        },
        "transliterations": {
            "English": "We are developing scalable software to optimize system performance.",
            "Spanish": "Ess-TAH-mohs deh-sah-rroh-YAHN-doh software ess-kah-LAH-bleh PAH-rah op-tee-mee-ZAHR el ren-dee-MYEN-toh del sees-TEH-mah.",
            "Hindi": "Hum system ke pradarshan ko behtar banane ke liye scalable software vikasit kar rahe hain.",
            "Telugu": "System paneeteerunu meruguparachadaaniki memu scalable software-nu abhivriddhi chesthunnaamu.",
            "French": "Noo day-vuh-loh-POHN day loh-zhee-syell ay-voh-lew-TEEF poor op-tee-mee-ZAY lay pehr-for-MAHNSS dew sees-TEM.",
            "German": "Veer ent-VIK-eln skah-LEER-bah-ruh Software, oom dee ZIS-taym-lyce-toong tsoo op-tee-MEE-ren.",
            "Japanese": "Shisutemu no pafoomansu o saitekika suru tame ni kakuchousei no takai sofutouea o kaihatsu shite imasu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "సిస్టమ్ పనితీరును", "transliteration": "System paneeteerunu", "meaning": "System performance"},
                {"word": "మెరుగుపరచడానికి", "transliteration": "meruguparachadaaniki", "meaning": "to optimize / improve"},
                {"word": "మేము", "transliteration": "memu", "meaning": "we"},
                {"word": "సాఫ్ట్‌వేర్‌ను అభివృద్ధి చేస్తున్నాము", "transliteration": "software-nu abhivriddhi chesthunnaamu", "meaning": "are developing software"},
            ],
        },
    },
    {
        "level": 7,
        "title": "Level 7: Past Experiences & Storytelling",
        "objective": "Narrate personal memories and completed actions with accurate past tenses.",
        "starters": {
            "English": "Last summer, I traveled across the country and learned many cultural traditions.",
            "Spanish": "El verano pasado viajé por todo el país y aprendí muchas tradiciones culturales.",
            "Hindi": "पिछली गर्मियों में, मैंने पूरे देश की यात्रा की और कई सांस्कृतिक परंपराएँ सीखीं।",
            "Telugu": "గత వేసవిలో నేను దేశవ్యాప్తంగా ప్రయాణించి అనేక సాంస్కృతిక సంప్రదాయాలను నేర్చుకున్నాను.",
            "French": "L'été dernier, j'ai voyagé à travers le pays et j'ai appris de nombreuses traditions culturelles.",
            "German": "Letzten Sommer bin ich durch das ganze Land gereist und habe viele kulturelle Traditionen gelernt.",
            "Japanese": "去年の夏、国内を旅していろいろな伝統文化を学びました。",
        },
        "transliterations": {
            "English": "Last summer, I traveled across the country and learned many cultural traditions.",
            "Spanish": "El veh-RAH-noh pah-SAH-doh vyah-HEH por TOH-doh el pah-EES ee ah-pren-DEE MOO-chahs trah-dee-SYOH-ness kool-too-RAH-less.",
            "Hindi": "Pichhli garmiyon mein, maine poore desh ki yatra ki aur kai saanskritik paramparayein seekhin.",
            "Telugu": "Gatha vesavilo nenu deshavyaapthangaa prayaaninchi aneka saamskruthika sampradaayaalanu nerchukunaanu.",
            "French": "Lay-TAY dehr-nyay, zhay vwah-yah-ZHAY ah trah-VEHR luh pay-EE ay zhay ah-PREE duh nohm-BRUHS trah-dee-syohn kewl-tew-RELL.",
            "German": "LETS-ten ZOH-mer bin ikh doorch dahs GAHN-tsuh lahnt geh-RYST oont HAH-buh FEE-luh kool-too-REL-luh trah-dee-TSYOH-nen geh-LEHRNT.",
            "Japanese": "Kyonen no natsu, kokunai o tabishite iroiro na dentou bunka o manabimashita.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "గత వేసవిలో", "transliteration": "Gatha vesavilo", "meaning": "Last summer"},
                {"word": "నేను దేశవ్యాప్తంగా", "transliteration": "nenu deshavyaapthangaa", "meaning": "I nationwide"},
                {"word": "ప్రయాణించి", "transliteration": "prayaaninchi", "meaning": "traveled and"},
                {"word": "సంప్రదాయాలను నేర్చుకున్నాను", "transliteration": "sampradaayaalanu nerchukunaanu", "meaning": "learned traditions"},
            ],
        },
    },
    {
        "level": 8,
        "title": "Level 8: Future Ambitions & Hypotheticals",
        "objective": "Form complex conditional clauses and express long-term ambitions.",
        "starters": {
            "English": "If I achieve fluency this year, I will work abroad and explore global opportunities.",
            "Spanish": "Si logro la fluidez este año, trabajaré en el extranjero y exploraré oportunidades globales.",
            "Hindi": "अगर मैं इस साल भाषा में निपुण हो जाता हूँ, तो मैं विदेश में काम करूँगा और नए अवसरों की तलाश करूँगा।",
            "Telugu": "ఈ సంవత్సరం నేను భాషలో ప్రావీణ్యం సాధిస్తే, విదేశాల్లో పని చేసి కొత్త అవకాశాలను అన్వేషిస్తాను.",
            "French": "Si j'atteins la fluidité cette année, je travaillerai à l'étranger et explorerai des opportunités mondiales.",
            "German": "Wenn ich dieses Jahr fließend spreche, werde ich im Ausland arbeiten und globale Chancen nutzen.",
            "Japanese": "今年流暢に話せるようになれば、海外で働いてグローバルな機会を探求したいです。",
        },
        "transliterations": {
            "English": "If I achieve fluency this year, I will work abroad and explore global opportunities.",
            "Spanish": "See LOH-groh lah floo-ee-DEHS ESS-teh AH-nyoh, trah-bah-hah-REH en el ex-trahn-HEH-roh ee ex-ploh-rah-REH oh-por-too-nee-DAH-dess gloh-BAH-less.",
            "Hindi": "Agar main is saal bhasha mein nipun ho jaata hoon, toh main videsh mein kaam karoonga aur naye avsaron ki talaash karoonga.",
            "Telugu": "Ee samvathsaram nenu bhaashalo praaveenyam saadhiste, videshaallo pani chesi kottha avakaashaalanu anveshisthaanu.",
            "French": "See zha-TAHN lah flew-ee-dee-TAY set ah-NAY, zhuh trah-vah-yuh-RAY ah lay-trahn-ZHAY ay ex-ploh-ruh-RAY day zop-por-tew-nee-TAY mohn-DYAH-luh.",
            "German": "Ven ikh DEE-zes yahr FLEE-sent SHPREH-khuh, VEHR-duh ikh im OWS-lahnt AHR-by-ten oont gloh-BAH-luh SHAHN-tsen NOOT-sen.",
            "Japanese": "Kotoshi ryuuchou ni hanaseru you ni nareba, kaigai de hataraite guroobaru na kikai o tankyuu shitai desu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "ఈ సంవత్సరం", "transliteration": "Ee samvathsaram", "meaning": "This year"},
                {"word": "ప్రావీణ్యం సాధిస్తే", "transliteration": "praaveenyam saadhiste", "meaning": "if I achieve fluency"},
                {"word": "విదేశాల్లో పని చేసి", "transliteration": "videshaallo pani chesi", "meaning": "working abroad"},
                {"word": "అవకాశాలను అన్వేషిస్తాను", "transliteration": "avakaashaalanu anveshisthaanu", "meaning": "will explore opportunities"},
            ],
        },
    },
    {
        "level": 9,
        "title": "Level 9: Opinions, Debate & Persuasive Logic",
        "objective": "Articulate nuanced arguments, agree/disagree politely, and justify opinions.",
        "starters": {
            "English": "In my opinion, continuous innovation is essential for sustainable progress.",
            "Spanish": "En mi opinión, la innovación continua es esencial para el progreso sostenible.",
            "Hindi": "मेरी राय में, सतत प्रगति के लिए निरंतर नवाचार आवश्यक है।",
            "Telugu": "నా అభిప్రాయం ప్రకారం, స్థిరమైన ప్రగతి కోసం నిరంతర ఆవిష్కరణ ఎంతో అవసరం.",
            "French": "À mon avis, l'innovation continue est essentielle pour un progrès durable.",
            "German": "Meiner Meinung nach ist kontinuierliche Innovation für nachhaltigen Fortschritt unerlässlich.",
            "Japanese": "私の意見では、持続可能な発展のためには継続的なイノベーションが不可欠です。",
        },
        "transliterations": {
            "English": "In my opinion, continuous innovation is essential for sustainable progress.",
            "Spanish": "En mee oh-pee-NYOHN, lah een-noh-vah-SYOHN kohn-TEEN-wah ess ess-en-SYAHL PAH-rah el proh-GREH-soh sos-teh-NEE-bleh.",
            "Hindi": "Meri raay mein, satat pragati ke liye nirantar navachaar aavashyak hai.",
            "Telugu": "Naa abhipraayam prakaaram, sthiramaina pragathi kosam niranthara aavishkarana entho avasaram.",
            "French": "Ah mohn ah-VEE, leen-noh-vah-SYOHN kohn-tee-NEW ess ess-ahn-SYELL poor un proh-GREH dew-RAH-bluh.",
            "German": "MY-ner MY-noong nahkh ist kohn-tee-noo-EER-li-kheh in-noh-vah-TSYOHN feer NAHKH-hahl-tee-gen FORT-shrit oon-er-LEST-likh.",
            "Japanese": "Watashi no iken dewa, jizoku kanou na hatten no tame ni wa keizokuteki na inobeeshon ga fukaketsu desu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "నా అభిప్రాయం ప్రకారం", "transliteration": "Naa abhipraayam prakaaram", "meaning": "In my opinion"},
                {"word": "స్థిరమైన ప్రగతి కోసం", "transliteration": "sthiramaina pragathi kosam", "meaning": "for sustainable progress"},
                {"word": "నిరంతర ఆవిష్కరణ", "transliteration": "niranthara aavishkarana", "meaning": "continuous innovation"},
                {"word": "ఎంతో అవసరం", "transliteration": "entho avasaram", "meaning": "is essential"},
            ],
        },
    },
    {
        "level": 10,
        "title": "Level 10: Native Idioms, Humor & Nuanced Fluency",
        "objective": "Speak like a native with idiomatic expressions, metaphors, and cultural cadence.",
        "starters": {
            "English": "Every cloud has a silver lining, and perseverance always bears fruitful rewards.",
            "Spanish": "No hay mal que por bien no venga, y la perseverancia siempre da frutos.",
            "Hindi": "हर अंधेरी रात के बाद एक नया सवेरा होता है, और मेहनत का फल हमेशा मीठा होता है।",
            "Telugu": "ప్రతి కష్టంలోనూ ఒక మంచి అవకాశం ఉంటుంది, మరియు నిరంతర శ్రమ ఎల్లప్పుడూ మంచి ఫలితాన్ని ఇస్తుంది.",
            "French": "Après la pluie vient le beau temps, et la persévérance porte toujours ses fruits.",
            "German": "Auf Regen folgt Sonnenschein, und Ausdauer zahlt sich immer aus.",
            "Japanese": "雨降って地固まる、努力は必ず実を結びます。",
        },
        "transliterations": {
            "English": "Every cloud has a silver lining, and perseverance always bears fruitful rewards.",
            "Spanish": "Noh eye mahl kay por byehn noh VEHN-gah, ee lah per-seh-veh-RAHN-syah SYEHM-preh dah FROO-tohs.",
            "Hindi": "Har andheri raat ke baad ek naya savera hota hai, aur mehnat ka phal hamesha meetha hota hai.",
            "Telugu": "Prathi kashtamlonoo oka manchi avakaasham untundi, mariyu niranthara shrama ellappudoo manchi phalithaanni isthundi.",
            "French": "Ah-PREH lah plwee vyan luh boh tahn, ay lah pehr-say-vay-RAHNSS pohrt too-ZHOOR say frwee.",
            "German": "Owf RAY-gen fohlgt ZON-nen-shyne, oont OWS-dow-er tsahlt zikh IM-mer ows.",
            "Japanese": "Ame futte ji katamaru, doryoku wa kanarazu mi o musubimasu.",
        },
        "word_breakdowns": {
            "Telugu": [
                {"word": "ప్రతి కష్టంలోనూ", "transliteration": "Prathi kashtamlonoo", "meaning": "In every hardship / difficulty"},
                {"word": "ఒక మంచి అవకాశం ఉంటుంది", "transliteration": "oka manchi avakaasham untundi", "meaning": "there is a good opportunity"},
                {"word": "నిరంతర శ్రమ", "transliteration": "niranthara shrama", "meaning": "continuous hard work"},
                {"word": "మంచి ఫలితాన్ని ఇస్తుంది", "transliteration": "manchi phalithaanni isthundi", "meaning": "gives fruitful rewards"},
            ],
        },
    },
]


class WordBreakdown(BaseModel):
    word: str
    transliteration: str
    meaning: str


class TranslateRequest(BaseModel):
    from_language: str
    to_language: str
    text: str
    level: int = 1


class TranslateResponse(BaseModel):
    source_text: str
    translated_text: str
    from_language: str
    to_language: str
    transliteration_english: str
    phonetic_guide: str
    word_breakdowns: List[WordBreakdown] = []
    grammar_breakdown: str
    level: int
    challenge_title: str


class SpeechEvalRequest(BaseModel):
    user_id: int = 1
    from_language: str
    to_language: str
    source_text: str
    target_text: str
    spoken_text: str
    level: int = 1
    pronunciation_score: Optional[int] = 85


class WordDiff(BaseModel):
    word: str
    status: str  # "correct", "mispronounced", "missing"


class SpeechEvalResponse(BaseModel):
    pronunciation_score: int
    accuracy_score: int
    overall_score: int
    passed: bool
    word_diff: List[WordDiff]
    feedback_message: str
    next_level: int
    unlocked_badge: Optional[str] = None
    level_title: str


@router.get("/levels")
def get_all_practice_levels():
    """
    GET /api/practice/levels
    Returns definitions, starters, and English transliterations for all 10 progressive practice levels.
    """
    return {
        "total_levels": 10,
        "pass_threshold_score": 75,
        "levels": LEVELS_DATA,
    }


@router.post("/translate", response_model=TranslateResponse)
def translate_for_practice(req: TranslateRequest):
    """
    POST /api/practice/translate
    Translates input text with English Romanized transliteration (How to Speak) and word breakdowns.
    """
    text_clean = req.text.strip()
    from_lang = req.from_language.strip()
    to_lang = req.to_language.strip()
    level = max(1, min(10, req.level))

    level_meta = next((l for l in LEVELS_DATA if l["level"] == level), LEVELS_DATA[0])

    # Check if this matches standard level starter
    level_starter_target = level_meta["starters"].get(to_lang)
    level_translit_target = level_meta.get("transliterations", {}).get(to_lang)
    level_words_target = level_meta.get("word_breakdowns", {}).get(to_lang, [])

    # If text is similar to the level challenge preset
    if level_starter_target and (
        text_clean.lower() in [s.lower() for s in level_meta["starters"].values()]
        or len(text_clean.split()) <= 3
    ):
        return TranslateResponse(
            source_text=text_clean,
            translated_text=level_starter_target,
            from_language=from_lang,
            to_language=to_lang,
            transliteration_english=level_translit_target or "Speak with clear native rhythm.",
            phonetic_guide=level_translit_target or "Clear syllable stress",
            word_breakdowns=[
                WordBreakdown(
                    word=wb["word"],
                    transliteration=wb["transliteration"],
                    meaning=wb["meaning"],
                )
                for wb in level_words_target
            ],
            grammar_breakdown=f"Level {level} phrasing in {to_lang}: Study the English transliteration above to pronounce each word accurately.",
            level=level,
            challenge_title=level_meta["title"],
        )

    # Try live LLM Translation with Groq Llama 3.3 for custom sentences
    prompt = f"""You are a master language instructor and translator.
Translate the following sentence from {from_lang} to {to_lang}.
Crucial: Many learners cannot read foreign scripts (like Telugu script, Devanagari Hindi, or Japanese Kanji).
You MUST provide:
1. 'translated_text': Natural translation in {to_lang} in native script.
2. 'transliteration_english': The EXACT translated sentence written entirely in ENGLISH LATIN LETTERS (Romanized English script) so an English speaker can read and pronounce it out loud easily! (e.g. for Telugu: "Prathi roju udayam enimidi gantalaku nenu coffee taagi tintaanu", for Hindi: "Mera naam Alex hai", for Japanese: "Watashi no namae wa Alex desu").
3. 'word_breakdowns': Array of objects with 'word' (target script), 'transliteration' (in English letters), and 'meaning' (in {from_lang}).
4. 'grammar_breakdown': 1-2 sentence explanation of the rule.

Source sentence in {from_lang}: "{text_clean}"

Return ONLY a valid JSON object matching:
{{
  "translated_text": "...",
  "transliteration_english": "...",
  "word_breakdowns": [
    {{"word": "...", "transliteration": "...", "meaning": "..."}}
  ],
  "grammar_breakdown": "..."
}}
"""
    data = _call_groq_json(prompt, max_tokens=1000)

    if data and "translated_text" in data:
        w_list = []
        for wb in data.get("word_breakdowns", []):
            if isinstance(wb, dict) and "word" in wb:
                w_list.append(
                    WordBreakdown(
                        word=wb.get("word", ""),
                        transliteration=wb.get("transliteration", ""),
                        meaning=wb.get("meaning", ""),
                    )
                )

        return TranslateResponse(
            source_text=text_clean,
            translated_text=data.get("translated_text", text_clean),
            from_language=from_lang,
            to_language=to_lang,
            transliteration_english=data.get("transliteration_english", data.get("translated_text", "")),
            phonetic_guide=data.get("transliteration_english", "Speak clearly with proper intonation"),
            word_breakdowns=w_list,
            grammar_breakdown=data.get("grammar_breakdown", f"Accurate phrasing in {to_lang} for Level {level}."),
            level=level,
            challenge_title=level_meta["title"],
        )

    # Fallback to level presets
    return TranslateResponse(
        source_text=text_clean,
        translated_text=level_starter_target or f"[{to_lang}] {text_clean}",
        from_language=from_lang,
        to_language=to_lang,
        transliteration_english=level_translit_target or "Read the English phonetics out loud clearly.",
        phonetic_guide=level_translit_target or "Clear syllable stress",
        word_breakdowns=[
            WordBreakdown(
                word=wb["word"],
                transliteration=wb["transliteration"],
                meaning=wb["meaning"],
            )
            for wb in level_words_target
        ],
        grammar_breakdown=f"Level {level} phrasing in {to_lang}: Practice reading the Romanized English transliteration above.",
        level=level,
        challenge_title=level_meta["title"],
    )


@router.post("/evaluate-speech", response_model=SpeechEvalResponse)
def evaluate_spoken_translation(req: SpeechEvalRequest, db: Session = Depends(get_db)):
    """
    POST /api/practice/evaluate-speech
    Evaluates pronunciation, accuracy, calculates level progression, and logs progress to SQLite.
    """
    target = req.target_text.strip().lower()
    spoken = req.spoken_text.strip().lower()
    level = max(1, min(10, req.level))
    level_meta = next((l for l in LEVELS_DATA if l["level"] == level), LEVELS_DATA[0])

    target_words = re.findall(r"\w+", target, re.UNICODE)
    spoken_words = re.findall(r"\w+", spoken, re.UNICODE)

    if not target_words:
        target_words = ["practice"]
    if not spoken_words:
        spoken_words = []

    matcher = difflib.SequenceMatcher(None, target_words, spoken_words)
    similarity = matcher.ratio()

    word_diff = []
    matched_set = set(spoken_words)
    for w in target_words:
        if w in matched_set:
            word_diff.append(WordDiff(word=w, status="correct"))
        else:
            close = difflib.get_close_matches(w, spoken_words, n=1, cutoff=0.6)
            if close:
                word_diff.append(WordDiff(word=w, status="mispronounced"))
            else:
                word_diff.append(WordDiff(word=w, status="missing"))

    accuracy_score = int(round(similarity * 100))
    if spoken_words:
        accuracy_score = max(40, min(100, accuracy_score))
    else:
        accuracy_score = 0

    pron_score = req.pronunciation_score or 80
    if not spoken_words:
        pron_score = 0

    overall_score = int(round((accuracy_score * 0.6) + (pron_score * 0.4)))
    passed = overall_score >= 70

    next_level = min(10, level + 1) if passed else level

    badges = {
        1: "🌱 Level 1: Polite Explorer",
        2: "⏰ Level 2: Routine Master",
        3: "🍽️ Level 3: Gourmet Connoisseur",
        4: "🗺️ Level 4: Urban Navigator",
        5: "🛍️ Level 5: Market Negotiator",
        6: "💼 Level 6: Tech & Career Specialist",
        7: "📖 Level 7: Master Storyteller",
        8: "🚀 Level 8: Future Visionary",
        9: "🧠 Level 9: Fluent Debater",
        10: "👑 Level 10: Polyglot Champion",
    }
    unlocked_badge = badges.get(level) if passed else None

    if passed:
        feedback_message = f"🎉 Outstanding pronunciation in {req.to_language}! You scored {overall_score}% and mastered {level_meta['title']}."
    else:
        feedback_message = f"Good effort ({overall_score}%)! Read the English transliteration aloud and speak clearly to reach 75%."

    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if user:
            progress = db.query(Progress).filter(Progress.user_id == user.id).first()
            if progress:
                progress.conversation_score = float(overall_score)
                progress.pronunciation_score = float(pron_score)
                db.commit()

        if not passed:
            mistake = Mistake(
                user_id=req.user_id,
                original_text=req.spoken_text or "(unclear speech)",
                correct_text=req.target_text,
                category=f"Level {level} Pronunciation",
                explanation=f"Expected: '{req.target_text}'. Read the Romanized English pronunciation guide aloud.",
            )
            db.add(mistake)
            db.commit()
    except Exception as db_err:
        logger.warning(f"Error updating SQLite practice progress: {db_err}")

    return SpeechEvalResponse(
        pronunciation_score=pron_score,
        accuracy_score=accuracy_score,
        overall_score=overall_score,
        passed=passed,
        word_diff=word_diff,
        feedback_message=feedback_message,
        next_level=next_level,
        unlocked_badge=unlocked_badge,
        level_title=level_meta["title"],
    )
