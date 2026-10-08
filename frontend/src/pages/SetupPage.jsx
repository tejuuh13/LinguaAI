import React, { useState } from 'react';
import { Globe, Target, Layers, ArrowRight, Sparkles, User, Check } from 'lucide-react';

const LANGUAGES = [
  { id: 'English', name: 'English', flag: '🇬🇧', desc: 'Global Business & Everyday Dialogue' },
  { id: 'Spanish', name: 'Spanish', flag: '🇪🇸', desc: 'Español — Conversational & Travel' },
  { id: 'French', name: 'French', flag: '🇫🇷', desc: 'Français — Culture & Everyday Speech' },
  { id: 'German', name: 'German', flag: '🇩🇪', desc: 'Deutsch — Grammar & Workplace' },
  { id: 'Hindi', name: 'Hindi', flag: '🇮🇳', desc: 'हिन्दी — Daily Conversation & Culture' },
  { id: 'Telugu', name: 'Telugu', flag: '🇮🇳', desc: 'తెలుగు — Fluent Speaking & Everyday life' },
  { id: 'Japanese', name: 'Japanese', flag: '🇯🇵', desc: '日本語 — Polite & Daily Interactions' },
];

const LEVELS = [
  { id: 'Beginner', title: 'Beginner', desc: 'Basic vocabulary, simple phrases, and introductions' },
  { id: 'Intermediate', title: 'Intermediate', desc: 'Everyday conversations, past/future tenses, and opinions' },
  { id: 'Advanced', title: 'Advanced', desc: 'Complex arguments, professional fluency, and nuanced idioms' },
];

const GOALS = [
  { id: 'Daily Conversation', icon: '💬', title: 'Daily Conversation', desc: 'Chat naturally with friends, locals, and colleagues' },
  { id: 'Travel', icon: '✈️', title: 'Travel & Exploration', desc: 'Navigate airports, hotels, directions, and ordering food' },
  { id: 'Job Interview', icon: '💼', title: 'Job Interview & Career', desc: 'Professional pitch, technical discussions, and workplace fluency' },
  { id: 'General Learning', icon: '📚', title: 'General Mastery', desc: 'Comprehensive grammar, vocabulary, and balanced practice' },
  { id: 'Academic', icon: '🎓', title: 'Academic / Exam Prep', desc: 'Formal phrasing, essay structure, and advanced reading' },
];

export const SetupPage = ({ onStartAssessment, isLoading }) => {
  const [name, setName] = useState('Learner');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [selectedGoal, setSelectedGoal] = useState('Daily Conversation');

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartAssessment({
      name: name.trim() || 'Learner',
      language: selectedLanguage,
      level: selectedLevel,
      goal: selectedGoal,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Llama 3.3 70B + Local Whisper STT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Personalized AI Language Tutor
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Start with an intelligent diagnostic assessment. Our adaptive tutor identifies your specific weaknesses and tailors real-time voice practice just for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Your Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* 1. Language Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>1. Select Language to Learn</span>
            </label>
            <span className="text-xs text-indigo-400 font-semibold">{selectedLanguage}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLanguage(lang.id)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedLanguage === lang.id
                    ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-bold text-sm text-slate-100">{lang.name}</span>
                  </div>
                  {selectedLanguage === lang.id && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-snug">{lang.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Expected Proficiency Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>2. Expected Proficiency Level</span>
            </label>
            <span className="text-xs text-purple-400 font-semibold">{selectedLevel}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedLevel === lvl.id
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-100">{lvl.title}</span>
                  {selectedLevel === lvl.id && (
                    <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-snug">{lvl.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Learning Goal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>3. Primary Learning Goal</span>
            </label>
            <span className="text-xs text-emerald-400 font-semibold">{selectedGoal}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGoal(g.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedGoal === g.id
                    ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="text-lg">{g.icon}</span>
                  <span className="font-bold text-sm text-slate-100">{g.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50"
          >
            <span>Conduct AI Diagnostic Assessment</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
