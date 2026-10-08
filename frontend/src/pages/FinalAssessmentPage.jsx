import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, TrendingUp, Sparkles, BookOpen, Compass, ArrowRight, RotateCcw, BarChart3, CheckCircle2 } from 'lucide-react';
import { ScoreCard } from '../components/ScoreCard';

export const FinalAssessmentPage = ({
  session,
  finalResult,
  onNavigateToDashboard,
  onStartNewSession,
}) => {
  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  if (!finalResult) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Hero Trophy Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 shadow-2xl shadow-orange-500/30 mb-2 animate-bounce">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>LESSON COMPLETE 🎉</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Session Evaluation & Growth Report
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Congratulations on finishing your practice session in <strong>{session?.language}</strong>! Here is your measured progress and personalized next steps.
        </p>
      </div>

      {/* Final vs Initial ScoreCard */}
      <ScoreCard
        grammar={finalResult.final_grammar_score}
        vocabulary={finalResult.final_vocabulary_score}
        conversation={finalResult.final_conversation_score}
        overall={finalResult.final_overall_score}
        initialScore={finalResult.initial_overall_score}
        improvement={finalResult.improvement_delta}
        title="Final Proficiency Scores"
      />

      {/* Recommendation Summary */}
      {finalResult.recommendation_summary && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-700/50 rounded-2xl p-6 shadow-xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Tutor Summary & Feedback</span>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
            {finalResult.recommendation_summary}
          </p>
        </div>
      )}

      {/* Strengths Developed & Persistent Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Strengths Developed</h3>
          </div>
          <div className="space-y-2">
            {finalResult.strengths_developed?.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs font-medium text-emerald-200"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Persistent Weaknesses */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Continuing Focus Areas</h3>
          </div>
          <div className="space-y-2">
            {finalResult.persistent_weaknesses?.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs font-medium text-amber-200"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Next Topic Card (Section 27) */}
      <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recommended Next Topic</span>
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
            Difficulty: {finalResult.recommended_difficulty || 'Intermediate'}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-white">
            {finalResult.recommended_next_topic}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            <strong className="text-indigo-300">Reason: </strong>
            {finalResult.recommended_topic_reason}
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onStartNewSession}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Session</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          <span>View Progress Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
