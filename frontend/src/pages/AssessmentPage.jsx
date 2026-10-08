import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, HelpCircle, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceRecorder } from '../components/VoiceRecorder';

export const AssessmentPage = ({
  session,
  questions = [],
  onSubmitAssessment,
  isEvaluating = false,
  onBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: answerString }

  const currentQ = questions[currentIndex] || {};
  const currentAnswer = answers[currentQ.id] || '';
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  const handleVoiceAnswer = ({ response }) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: response,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    // Structure answers array
    const formattedAnswers = questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      user_answer: answers[q.id] || '(No response provided)',
    }));

    onSubmitAssessment(formattedAnswers);
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k] && answers[k].trim()).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      {/* Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Setup</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Initial Diagnostic Assessment
          </span>

          <span className="text-xs text-slate-400 font-medium">
            Question <strong className="text-slate-200">{currentIndex + 1}</strong> of {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Question Type & Read-Aloud */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-slate-800 text-indigo-300 border border-slate-700/80">
            {currentQ.type?.replace('_', ' ') || 'Diagnostic'}
          </span>

          <AudioPlayer
            text={currentQ.question}
            language={session?.language || 'English'}
            label="Listen to Question"
            size="sm"
          />
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
            {currentQ.question}
          </h2>
          {currentQ.hint && (
            <p className="text-xs text-slate-400 flex items-center space-x-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{currentQ.hint}</span>
            </p>
          )}
        </div>

        {/* Options / Input Form */}
        {currentQ.options && currentQ.options.length > 0 ? (
          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = currentAnswer === opt;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 ring-2 ring-indigo-500/20 font-medium'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Speak or type your answer in {session?.language || 'English'}:
            </p>
            <VoiceRecorder
              targetLanguage={session?.language || 'English'}
              onSubmitAnswer={handleVoiceAnswer}
              suggestedStarter=""
            />
          </div>
        )}

        {/* Card Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isEvaluating}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating with Llama 3.3 70B...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Complete & Evaluate Assessment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
