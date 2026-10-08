import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  AlertOctagon,
  Server,
  Database,
  CheckCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Globe,
  Target,
  Briefcase,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [resMetrics, resUsers] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
      ]);
      setMetrics(resMetrics.data);
      setUsersList(resUsers.data || []);
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-slate-400">
        Loading system telemetry & admin metrics...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">System Admin & Telemetry Dashboard</h1>
            <p className="text-xs text-slate-400">
              Live SQLite metrics, aggregated learner benchmarks, and AI model health.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Top Aggregated Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Learners</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.total_learners}</p>
          <span className="text-[10px] text-emerald-400">Active profiles in SQLite</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Average Score</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.avg_overall_score}%</p>
          <span className="text-[10px] text-purple-400">Avg improvement: +{metrics.avg_improvement}%</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{metrics.lesson_completion_rate}%</p>
          <span className="text-[10px] text-slate-400">{metrics.total_sessions} total sessions</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase">Interviews Run</span>
            <Briefcase className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.mock_interviews_completed}</p>
          <span className="text-[10px] text-pink-400">Completed simulations</span>
        </div>
      </div>

      {/* Global Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Top Target Language</span>
          <p className="text-base font-extrabold text-indigo-300 flex items-center space-x-1.5">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>{metrics.most_popular_language}</span>
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Top Learning Goal</span>
          <p className="text-base font-extrabold text-emerald-300 flex items-center space-x-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>{metrics.most_popular_goal}</span>
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Most Difficult Skill</span>
          <p className="text-base font-extrabold text-rose-300 flex items-center space-x-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{metrics.most_difficult_skill}</span>
          </p>
        </div>
      </div>

      {/* System Infrastructure Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Server className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">System Infrastructure & AI Model Pipeline</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">LLM Inference Engine</span>
            <p className="text-xs font-bold text-indigo-300">Groq API ({metrics.system_status.groq_model})</p>
            <p className="text-[11px] text-slate-400">{metrics.system_status.groq_api_status}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Speech-to-Text Engine</span>
            <p className="text-xs font-bold text-purple-300">Local Whisper (faster-whisper base)</p>
            <p className="text-[11px] text-slate-400">Direct Mel Spectrogram Language Detection</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Persistence Store</span>
            <p className="text-xs font-bold text-emerald-300">SQLite (language_tutor.db)</p>
            <p className="text-[11px] text-slate-400">Tables: users, sessions, progress, mistakes, vocab, plans</p>
          </div>
        </div>
      </div>

      {/* Language Distribution & Top Mistakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Active Language Enrollment</h3>
          <div className="space-y-2.5">
            {Object.entries(metrics.language_distribution).map(([lang, count], idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                <span className="font-semibold text-slate-200">{lang}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                  {count} {count === 1 ? 'learner' : 'learners'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Top Error Categories Across Learners</h3>
          <div className="space-y-2.5">
            {metrics.top_mistake_categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                <span className="font-semibold text-amber-200">{cat.category}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  {cat.count} occurrences
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registered Learners Table */}
      {usersList && usersList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Recent Learner Accounts (SQLite)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Target Language</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/40">
                    <td className="py-2.5 px-3 font-mono text-indigo-400">#{u.id}</td>
                    <td className="py-2.5 px-3 font-bold">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{u.email || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                        {u.target_language}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{u.level}</td>
                    <td className="py-2.5 px-3 text-slate-400">{u.goal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
