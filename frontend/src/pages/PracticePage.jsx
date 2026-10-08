import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Languages,
  ArrowLeftRight,
  Trophy,
  Lock,
  Unlock,
  Check,
  Loader2,
  BookOpen,
  VolumeX,
  HelpCircle,
  Zap,
  Mic,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { getPracticeLevels, translateForPractice, evaluateSpokenTranslation } from '../services/api';

const AVAILABLE_LANGUAGES = [
  'English',
  'Spanish',
  'Telugu',
  'Hindi',
  'French',
  'German',
  'Japanese',
];

export const PracticePage = ({ session }) => {
  // Level State (1 to 10)
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelsData, setLevelsData] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);

  // Language State
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState(session?.language || 'Telugu');

  // Input & Translation State
  const [inputText, setInputText] = useState('');
  const [translationResult, setTranslationResult] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Speech Evaluation State
  const [isEvaluatingSpeech, setIsEvaluatingSpeech] = useState(false);
  const [speechResult, setSpeechResult] = useState(null);

  useEffect(() => {
    fetchLevels();
  }, []);

  // Update target language if session changes
  useEffect(() => {
    if (session?.language && session.language !== fromLang) {
      setToLang(session.language);
    }
  }, [session?.language]);

  const fetchLevels = async () => {
    setLoadingLevels(true);
    try {
      const data = await getPracticeLevels();
      setLevelsData(data.levels || []);
      if (data.levels && data.levels.length > 0) {
        loadLevelDefaults(1, data.levels, fromLang, toLang);
      }
    } catch (err) {
      console.error('Error loading practice levels:', err);
    } finally {
      setLoadingLevels(false);
    }
  };

  const loadLevelDefaults = (lvl, levelsList, from, to) => {
    const targetLevels = levelsList || levelsData;
    const lvlMeta = targetLevels.find((l) => l.level === lvl) || targetLevels[0];
    if (lvlMeta && lvlMeta.starters) {
      const starterText = lvlMeta.starters[from] || lvlMeta.starters['English'] || '';
      setInputText(starterText);
      setTranslationResult(null);
      setSpeechResult(null);
    }
  };

  const handleSwapLanguages = () => {
    const prevFrom = fromLang;
    const prevTo = toLang;
    setFromLang(prevTo);
    setToLang(prevFrom);
    loadLevelDefaults(currentLevel, levelsData, prevTo, prevFrom);
  };

  const handleSelectLevel = (lvl) => {
    if (lvl > unlockedLevel) return;
    setCurrentLevel(lvl);
    loadLevelDefaults(lvl, levelsData, fromLang, toLang);
  };

  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) return;
    setIsTranslating(true);
    setSpeechResult(null);

    try {
      const data = await translateForPractice({
        fromLanguage: fromLang,
        toLanguage: toLang,
        text: inputText.trim(),
        level: currentLevel,
      });
      setTranslationResult(data);
    } catch (err) {
      console.error('Translation error:', err);
      alert('Could not translate text. Please check connection.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleVoiceSubmit = async ({ response, pronunciationScore }) => {
    if (!translationResult || isEvaluatingSpeech) return;
    setIsEvaluatingSpeech(true);

    try {
      const evalData = await evaluateSpokenTranslation({
        userId: session?.userId || 1,
        fromLanguage: fromLang,
        toLanguage: toLang,
        sourceText: translationResult.source_text,
        targetText: translationResult.translated_text,
        spokenText: response,
        level: currentLevel,
        pronunciationScore: pronunciationScore || 85,
      });

      setSpeechResult(evalData);

      if (evalData.passed) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        if (currentLevel < 10 && currentLevel >= unlockedLevel) {
          setUnlockedLevel(currentLevel + 1);
        }
      }
    } catch (err) {
      console.error('Error evaluating spoken translation:', err);
    } finally {
      setIsEvaluatingSpeech(false);
    }
  };

  const handleAdvanceToNextLevel = () => {
    if (currentLevel < 10) {
      const nextLvl = currentLevel + 1;
      setCurrentLevel(nextLvl);
      if (nextLvl > unlockedLevel) {
        setUnlockedLevel(nextLvl);
      }
      loadLevelDefaults(nextLvl, levelsData, fromLang, toLang);
    }
  };

  const currentLevelMeta = levelsData.find((l) => l.level === currentLevel) || {
    level: currentLevel,
    title: `Level ${currentLevel}: Interactive Mastery`,
    objective: 'Translate, pronounce accurately, and advance through 10 proficiency levels.',
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-fadeIn">
      {/* 10-Level Progressive Stepper Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              10-Level Speech & Translation Quest
            </h2>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
            Level {currentLevel} of 10 • Unlocked: {unlockedLevel}/10
          </span>
        </div>

        {/* Level Badges Stepper */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
            const isUnlocked = lvl <= unlockedLevel;
            const isCurrent = lvl === currentLevel;
            const isCompleted = lvl < unlockedLevel;

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => handleSelectLevel(lvl)}
                disabled={!isUnlocked}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-indigo-400 ring-2 ring-indigo-400/30 shadow-lg shadow-indigo-500/20 scale-105'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                    : isUnlocked
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-0.5">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3 h-3 text-slate-600" />
                  ) : (
                    <span>{lvl}</span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">L{lvl}</span>
              </button>
            );
          })}
        </div>

        {/* Current Level Objective */}
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div>
            <h3 className="font-bold text-slate-200">{currentLevelMeta.title}</h3>
            <p className="text-slate-400 text-[11px]">{currentLevelMeta.objective}</p>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/40">
            Pass Threshold: 75% Pronunciation
          </span>
        </div>
      </div>

      {/* Language From & To Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* From Language */}
          <div className="w-full sm:w-5/12 space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              From Known Language:
            </label>
            <select
              value={fromLang}
              onChange={(e) => {
                const newFrom = e.target.value;
                setFromLang(newFrom);
                loadLevelDefaults(currentLevel, levelsData, newFrom, toLang);
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} disabled={lang === toLang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapLanguages}
            title="Swap Languages"
            className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-white transition-all shadow-md active:scale-95 shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* To Language */}
          <div className="w-full sm:w-5/12 space-y-1">
            <label className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
              To Practice Language (Target):
            </label>
            <select
              value={toLang}
              onChange={(e) => {
                const newTo = e.target.value;
                setToLang(newTo);
                loadLevelDefaults(currentLevel, levelsData, fromLang, newTo);
              }}
              className="w-full bg-slate-950 border border-indigo-600/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 shadow-md shadow-indigo-600/10"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} disabled={lang === fromLang}>
                  {lang} (Practice Speaking)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Text Box */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Enter sentence in {fromLang}:
            </label>
            <button
              type="button"
              onClick={() => loadLevelDefaults(currentLevel, levelsData, fromLang, toLang)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              ↺ Reset Level {currentLevel} Challenge
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type your sentence in ${fromLang}...`}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-24"
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating to {toLang}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate & Prepare Voice Drill</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Translation & English Pronunciation Guide Card */}
      {translationResult && (
        <div className="bg-slate-900 border border-indigo-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          {/* Card Header with Read Aloud */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Target Sentence in {toLang}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Read the English transliteration aloud, listen to the native audio, then speak into the mic.
              </p>
            </div>

            <AudioPlayer
              text={translationResult.translated_text}
              language={toLang}
              label="Listen Native Audio"
              size="md"
            />
          </div>

          {/* Romanized English Transliteration (How to Speak) Banner */}
          <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950 p-5 sm:p-6 rounded-2xl border-2 border-indigo-500/40 shadow-xl space-y-2 text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 inline-flex items-center space-x-1.5 shadow-sm">
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              <span>HOW TO SPEAK IN ENGLISH LETTERS (READ THIS ALOUD):</span>
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-wide leading-relaxed font-mono">
              "{translationResult.transliteration_english || translationResult.phonetic_guide}"
            </h2>

            {/* Native Script (Reference) */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                Native Script Reference ({toLang}):
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-300">
                {translationResult.translated_text}
              </p>
            </div>
          </div>

          {/* Word-by-Word Breakdown Chips */}
          {translationResult.word_breakdowns && translationResult.word_breakdowns.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Word-by-Word English Pronunciation & Meaning:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {translationResult.word_breakdowns.map((wb, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{wb.word}</span>
                      <span className="text-[11px] font-bold text-amber-300 font-mono">
                        "{wb.transliteration}"
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{wb.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar Note */}
          {translationResult.grammar_breakdown && (
            <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              💡 <strong>Language Breakdown: </strong> {translationResult.grammar_breakdown}
            </p>
          )}

          {/* Voice Recording Input */}
          <div className="pt-2">
            <VoiceRecorder
              targetLanguage={toLang}
              onSubmitAnswer={handleVoiceSubmit}
              isEvaluating={isEvaluatingSpeech}
              suggestedStarter=""
            />
          </div>

          {/* Speech Evaluation Results */}
          {speechResult && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-6 animate-fadeIn">
              {/* Score & Passed Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      speechResult.passed
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/10'
                        : 'bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-amber-500/10'
                    }`}
                  >
                    {speechResult.passed ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      {speechResult.passed ? `🎉 Level ${currentLevel} Passed!` : 'Try Again for 75% Pass'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Overall Score: <strong className="text-white">{speechResult.overall_score}%</strong> (Pronunciation: {speechResult.pronunciation_score}% • Accuracy: {speechResult.accuracy_score}%)
                    </p>
                  </div>
                </div>

                {speechResult.unlocked_badge && (
                  <span className="px-3 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800 font-bold text-xs">
                    {speechResult.unlocked_badge}
                  </span>
                )}
              </div>

              {/* Word-by-Word Pronunciation Match */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Word Pronunciation Match:
                </span>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-900 rounded-xl border border-slate-800">
                  {speechResult.word_diff?.map((w, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        w.status === 'correct'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 shadow-sm'
                          : w.status === 'mispronounced'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 shadow-sm'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/80 line-through'
                      }`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feedback Advice */}
              <p className="text-xs sm:text-sm text-slate-200 bg-slate-900 p-4 rounded-xl border border-slate-800">
                {speechResult.feedback_message}
              </p>

              {/* Level Advancement CTA */}
              <div className="flex justify-end pt-2">
                {speechResult.passed ? (
                  currentLevel < 10 ? (
                    <button
                      type="button"
                      onClick={handleAdvanceToNextLevel}
                      className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
                    >
                      <span>Advance to Level {currentLevel + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-center text-xs font-bold text-amber-300">
                      🏆 Congratulations! You have mastered all 10 Levels!
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setSpeechResult(null)}
                    className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Recording Again</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
