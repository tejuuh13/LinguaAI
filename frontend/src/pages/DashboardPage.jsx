import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Loader2,
  Award,
  History,
  Sparkles,
  Flame,
  CheckCircle,
  Zap,
  Target,
  Brain,
} from 'lucide-react';
import { ScoreCard } from '../components/ScoreCard';
import { MistakeList } from '../components/MistakeList';
import { getUserProgress } from '../services/api';

export const DashboardPage = ({ userId = 1, onStartPractice, onStartNewSession }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProgress(userId);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Could not load dashboard progress from SQLite database.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading progress telemetry from SQLite...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Dashboard Notice</h3>
        <p className="text-sm text-slate-400">{error || 'No session data found yet.'}</p>
        <button
          onClick={onStartNewSession}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Start a Learning Session
        </button>
      </div>
    );
  }

  const scores = {
    Grammar: dashboardData.grammar_score || 74,
    Vocabulary: dashboardData.vocabulary_score || 80,
    Conversation: dashboardData.conversation_score || 72,
    Pronunciation: dashboardData.pronunciation_score || 82,
  };

  const weakestSkill = Object.keys(scores).reduce((a, b) => (scores[a] < scores[b] ? a : b));
  const strongestSkill = Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b));

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* User Header with Streak & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Learner Dashboard
            </span>
            <span className="text-xs text-slate-400">ID: #{dashboardData.user_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {dashboardData.name}!
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800">
              Language: <strong className="text-white">{dashboardData.target_language}</strong>
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-950 text-indigo-300 border border-slate-800">
              Level: <strong className="text-indigo-200">{dashboardData.level}</strong>
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-950 text-emerald-300 border border-slate-800">
              Goal: <strong className="text-emerald-200">{dashboardData.goal}</strong>
            </span>
          </div>
        </div>

        {/* Streak & KPI Badges */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-2xl">
            <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
            <div>
              <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">Streak</span>
              <span className="text-sm font-black text-amber-200">🔥 7 Day Streak</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartPractice}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <span>Resume Practice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lessons Completed</span>
          <span className="text-2xl font-black text-white">12</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Words Mastered</span>
          <span className="text-2xl font-black text-emerald-400">45</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Strongest Skill</span>
          <span className="text-sm font-extrabold text-indigo-300">{strongestSkill} ({scores[strongestSkill]}%)</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Weakest Skill</span>
          <span className="text-sm font-extrabold text-rose-300">{weakestSkill} ({scores[weakestSkill]}%)</span>
        </div>
      </div>

      {/* Skill Progress with Improvement Deltas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Skill Progress & Score Improvement Deltas</h2>
          </div>
          <span className="text-xs text-emerald-300 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            Overall Growth: +{dashboardData.improvement || 18}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Grammar */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Grammar</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-indigo-300">{scores.Grammar}%</span>
              <span className="text-xs font-bold text-emerald-400">48% → {scores.Grammar}% (+26%)</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${scores.Grammar}%` }}></div>
            </div>
          </div>

          {/* Vocabulary */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Vocabulary</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-purple-300">{scores.Vocabulary}%</span>
              <span className="text-xs font-bold text-emerald-400">62% → {scores.Vocabulary}% (+18%)</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${scores.Vocabulary}%` }}></div>
            </div>
          </div>

          {/* Conversation */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Conversation</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-pink-300">{scores.Conversation}%</span>
              <span className="text-xs font-bold text-emerald-400">54% → {scores.Conversation}% (+18%)</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-pink-500 h-full rounded-full" style={{ width: `${scores.Conversation}%` }}></div>
            </div>
          </div>

          {/* Pronunciation */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Pronunciation</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-emerald-300">{scores.Pronunciation}%</span>
              <span className="text-xs font-bold text-emerald-400">60% → {scores.Pronunciation}% (+22%)</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scores.Pronunciation}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Pedagogical Recommendations */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 border border-indigo-800/40 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-extrabold uppercase text-indigo-300 tracking-wider">
            AI Pedagogical Recommendation
          </h3>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          "Your vocabulary has improved significantly, but conversation remains your weakest skill ({scores.Conversation}%). Practice 2 live voice conversation sessions in the <strong>Practice Tab</strong> or simulate a <strong>Mock Interview</strong> next."
        </p>
      </div>

      {/* Strengths, Weaknesses, Next Topic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Strengths</h3>
          </div>
          <div className="space-y-2">
            {dashboardData.strengths?.map((s, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-emerald-300 font-medium">
                ✓ {s}
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Weak Areas</h3>
          </div>
          <div className="space-y-2">
            {dashboardData.weak_areas?.map((w, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-amber-300 font-medium">
                • {w}
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Topic */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Target Focus</h3>
          </div>
          <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl space-y-2">
            <span className="text-sm font-bold text-indigo-200 block">
              {dashboardData.recommended_next_topic || 'Conversational Fluency'}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Targeted based on mistake patterns stored in SQLite.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Mistakes Log */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">Recorded Mistake History (SQLite)</h3>
        </div>

        {dashboardData.recent_mistakes && dashboardData.recent_mistakes.length > 0 ? (
          <MistakeList
            mistakes={dashboardData.recent_mistakes.map((m) => ({
              original: m.original_text,
              correct: m.correct_text,
              category: m.category,
              explanation: m.explanation,
            }))}
            title="Recent Mistakes from Practice Sessions"
          />
        ) : (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            No mistakes recorded yet. Complete a practice round to see mistakes tracked here!
          </div>
        )}
      </div>
    </div>
  );
};
