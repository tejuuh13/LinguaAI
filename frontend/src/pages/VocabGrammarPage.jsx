import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, Volume2, Sparkles, Check, CheckCircle2, XCircle, Search, Filter, RefreshCw, Star, Zap } from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { api } from '../services/api';

export const VocabGrammarPage = ({ session }) => {
  const [vocabCards, setVocabCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVocab();
  }, [session?.language]);

  const fetchVocab = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vocab/${session?.language || 'Spanish'}`);
      setVocabCards(res.data);
    } catch (err) {
      console.error('Error fetching vocab cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIWords = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/vocab/generate', {
        user_id: session?.userId || 1,
        language: session?.language || 'Spanish',
        level: session?.level || 'Intermediate',
        goal: session?.goal || 'Daily Conversation',
        topic: 'High Yield Conversational Vocabulary',
      });
      setVocabCards((prev) => [...res.data, ...prev]);
    } catch (err) {
      console.error('Error generating AI words:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateMastery = async (cardId, isCorrect) => {
    try {
      const res = await api.post('/vocab/update-mastery', {
        user_id: session?.userId || 1,
        word_id: cardId,
        is_correct: isCorrect,
      });
      setVocabCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? {
                ...c,
                mastery_score: res.data.mastery_score,
                correct_count: res.data.correct_count,
                incorrect_count: res.data.incorrect_count,
              }
            : c
        )
      );
    } catch (err) {
      console.error('Error updating mastery:', err);
    }
  };

  const filteredCards = vocabCards.filter((card) => {
    const matchesSearch =
      card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.meaning && card.meaning.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'All' || card.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Spaced Repetition Lexicon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Vocabulary Builder & Mastery Deck
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Rich flashcards with synonyms, antonyms, phonetics, and spaced repetition tracking in <strong>{session?.language}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateAIWords}
          disabled={isGenerating}
          className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50 shrink-0"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating AI Words...' : 'Generate New AI Words'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search words, meanings, or phonetics..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDifficulty === diff
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary Flashcard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {card.difficulty}
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
                  {card.mastery_score || 50}% Mastery
                </span>
                <AudioPlayer
                  text={card.word}
                  language={session?.language || 'Spanish'}
                  label=""
                  size="sm"
                />
              </div>
            </div>

            {/* Word & Pronunciation */}
            <div className="text-center space-y-1 py-1">
              <h3 className="text-xl font-black text-white tracking-tight">{card.word}</h3>
              {card.pronunciation && (
                <p className="text-xs text-indigo-300 font-mono">[{card.pronunciation}]</p>
              )}
              <p className="text-xs text-slate-300 pt-1 leading-snug">{card.meaning}</p>
            </div>

            {/* Example Sentence */}
            {card.example_sentence && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Example:</span>
                <p className="text-slate-200 font-medium leading-snug italic">
                  "{card.example_sentence}"
                </p>
              </div>
            )}

            {/* Synonyms & Antonyms */}
            {(card.synonyms || card.antonyms) && (
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">Synonyms:</span>
                  <span className="text-emerald-300 truncate block">{card.synonyms || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">Antonyms:</span>
                  <span className="text-rose-300 truncate block">{card.antonyms || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Mastery Self-Review Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleUpdateMastery(card.id, false)}
                className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition-all"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Need Review</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateMastery(card.id, true)}
                className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 text-xs font-bold transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mastered</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
