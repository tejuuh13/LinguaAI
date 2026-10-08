import React from 'react';
import { Sparkles, Check, ArrowRight, X, Globe, Target, Layers } from 'lucide-react';

export const OnboardingModal = ({ isOpen, onClose, onStart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Welcome to LinguaAI Tutor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Your personal adaptive AI Language Tutor with real-time speech intelligence.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Select Language & Learning Goal</h4>
              <p className="text-[11px] text-slate-400">Choose from 7 languages for Daily Conversation, Travel, or Mock Job Interviews.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">AI Diagnostic Assessment</h4>
              <p className="text-[11px] text-slate-400">Take a 5-question test to diagnose grammar, vocabulary, and specific weak areas.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Adaptive Voice Practice & Mock Interviews</h4>
              <p className="text-[11px] text-slate-400">Speak into your mic with real-time Whisper language detection & pronunciation scoring.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onClose();
            if (onStart) onStart();
          }}
          className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
