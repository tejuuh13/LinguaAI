import React from 'react';
import { Sparkles, BrainCircuit, BookOpen, Mic, BarChart3, MessageSquareText, Languages, UserRound, GraduationCap, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

const featureGroups = [
  {
    title: 'P0 - Must Have',
    tone: 'from-rose-500/20 to-red-500/10',
    items: [
      { name: 'Diagnostic assessment', icon: BrainCircuit, status: 'Active' },
      { name: 'AI skill evaluation', icon: Sparkles, status: 'Active' },
      { name: 'Learner profile', icon: UserRound, status: 'Active' },
      { name: 'Personalized learning plan', icon: GraduationCap, status: 'Active' },
      { name: 'AI tutor chat', icon: MessageSquareText, status: 'Active' },
      { name: 'Grammar exercises', icon: BookOpen, status: 'Active' },
      { name: 'Vocabulary', icon: Languages, status: 'Active' },
      { name: 'AI feedback', icon: ShieldCheck, status: 'Active' },
      { name: 'Progress dashboard', icon: BarChart3, status: 'Active' },
    ],
  },
  {
    title: 'P1 - Important',
    tone: 'from-orange-500/20 to-amber-500/10',
    items: [
      { name: 'Mock interview', icon: Mic, status: 'Available' },
      { name: 'Speech / pronunciation', icon: Mic, status: 'Live' },
      { name: 'Revision mistakes', icon: BookOpen, status: 'Available' },
    ],
  },
  {
    title: 'P2 - Nice to have',
    tone: 'from-yellow-500/15 to-lime-500/10',
    items: [
      { name: 'Multiple languages', icon: Languages, status: 'Supported' },
      { name: 'Admin dashboard', icon: BarChart3, status: 'Available' },
    ],
  },
];

export const FeatureHubPage = ({ session, onStartAssessment, onStartPractice, onNavigateToDashboard }) => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Learning feature hub
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">Onboarding and learning journey</h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Your learner profile, adaptive plan, voice practice, AI feedback, and review tools are all connected into one onboarding flow for {session.language} learning.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onStartAssessment} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2">
              Start assessment <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={onStartPractice} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700">
              Resume practice
            </button>
            <button onClick={onNavigateToDashboard} className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
              Progress dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {featureGroups.map((group) => (
          <div key={group.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className={`rounded-xl bg-gradient-to-r ${group.tone} p-3 mb-4`}>
              <h2 className="text-sm font-bold text-white">{group.title}</h2>
            </div>

            <div className="space-y-3">
              {group.items.map(({ name, icon: Icon, status }) => (
                <div key={name} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-200 truncate">{name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
