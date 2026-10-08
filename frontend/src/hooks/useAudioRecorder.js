import { useState, useRef, useCallback, useEffect } from 'react';

const BROWSER_LANG_MAP = {
  Spanish: 'es-ES',
  Telugu: 'te-IN',
  Hindi: 'hi-IN',
  French: 'fr-FR',
  German: 'de-DE',
  Japanese: 'ja-JP',
  English: 'en-US',
};

export const useAudioRecorder = (targetLanguage = 'English') => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Initialize Speech Recognition if supported
  const startSpeechRecognition = useCallback((langName) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = BROWSER_LANG_MAP[langName] || 'en-US';

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(currentText.trim());
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition error (will rely on Whisper):', e.error);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(200); // 200ms chunks
      setIsRecording(true);
      setRecordingDuration(0);

      // Start live speech recognition
      startSpeechRecognition(targetLanguage);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setError('Microphone permission denied or device unavailable. You can type your answer below.');
      setIsRecording(false);
    }
  }, [targetLanguage, startSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopSpeechRecognition();
  }, [isRecording, stopSpeechRecognition]);

  const resetRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setLiveTranscript('');
    setRecordingDuration(0);
    setError(null);
    audioChunksRef.current = [];
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeechRecognition();
    };
  }, [stopSpeechRecognition]);

  return {
    isRecording,
    recordingDuration,
    audioBlob,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
};
