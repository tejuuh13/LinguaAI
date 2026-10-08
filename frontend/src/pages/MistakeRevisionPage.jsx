import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, HelpCircle, Trophy, Target, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const MistakeRevisionPage = ({ userId = 1, session }) => {
  const [overview, setOverview] = useState(null);
  const [quizItems, setQuizItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAttempt, setUserAttempt] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    fetchMistakesOverview();
  }, [userId]);

  const fetchMistakesOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/revision/mistakes/${userId}`);
      setOverview(res.data);
      setQuizItems(res.data.quiz_items || []);
    } catch (err) {
      console.error('Error fetching mistake revision overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentItem = quizItems[currentIndex];
  const totalItems = quizItems.length;

  const handleRetrySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!userAttempt.trim() || !currentItem) return;

    try {
      const res = await api.post('/revision/evaluate', {
        mistake_id: currentItem.mistake_id,
        user_attempt: userAttempt.trim(),
        user_id: userId,
      });
      setFeedback(res.data);
      if (res.data.is_correct) {
        setResolvedCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setUserAttempt('');
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Mistake Revision Room (SQLite)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Practice My Mistakes & Weak Topics
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          AI retrieves your past recorded grammar and vocabulary errors and generates targeted retries to solidify mastery.
        </p>
      </div>

      {/* Weakness Breakdown Card */}
      {overview && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                Primary Focus Area: <strong className="text-rose-300">{overview.most_frequent_weakness}</strong>
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 font-bold">
              Total Logged: {overview.total_mistakes} Mistakes
            </span>
          </div>

          {/* Categories Grid */}
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(overview.weakness_breakdown || {}).map(([cat, count]) => (
              <div
                key={cat}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center space-x-2"
              >
                <span>{cat}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold text-[10px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Retry Quiz Card */}
      {quizItems.length > 0 && currentItem ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Progress & Category */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-slate-950 text-indigo-300 border border-slate-800">
              {currentItem.category || 'Grammar Drill'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Mistake {currentIndex + 1} of {totalItems} • Resolved: <strong className="text-emerald-400">{resolvedCount}</strong>
            </span>
          </div>

          {/* Question / Wrong Phrase */}
          <div className="space-y-3">
            <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                Recorded Error:
              </span>
              <p className="text-base font-semibold text-rose-200 line-through">
                "{currentItem.original_wrong_phrase}"
              </p>
            </div>

            <h3 className="text-lg font-bold text-white leading-relaxed">
              {currentItem.prompt}
            </h3>

            {currentItem.explanation && (
              <p className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{currentItem.explanation}</span>
              </p>
            )}
          </div>

          {/* Answer Input */}
          {!feedback ? (
            <form onSubmit={handleRetrySubmit} className="space-y-4">
              <input
                type="text"
                value={userAttempt}
                onChange={(e) => setUserAttempt(e.target.value)}
                placeholder="Type the corrected sentence or word here..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!userAttempt.trim()}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                >
                  Verify Correction
                </button>
              </div>
            </form>
          ) : (
            /* Feedback */
            <div className="space-y-4 animate-fadeIn">
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
                  feedback.is_correct
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800 text-amber-200'
                }`}
              >
                {feedback.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span>{feedback.feedback}</span>
              </div>

              <div className="flex justify-end pt-2">
                {currentIndex < totalItems - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
                  >
                    <span>Next Mistake to Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-center text-xs text-emerald-300 font-bold w-full">
                    🎉 Awesome job! You completed this revision session and reinforced your weak points.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Unresolved Mistakes!</h3>
          <p className="text-xs text-slate-400">Complete more live practice sessions to record learning points here.</p>
        </div>
      )}
    </div>
  );
};
