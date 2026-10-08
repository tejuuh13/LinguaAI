import React, { useState, useEffect } from 'react';
import { Mic, Square, Send, AlertTriangle, CheckCircle, RefreshCw, Type, Loader2, Globe, Volume2, Sparkles } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeVoice } from '../services/api';

export const VoiceRecorder = ({
  targetLanguage = 'English',
  onSubmitAnswer,
  isEvaluating = false,
  disabled = false,
  suggestedStarter = '',
}) => {
  const {
    isRecording,
    recordingDuration,
    audioBlob,
    liveTranscript,
    error: micError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder(targetLanguage);

  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textAnswer, setTextAnswer] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync live speech recognition transcript while recording
  useEffect(() => {
    if (liveTranscript) {
      setTextAnswer(liveTranscript);
    }
  }, [liveTranscript]);

  // Transcribe with Whisper on audioBlob capture
  useEffect(() => {
    if (audioBlob) {
      handleTranscribeAudio(audioBlob);
    }
  }, [audioBlob]);

  // Pre-fill suggested starter if empty
  useEffect(() => {
    if (suggestedStarter && !textAnswer) {
      setTextAnswer(suggestedStarter + ' ');
    }
  }, [suggestedStarter]);

  const handleTranscribeAudio = async (blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const data = await transcribeVoice(blob, targetLanguage);
      setTranscriptionResult(data);

      if (data.transcript && !textAnswer) {
        setTextAnswer(data.transcript);
      } else if (data.transcript && data.transcript.length > textAnswer.length) {
        setTextAnswer(data.transcript);
      }
    } catch (err) {
      console.warn('Backend Whisper transcription note:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (!textAnswer.trim() || isEvaluating) return;

    onSubmitAnswer({
      response: textAnswer.trim(),
      responseMode: inputMode,
      detectedLanguage: transcriptionResult?.detected_language || targetLanguage,
      languageMatch: transcriptionResult?.language_match ?? true,
      pronunciationScore: transcriptionResult?.pronunciation_score || 85,
    });

    // Reset
    setTextAnswer('');
    setTranscriptionResult(null);
    resetRecording();
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all">
      {/* Top Controls & Language Target */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <span>INPUT METHOD:</span>
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                inputMode === 'voice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Fallback</span>
            </button>
          </div>
        </div>

        <span className="text-xs text-indigo-300 bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-800/40 font-medium flex items-center space-x-1">
          <span>Language:</span>
          <strong className="text-white">{targetLanguage}</strong>
        </span>
      </div>

      {/* Voice Mode */}
      {inputMode === 'voice' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/70 rounded-xl border border-slate-800/80 relative overflow-hidden">
            {/* Visual pulsing while recording */}
            {isRecording && (
              <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 rounded-full bg-red-500/15 blur-2xl"></div>
              </div>
            )}

            {/* Main Record Button */}
            <div className="relative z-10 flex flex-col items-center">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled || isTranscribing || isEvaluating}
                  className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-indigo-300">
                    🎙️ Click to Speak Answer in {targetLanguage}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/40 animate-pulse active:scale-95 transition-all"
                >
                  <Square className="w-7 h-7 fill-white" />
                  <span className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-red-400">
                    Recording {formatSeconds(recordingDuration)} • Click to Stop
                  </span>
                </button>
              )}
            </div>

            {/* Audio Waveform while recording */}
            {isRecording && (
              <div className="flex items-center space-x-1 mt-10 h-6">
                {[35, 75, 95, 60, 100, 50, 85, 65, 45, 90, 70, 50].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(i % 4) * 0.18}s`,
                    }}
                    className="w-1 bg-red-400 rounded-full sound-bar transition-all"
                  ></span>
                ))}
              </div>
            )}

            {/* Transcribing state */}
            {isTranscribing && (
              <div className="flex items-center space-x-2 mt-10 text-xs font-medium text-indigo-300 bg-indigo-950/60 px-4 py-2 rounded-xl border border-indigo-800/50 shadow-md">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Processing speech clarity & pronunciation...</span>
              </div>
            )}
          </div>

          {/* Microphone error */}
          {micError && (
            <div className="flex items-center space-x-2 p-3.5 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{micError}</span>
            </div>
          )}

          {/* Live Detected Spoken Language & Transcript Preview */}
          {(textAnswer || transcriptionResult || isRecording) && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-fadeIn">
              {/* Spoken Language Detection Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Spoken Language:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {targetLanguage}
                  </span>
                </div>

                {transcriptionResult?.pronunciation_score && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ✨ Speech Clarity: {transcriptionResult.pronunciation_score}/100
                  </span>
                )}
              </div>

              {/* Editable Transcription Box */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Transcribed Speech ({targetLanguage}):
                </label>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={`Spoken words in ${targetLanguage} will appear here...`}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTextAnswer('');
                    setTranscriptionResult(null);
                    setErrorMessage(null);
                    resetRecording();
                  }}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-record Voice</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!textAnswer.trim() || isEvaluating}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Fallback Mode */}
      {inputMode === 'text' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder={`Type your response in ${targetLanguage}...`}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none h-28"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Answer directly in {targetLanguage} using full sentences.
            </span>

            <button
              type="submit"
              disabled={!textAnswer.trim() || isEvaluating}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
