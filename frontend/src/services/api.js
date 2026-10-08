import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

// Auth
export const registerUser = async ({ name, email, password, targetLanguage, level, goal }) => {
  const res = await api.post('/auth/register', {
    name,
    email,
    password,
    target_language: targetLanguage,
    level,
    goal,
  });
  return res.data;
};

export const loginUser = async ({ email, password }) => {
  const res = await api.post('/auth/login', {
    email,
    password,
  });
  return res.data;
};

export const getCurrentUser = async (userId) => {
  const res = await api.get(`/auth/me/${userId}`);
  return res.data;
};

export const setGroqKey = async (apiKey) => {
  const res = await api.post('/config/groq-key', { api_key: apiKey });
  return res.data;
};

export const getConfigOptions = async () => {
  const res = await api.get('/config/options');
  return res.data;
};

// 10-Level Translation & Speech Practice
export const getPracticeLevels = async () => {
  const res = await api.get('/practice/levels');
  return res.data;
};

export const translateForPractice = async ({ fromLanguage, toLanguage, text, level = 1 }) => {
  const res = await api.post('/practice/translate', {
    from_language: fromLanguage,
    to_language: toLanguage,
    text,
    level,
  });
  return res.data;
};

export const evaluateSpokenTranslation = async ({
  userId = 1,
  fromLanguage,
  toLanguage,
  sourceText,
  targetText,
  spokenText,
  level = 1,
  pronunciationScore = 85,
}) => {
  const res = await api.post('/practice/evaluate-speech', {
    user_id: userId,
    from_language: fromLanguage,
    to_language: toLanguage,
    source_text: sourceText,
    target_text: targetText,
    spoken_text: spokenText,
    level,
    pronunciation_score: pronunciationScore,
  });
  return res.data;
};

// Assessment
export const startAssessment = async ({ name, language, level, goal, userId }) => {
  const res = await api.post('/assessment/start', {
    name,
    language,
    level,
    goal,
    user_id: userId,
  });
  return res.data;
};

export const evaluateAssessment = async ({ assessmentId, userId, language, level, goal, answers }) => {
  const res = await api.post('/assessment/evaluate', {
    assessment_id: assessmentId,
    user_id: userId,
    language,
    level,
    goal,
    answers,
  });
  return res.data;
};

// Lessons
export const startLesson = async ({ userId, language, level, goal, weakAreas, previousMistakes }) => {
  const res = await api.post('/lesson/start', {
    user_id: userId,
    language,
    level,
    goal,
    weak_areas: weakAreas,
    previous_mistakes: previousMistakes,
  });
  return res.data;
};

export const evaluateLessonStep = async ({
  userId,
  sessionId,
  language,
  level,
  goal,
  question,
  response,
  responseMode = 'voice',
  detectedLanguage,
  topic,
  previousMistakes = [],
  exerciseNumber = 1,
}) => {
  const res = await api.post('/lesson/evaluate', {
    user_id: userId,
    session_id: sessionId,
    language,
    level,
    goal,
    question,
    response,
    response_mode: responseMode,
    detected_language: detectedLanguage,
    topic,
    previous_mistakes: previousMistakes,
    exercise_number: exerciseNumber,
  });
  return res.data;
};

export const conductFinalAssessment = async ({
  userId,
  sessionId,
  language,
  level,
  goal,
  initialScores,
  practiceHistory = [],
}) => {
  const res = await api.post('/lesson/final-assessment', {
    user_id: userId,
    session_id: sessionId,
    language,
    level,
    goal,
    initial_scores: initialScores,
    practice_history: practiceHistory,
  });
  return res.data;
};

// Voice
export const transcribeVoice = async (audioBlob, targetLanguage) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('target_language', targetLanguage);

  const res = await axios.post(`${API_BASE}/voice/transcribe`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// User & Progress
export const getUserProgress = async (userId) => {
  const res = await api.get(`/progress/${userId}`);
  return res.data;
};

// Tutor Chat
export const sendTutorChatMessage = async ({ language, level, goal, message, history = [] }) => {
  const res = await api.post('/chat/message', {
    language,
    level,
    goal,
    message,
    history,
  });
  return res.data;
};

// Mock Interview
export const startMockInterview = async ({ language, level, role }) => {
  const res = await api.post('/interview/start', {
    language,
    level,
    role,
  });
  return res.data;
};

export const submitInterviewAnswer = async ({ language, level, role, question, answer, questionNumber }) => {
  const res = await api.post('/interview/answer', {
    language,
    level,
    role,
    question,
    answer,
    question_number: questionNumber,
  });
  return res.data;
};

// Learning Plan
export const getPersonalizedLearningPlan = async (userId) => {
  const res = await api.get(`/plan/${userId}`);
  return res.data;
};

// Vocab
export const getVocabCards = async (language) => {
  const res = await api.get(`/vocab/${language}`);
  return res.data;
};

// Mistakes
export const getMistakeRevisionQuiz = async (userId) => {
  const res = await api.get(`/mistakes/quiz/${userId}`);
  return res.data;
};

export const submitMistakeRetry = async ({ mistakeId, userAttempt }) => {
  const res = await api.post('/mistakes/retry', {
    mistake_id: mistakeId,
    user_attempt: userAttempt,
  });
  return res.data;
};

// Admin
export const getAdminMetrics = async () => {
  const res = await api.get('/admin/metrics');
  return res.data;
};
