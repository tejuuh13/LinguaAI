import React, { useState } from 'react';
import { Briefcase, Award, Sparkles, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Loader2, UserCheck, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { api } from '../services/api';

const ROLES = [
  { id: 'Software Engineer', title: 'Software Engineer / Tech', desc: 'System design, coding architectures, cloud scalability, and technical leadership' },
  { id: 'Product Manager', title: 'Product Manager', desc: 'Product roadmaps, user prioritization, and stakeholder collaboration' },
  { id: 'HR & People Operations', title: 'HR & Behavioral Interview', desc: 'Conflict resolution, leadership style, team dynamics, and cultural fit' },
  { id: 'Marketing & Sales', title: 'Marketing & Sales Executive', desc: 'Client negotiations, pitch presentations, and market growth' },
  { id: 'Hospitality & Tourism', title: 'Hospitality & Service', desc: 'Guest satisfaction, multilingual communication, and crisis handling' },
];

const INTERVIEW_TYPES = ['Technical Interview', 'HR Behavioral Interview', 'General Job Interview'];

export const MockInterviewPage = ({ session }) => {
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [selectedType, setSelectedType] = useState('Technical Interview');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const handleStart = async () => {
    setLoading(true);
    setFinalReport(null);
    try {
      const res = await api.post('/interview/start', {
        user_id: session?.userId || 1,
        language: session?.language || 'English',
        level: session?.level || 'Intermediate',
        role: selectedRole,
        interview_type: selectedType,
      });
      setCurrentQuestion(res.data);
      setInterviewStarted(true);
      setQuestionCount(1);
      setFeedback(null);
    } catch (err) {
      console.error('Error starting interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceAnswer = async ({ response }) => {
    setLoading(true);
    try {
      const res = await api.post('/interview/answer', {
        session_id: currentQuestion?.session_id,
        language: session?.language || 'English',
        level: session?.level || 'Intermediate',
        role: selectedRole,
        interview_type: selectedType,
        question: currentQuestion?.question,
        answer: response,
        question_number: questionCount,
      });
      setFeedback(res.data);
    } catch (err) {
      console.error('Error evaluating interview answer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!feedback) return;

    if (feedback.is_last_question || questionCount >= 3) {
      handleCompleteInterview();
      return;
    }

    setCurrentQuestion({
      session_id: feedback.session_id,
      id: questionCount + 1,
      role: selectedRole,
      interview_type: selectedType,
      question: feedback.next_question,
      interviewer_persona: 'Hiring Manager',
      tips: 'Use clear metrics and structure your response with confidence.',
    });
    setFeedback(null);
    setQuestionCount((prev) => prev + 1);
  };

  const handleCompleteInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/interview/complete', null, {
        params: {
          session_id: currentQuestion?.session_id || 'intv_default',
          role: selectedRole,
          language: session?.language || 'English',
          interview_type: selectedType,
        },
      });
      setFinalReport(res.data);
    } catch (err) {
      console.error('Error completing interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setInterviewStarted(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setFinalReport(null);
    setQuestionCount(1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
          <span>Professional Career Simulator</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          AI Mock Interview & Career Simulator
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Simulate high-stakes job interviews in <strong>{session?.language}</strong> with real-time scoring on Communication, Grammar, Vocabulary, and Relevance.
        </p>
      </div>

      {finalReport ? (
        /* Final Interview Performance Report */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Official Interview Performance Report
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {finalReport.role} — {finalReport.interview_type}
              </h2>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-200 font-extrabold text-base">
              Overall Score: {finalReport.overall_score}%
            </div>
          </div>

          {/* 4 Core Competency Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Communication</span>
              <span className="text-xl font-black text-indigo-300">{finalReport.communication_score}%</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Grammar</span>
              <span className="text-xl font-black text-purple-300">{finalReport.grammar_score}%</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Vocabulary</span>
              <span className="text-xl font-black text-pink-300">{finalReport.vocabulary_score}%</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Relevance</span>
              <span className="text-xl font-black text-emerald-300">{finalReport.relevance_score}%</span>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Demonstrated Strengths</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {finalReport.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Areas for Improvement</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {finalReport.improvements?.map((imp, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Specific Recommendations */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase text-indigo-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Tailored Next Steps & Recommendations</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {finalReport.ai_recommendations?.map((rec, i) => (
                <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                  {rec}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-xl shadow-indigo-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start New Interview Session</span>
            </button>
          </div>
        </div>
      ) : !interviewStarted ? (
        /* Role Selection Setup */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Interview Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
              Interview Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    selectedType === t
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
              Select Career Role:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedRole === r.id
                      ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100 mb-1">{r.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Interview Room...</span>
                </>
              ) : (
                <>
                  <span>Begin {selectedType} in {session?.language}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Question & Feedback */
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">
                  Question {questionCount} of 3 • {selectedRole} ({selectedType})
                </span>
                <p className="text-xs text-slate-400">
                  Interviewer: <strong className="text-slate-200">{currentQuestion?.interviewer_persona}</strong>
                </p>
              </div>

              <AudioPlayer
                text={currentQuestion?.question}
                language={session?.language || 'English'}
                label="Listen to Interviewer"
                size="md"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                "{currentQuestion?.question}"
              </h2>
              {currentQuestion?.tips && (
                <p className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                  💡 <strong>Interview Strategy Tip: </strong> {currentQuestion.tips}
                </p>
              )}
            </div>

            {/* Answer Input */}
            <div className="pt-2">
              <VoiceRecorder
                targetLanguage={session?.language || 'English'}
                onSubmitAnswer={handleVoiceAnswer}
                isEvaluating={loading}
                suggestedStarter=""
              />
            </div>
          </div>

          {/* Interviewer Evaluation & Score */}
          {feedback && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Answer Assessment</h3>
                </div>
                <div className="px-3.5 py-1 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold text-xs">
                  Overall: {feedback.overall_score}%
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase text-slate-400 block">Communication</span>
                  <span className="text-base font-extrabold text-indigo-300">{feedback.communication_score}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase text-slate-400 block">Grammar</span>
                  <span className="text-base font-extrabold text-purple-300">{feedback.grammar_score}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase text-slate-400 block">Vocabulary</span>
                  <span className="text-base font-extrabold text-pink-300">{feedback.vocabulary_score}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase text-slate-400 block">Relevance</span>
                  <span className="text-base font-extrabold text-emerald-300">{feedback.relevance_score}%</span>
                </div>
              </div>

              {/* Feedback Comments */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Hiring Manager Notes:
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {feedback.interviewer_comment}
                </p>
              </div>

              {/* Model Answer */}
              {feedback.model_answer && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Model High-Scoring Response:
                    </span>
                    <AudioPlayer
                      text={feedback.model_answer}
                      language={session?.language || 'English'}
                      label="Listen"
                      size="sm"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-200 italic">
                    "{feedback.model_answer}"
                  </p>
                </div>
              )}

              {/* Next Question CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                >
                  <span>{questionCount >= 3 ? 'Generate Final Report' : 'Next Interview Question'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
