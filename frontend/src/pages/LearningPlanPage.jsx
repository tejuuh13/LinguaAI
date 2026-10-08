import React, { useState, useEffect } from 'react';
import { Calendar, Target, CheckCircle2, TrendingUp, Sparkles, BookOpen, Clock, ArrowRight, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { api } from '../services/api';

export const LearningPlanPage = ({ userId = 1, onStartPractice }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [userId]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/learning-plan/${userId}`);
      setPlan(res.data);
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.post('/learning-plan/generate', { user_id: userId, force_regenerate: true });
      setPlan(res.data);
    } catch (err) {
      console.error('Error regenerating plan:', err);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-slate-400">
        Generating personalized curriculum roadmap...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>AI Personalized Syllabus</span>
            </span>
            <span className="text-xs text-slate-400">7-Day Intensive + 4-Week Track</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {plan.learner_name}'s {plan.target_language} Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Tailored for <strong>{plan.target_goal}</strong> at the <strong>{plan.current_level}</strong> level.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Regenerating...' : 'Regenerate Plan'}</span>
          </button>

          <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duration</span>
              <span className="text-base font-extrabold text-white">{plan.estimated_duration_weeks} Weeks</span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-center">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Boost</span>
              <span className="text-base font-extrabold text-emerald-300">+{plan.projected_score_boost} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Intensive Curriculum */}
      {plan.daily_plan && plan.daily_plan.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold text-white">7-Day Mastery Curriculum</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Step-by-step Daily Milestones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5 pt-2">
            {plan.daily_plan.map((dp) => (
              <div
                key={dp.day}
                className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 block w-fit mb-1">
                    Day {dp.day}
                  </span>
                  <h4 className="text-xs font-bold text-white leading-snug">{dp.activity}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">{dp.focus}</p>
                </div>
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    🎯 {dp.target_skill}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4-Week Roadmap Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-400" />
          <span>4-Week Long-Term Proficiency Roadmap</span>
        </h2>

        {plan.weeks?.map((week) => (
          <div
            key={week.week_number}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700/80 transition-colors"
          >
            {/* Week Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-extrabold text-sm">
                  W{week.week_number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">{week.title}</h3>
                  <p className="text-xs text-indigo-300 font-medium">{week.focus_topic}</p>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 font-medium">
                🎯 {week.target_skill_outcome}
              </span>
            </div>

            {/* Daily Exercises */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Scheduled Daily Activities:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {week.daily_exercises?.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Start Action */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onStartPractice}
          className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
        >
          <span>Start Week 1 Practice Session</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
