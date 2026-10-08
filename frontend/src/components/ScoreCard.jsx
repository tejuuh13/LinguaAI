import React from 'react';
import { Award, TrendingUp, BookOpen, MessageSquare, CheckCircle } from 'lucide-react';

export const ScoreCard = ({
  grammar = 0,
  vocabulary = 0,
  conversation = 0,
  overall = 0,
  initialScore = null,
  improvement = null,
  estimatedLevel = null,
  title = 'Performance Breakdown',
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    if (score >= 65) return 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40';
    if (score >= 50) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-indigo-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span>{title}</span>
          </h3>
          {estimatedLevel && (
            <p className="text-xs text-slate-400 mt-0.5">
              Estimated Proficiency:{' '}
              <strong className="text-indigo-300 font-semibold">{estimatedLevel}</strong>
            </p>
          )}
        </div>

        {/* Overall Badge */}
        <div className="flex items-center space-x-3">
          {initialScore !== null && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Initial</span>
              <span className="text-sm font-semibold text-slate-300">{initialScore}</span>
            </div>
          )}

          <div className={`px-4 py-2 rounded-xl border text-center ${getScoreColor(overall)}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider block">Overall</span>
            <span className="text-xl font-extrabold">{overall}</span>
          </div>

          {improvement !== null && improvement > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-bold shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>+{improvement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grammar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Grammar</span>
            </span>
            <span className="font-bold text-slate-200">{grammar}/100</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(grammar)}`}
              style={{ width: `${Math.min(100, Math.max(0, grammar))}%` }}
            ></div>
          </div>
        </div>

        {/* Vocabulary */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Vocabulary</span>
            </span>
            <span className="font-bold text-slate-200">{vocabulary}/100</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(vocabulary)}`}
              style={{ width: `${Math.min(100, Math.max(0, vocabulary))}%` }}
            ></div>
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
              <span>Conversation</span>
            </span>
            <span className="font-bold text-slate-200">{conversation}/100</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(conversation)}`}
              style={{ width: `${Math.min(100, Math.max(0, conversation))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
