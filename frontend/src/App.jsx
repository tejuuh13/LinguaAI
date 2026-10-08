import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { AssessmentResultPage } from './pages/AssessmentResultPage';
import { PracticePage } from './pages/PracticePage';
import { FinalAssessmentPage } from './pages/FinalAssessmentPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { VocabGrammarPage } from './pages/VocabGrammarPage';
import { MistakeRevisionPage } from './pages/MistakeRevisionPage';
import { LearningPlanPage } from './pages/LearningPlanPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

import {
  startAssessment,
  evaluateAssessment,
  startLesson,
  evaluateLessonStep,
  conductFinalAssessment,
  getHealth,
} from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('lingua_ai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentStep, setCurrentStep] = useState('practice'); // setup, assessment, assessment_result, practice, final_assessment, dashboard, chat, interview, vocab, revision, plan, admin
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Active Session State
  const [session, setSession] = useState({
    name: 'Learner',
    language: 'Spanish',
    level: 'Intermediate',
    goal: 'Daily Conversation',
    userId: 1,
    assessmentId: null,
    sessionId: null,
  });

  // Assessment State
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentEvaluation, setAssessmentEvaluation] = useState(null);

  // Practice State
  const [currentExercise, setCurrentExercise] = useState(null);
  const [focusArea, setFocusArea] = useState('Past Tense Verbs');
  const [lastLessonEvaluation, setLastLessonEvaluation] = useState(null);
  const [practiceRound, setPracticeRound] = useState(1);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [accumulatedMistakes, setAccumulatedMistakes] = useState([]);

  // Final Assessment State
  const [finalAssessmentResult, setFinalAssessmentResult] = useState(null);

  useEffect(() => {
    getHealth()
      .then((h) => setSystemHealth(h))
      .catch((e) => console.warn('Backend health check error:', e));

    if (currentUser) {
      setSession((prev) => ({
        ...prev,
        name: currentUser.name || 'Learner',
        language: currentUser.target_language || 'Spanish',
        level: currentUser.level || 'Intermediate',
        goal: currentUser.goal || 'Daily Conversation',
        userId: currentUser.id || 1,
      }));
    }
  }, [currentUser]);

  const handleAuthSuccess = (user) => {
    localStorage.setItem('lingua_ai_user', JSON.stringify(user));
    setCurrentUser(user);
    setSession({
      name: user.name,
      language: user.target_language,
      level: user.level,
      goal: user.goal,
      userId: user.id,
      assessmentId: null,
      sessionId: null,
    });
    setCurrentStep('practice');
  };

  const handleLogout = () => {
    localStorage.removeItem('lingua_ai_user');
    setCurrentUser(null);
    handleResetSession();
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('lingua_ai_onboarded', 'true');
  };

  // 1. Start Assessment
  const handleStartAssessment = async ({ name, language, level, goal }) => {
    setLoading(true);
    try {
      const data = await startAssessment({
        name,
        language,
        level,
        goal,
        userId: session.userId,
      });

      setSession((prev) => ({
        ...prev,
        name,
        language,
        level,
        goal,
        userId: data.user_id,
        assessmentId: data.assessment_id,
      }));

      setAssessmentQuestions(data.questions || []);
      setCurrentStep('assessment');
    } catch (err) {
      console.error('Error starting assessment:', err);
      alert('Failed to initialize AI Assessment. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Assessment
  const handleSubmitAssessment = async (answers) => {
    setLoading(true);
    try {
      const evaluation = await evaluateAssessment({
        assessmentId: session.assessmentId || 'asm_1',
        userId: session.userId,
        language: session.language,
        level: session.level,
        goal: session.goal,
        answers,
      });

      setAssessmentEvaluation(evaluation);
      setCurrentStep('assessment_result');
    } catch (err) {
      console.error('Error evaluating assessment:', err);
      alert('Failed to evaluate assessment.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Start Personalized Practice
  const handleStartPractice = async () => {
    setLoading(true);
    try {
      const weakAreas = assessmentEvaluation?.weak_areas || ['Past tense verbs'];
      const data = await startLesson({
        userId: session.userId,
        language: session.language,
        level: session.level,
        goal: session.goal,
        weakAreas,
        previousMistakes: accumulatedMistakes,
      });

      setSession((prev) => ({ ...prev, sessionId: data.session_id }));
      setCurrentExercise(data.exercise);
      setFocusArea(data.focus_area);
      setLastLessonEvaluation(null);
      setPracticeRound(1);
      setPracticeHistory([]);
      setCurrentStep('practice');
    } catch (err) {
      console.error('Error starting lesson:', err);
      setCurrentStep('practice');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Practice Step Answer
  const handleSubmitPracticeAnswer = async ({
    question,
    response,
    responseMode,
    detectedLanguage,
    topic,
  }) => {
    setLoading(true);
    try {
      const evaluation = await evaluateLessonStep({
        userId: session.userId,
        sessionId: session.sessionId || 'sess_default',
        language: session.language,
        level: session.level,
        goal: session.goal,
        question,
        response,
        responseMode,
        detectedLanguage,
        topic,
        previousMistakes: accumulatedMistakes,
        exerciseNumber: practiceRound,
      });

      setLastLessonEvaluation(evaluation);

      if (evaluation.mistakes && evaluation.mistakes.length > 0) {
        setAccumulatedMistakes((prev) => [
          ...prev,
          ...evaluation.mistakes.map((m) => `${m.original} -> ${m.correct}`),
        ]);
      }

      setPracticeHistory((prev) => [
        ...prev,
        {
          round: practiceRound,
          question,
          response,
          scores: {
            grammar: evaluation.grammar_score,
            vocabulary: evaluation.vocabulary_score,
            conversation: evaluation.conversation_score,
            overall: evaluation.overall_score,
          },
          correction: evaluation.correction,
        },
      ]);
    } catch (err) {
      console.error('Error evaluating practice step:', err);
      alert('Failed to evaluate response.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Next Adaptive Exercise
  const handleProceedToNextExercise = () => {
    if (!lastLessonEvaluation) return;

    const nextEx = {
      id: practiceRound + 1,
      category: lastLessonEvaluation.next_question_category || 'grammar',
      topic: lastLessonEvaluation.recommended_focus || focusArea,
      question: lastLessonEvaluation.next_question,
      prompt_instruction: `Respond in complete sentences in ${session.language}.`,
      context: `Targeted adaptive drill on: ${lastLessonEvaluation.recommended_focus || focusArea}`,
      suggested_starter: '',
    };

    setCurrentExercise(nextEx);
    setFocusArea(lastLessonEvaluation.recommended_focus || focusArea);
    setLastLessonEvaluation(null);
    setPracticeRound((prev) => prev + 1);
  };

  // 6. Finish Practice & Conduct Final Assessment
  const handleFinishPractice = async () => {
    setLoading(true);
    try {
      const initialScores = {
        grammar_score: assessmentEvaluation?.grammar_score || 65,
        vocabulary_score: assessmentEvaluation?.vocabulary_score || 70,
        conversation_score: assessmentEvaluation?.conversation_score || 68,
        overall_score: assessmentEvaluation?.overall_score || 68,
      };

      const result = await conductFinalAssessment({
        userId: session.userId,
        sessionId: session.sessionId || 'sess_default',
        language: session.language,
        level: session.level,
        goal: session.goal,
        initialScores,
        practiceHistory,
      });

      setFinalAssessmentResult(result);
      setCurrentStep('final_assessment');
    } catch (err) {
      console.error('Error conducting final assessment:', err);
      alert('Failed to calculate final assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setCurrentStep('setup');
    setAssessmentQuestions([]);
    setAssessmentEvaluation(null);
    setLastLessonEvaluation(null);
    setPracticeRound(1);
    setPracticeHistory([]);
    setAccumulatedMistakes([]);
    setFinalAssessmentResult(null);
  };

  // If user is not authenticated, show Auth Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onStart={() => setCurrentStep('setup')}
      />

      {/* Top Navbar */}
      <Navbar
        session={session}
        currentStep={currentStep}
        onNavigate={(step) => setCurrentStep(step)}
        onReset={handleResetSession}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {currentStep === 'setup' && (
          <SetupPage
            onStartAssessment={handleStartAssessment}
            isLoading={loading}
          />
        )}

        {currentStep === 'assessment' && (
          <AssessmentPage
            session={session}
            questions={assessmentQuestions}
            onSubmitAssessment={handleSubmitAssessment}
            isEvaluating={loading}
            onBack={() => setCurrentStep('setup')}
          />
        )}

        {currentStep === 'assessment_result' && (
          <AssessmentResultPage
            session={session}
            evaluation={assessmentEvaluation}
            onStartPractice={handleStartPractice}
            isLoadingPractice={loading}
          />
        )}

        {currentStep === 'practice' && (
          <PracticePage session={session} />
        )}

        {currentStep === 'final_assessment' && (
          <FinalAssessmentPage
            session={session}
            finalResult={finalAssessmentResult}
            onNavigateToDashboard={() => setCurrentStep('dashboard')}
            onStartNewSession={handleResetSession}
          />
        )}

        {currentStep === 'dashboard' && (
          <DashboardPage
            userId={session.userId || 1}
            onStartPractice={handleStartPractice}
            onStartNewSession={handleResetSession}
          />
        )}

        {currentStep === 'chat' && (
          <ChatPage session={session} />
        )}

        {currentStep === 'interview' && (
          <MockInterviewPage session={session} />
        )}

        {currentStep === 'vocab' && (
          <VocabGrammarPage session={session} />
        )}

        {currentStep === 'revision' && (
          <MistakeRevisionPage
            userId={session.userId || 1}
            session={session}
          />
        )}

        {currentStep === 'plan' && (
          <LearningPlanPage
            userId={session.userId || 1}
            onStartPractice={handleStartPractice}
          />
        )}

        {currentStep === 'admin' && (
          <AdminDashboardPage />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LinguaAI — Adaptive Multilingual Learning Tutor & Career Simulator</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Groq Llama 3.3 70B</span>
            <span>•</span>
            <span>Local Whisper STT</span>
            <span>•</span>
            <span>SQLite Auth</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
