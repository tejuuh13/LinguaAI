import React from 'react';
import { Target, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Zap, Brain, BookOpen, Layers } from 'lucide-react';
import { ScoreCard } from '../components/ScoreCard';

export const AssessmentResultPage = ({
  session,
  evaluation,
  onStartPractice,
  isLoadingPractice = false,
}) => {
  if (!evaluation) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Diagnostic Assessment Complete</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Your Proficiency Profile & Weakness Diagnosis
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Diagnostic test results in <strong>{session?.language}</strong> evaluated against grammar, vocabulary, and conversational benchmarks.
        </p>
      </div>

      {/* Score Card */}
      <ScoreCard
        grammar={evaluation.grammar_score}
        vocabulary={evaluation.vocabulary_score}
        conversation={evaluation.conversation_score}
        overall={evaluation.overall_score}
        estimatedLevel={evaluation.estimated_level}
        title="Diagnostic Skill Breakdown"
      />

      {/* AI Summary Feedback */}
      {evaluation.summary_feedback && (
        <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Diagnostic Evaluation Summary
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {evaluation.summary_feedback}
            </p>
          </div>
        </div>
      )}

      {/* Weak Areas vs Strengths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specific Weak Areas */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Diagnosed Weak Areas</h3>
              <p className="text-xs text-slate-400">Targeted for immediate practice</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {evaluation.weak_areas?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-950/25 border border-amber-800/30 text-xs font-medium text-amber-200"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Demonstrated Strengths</h3>
              <p className="text-xs text-slate-400">Skills you answered accurately</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {evaluation.strengths?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/30 text-xs font-medium text-emerald-200"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Personalized Practice CTA */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/40 border border-indigo-800/40 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Ready for Personalized Practice?</span>
          </h3>
          <p className="text-xs text-slate-300">
            Practice voice answers with real-time Whisper speech recognition & instant adaptive tutor feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartPractice}
          disabled={isLoadingPractice}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
        >
          <span>Start Personalized Practice</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
