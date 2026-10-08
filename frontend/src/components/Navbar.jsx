import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  BarChart3,
  RotateCcw,
  MessageSquare,
  Briefcase,
  BookOpen,
  Repeat,
  Calendar,
  ShieldCheck,
  Key,
  Check,
  X,
  User as UserIcon,
  LogOut,
  Target,
  Brain,
  GraduationCap,
} from 'lucide-react';
import { setGroqKey } from '../services/api';

export const Navbar = ({ session, currentStep, onNavigate, onReset, user, onLogout }) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const navItems = [
    { id: 'practice', label: '10-Level Practice', icon: Target },
    { id: 'chat', label: 'AI Tutor Chat', icon: MessageSquare },
    { id: 'interview', label: 'Mock Interview', icon: Briefcase },
    { id: 'vocab', label: 'Vocabulary Deck', icon: BookOpen },
    { id: 'revision', label: 'Mistake Revision', icon: Repeat },
    { id: 'plan', label: 'Learning Roadmap', icon: Calendar },
    { id: 'dashboard', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'admin', label: 'HR / Admin Telemetry', icon: ShieldCheck },
  ];

  const handleSaveKey = async (e) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      await setGroqKey(apiKeyInput.trim());
      setKeySaved(true);
      setTimeout(() => {
        setKeySaved(false);
        setShowKeyModal(false);
      }, 1500);
    } catch (err) {
      console.error('Error setting Groq key:', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <div
            onClick={() => onNavigate('setup')}
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                LinguaAI
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400/80 px-2 py-0.5 bg-indigo-950/60 rounded-full border border-indigo-800/40">
                Enterprise Edition
              </span>
            </div>
          </div>

          {/* Feature Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentStep === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Compact Navbar for Laptops (lg screens) */}
          <nav className="hidden lg:flex xl:hidden items-center space-x-1">
            {navItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = currentStep === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Context Badges & Actions */}
          <div className="flex items-center space-x-2">
            {/* User Profile Badge */}
            {user && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user.name || user.email}</span>
              </div>
            )}

            {session && session.language && (
              <div className="hidden sm:flex items-center space-x-1.5">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-semibold">
                  🌐 {session.language}
                </span>
              </div>
            )}

            {/* Groq API Key Setup Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              title="Configure Groq API Key"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            {/* Logout */}
            {user && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Compact Sub-Navigation Bar */}
        <div className="xl:hidden flex items-center space-x-1 overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-950/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Groq Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Groq API Key (Optional)</h3>
            </div>

            <p className="text-xs text-slate-400">
              Provide your Groq API key for live Llama 3.3 70B inference. If left empty, the app runs smoothly in calibrated dynamic engine mode.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!apiKeyInput.trim()}
                  className="flex items-center space-x-1 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {keySaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Key</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
