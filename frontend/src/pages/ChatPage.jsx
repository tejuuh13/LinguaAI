import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, Lightbulb, Loader2 } from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { sendTutorChatMessage } from '../services/api';

export const ChatPage = ({ session }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your AI Language Tutor for ${session?.language || 'English'}. What would you like to discuss or practice today?`,
      correction: null,
      grammarHint: null,
      suggestedFollowups: [
        session?.language === 'Spanish' ? 'Hola, me gustaría practicar sobre mis viajes.' : 'Hello, I want to talk about my daily routine.',
        session?.language === 'Spanish' ? '¿Podrías enseñarme verbos en pasado?' : 'Can you explain the past tense?',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const data = await sendTutorChatMessage({
        language: session?.language || 'English',
        level: session?.level || 'Intermediate',
        goal: session?.goal || 'Daily Conversation',
        message: text,
        history: newHistory.map((m) => ({ role: m.role, content: m.content })),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          correction: data.correction,
          grammarHint: data.grammar_hint,
          suggestedFollowups: data.suggested_followups || [],
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I understood you! Let's continue practicing in ${session?.language || 'English'}.`,
          suggestedFollowups: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSubmit = ({ response }) => {
    handleSendMessage(response);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4 animate-fadeIn flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>AI Tutor Live Conversation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Practicing in <strong className="text-indigo-300">{session?.language}</strong> • {session?.level}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 px-1">
              {m.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-indigo-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span>AI Tutor</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-100 shadow-md'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

              {/* Read Aloud */}
              {m.role === 'assistant' && (
                <div className="pt-1">
                  <AudioPlayer
                    text={m.content}
                    language={session?.language || 'English'}
                    label="Listen"
                    size="sm"
                  />
                </div>
              )}

              {/* Inline Grammar Correction */}
              {m.correction && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs space-y-1">
                  <div className="flex items-center space-x-1 text-emerald-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Correction Suggestion:</span>
                  </div>
                  <p className="text-emerald-200 font-medium">"{m.correction}"</p>
                  {m.grammarHint && <p className="text-slate-400 text-[11px]">{m.grammarHint}</p>}
                </div>
              )}

              {/* Follow-up suggestion pills */}
              {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {m.suggestedFollowups.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleSendMessage(sug)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 transition-colors"
                    >
                      💡 {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-950 p-3 rounded-xl border border-slate-800 w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI Tutor is formulating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area: Voice & Text */}
      <div className="space-y-3 shrink-0">
        <VoiceRecorder
          targetLanguage={session?.language || 'English'}
          onSubmitAnswer={handleVoiceSubmit}
          isEvaluating={loading}
          suggestedStarter=""
        />
      </div>
    </div>
  );
};
