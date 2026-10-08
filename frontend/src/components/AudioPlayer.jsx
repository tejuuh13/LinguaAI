import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export const AudioPlayer = ({ text, language = 'English', label = 'Listen', size = 'md', className = '' }) => {
  const { speak, stop, isSpeaking, isSupported } = useSpeechSynthesis();

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center space-x-2 rounded-xl font-medium transition-all ${
        isSpeaking
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
          : 'bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 shadow-sm'
      } ${
        isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'
      } ${className}`}
      title={isSpeaking ? 'Stop audio' : `Read aloud in ${language}`}
    >
      {isSpeaking ? (
        <>
          <div className="flex items-center space-x-0.5">
            <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce"></span>
            <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span>Playing...</span>
        </>
      ) : (
        <>
          <Volume2 className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          <span>🔊 {label}</span>
        </>
      )}
    </button>
  );
};
