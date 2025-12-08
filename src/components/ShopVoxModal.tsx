'use client';

import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ShopVoxModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('Listening…');
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  // You can change this voice ID any time in ElevenLabs dashboard
  const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam – great South African-ish voice

  const startRecording = async () => {
    setIsListening(true);
    setLiveTranscript('Listening…');
    setMessages([]); // optional: clear old conversation

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });

        // ─────── 1. Secure STT via our own /api/eleven route ───────
        const sttForm = new FormData();
        sttForm.append('action', 'stt');
        sttForm.append('audio', audioBlob, 'query.webm');

        const sttRes = await fetch('/api/eleven', {
          method: 'POST',
          body: sttForm,
        });

        const sttData = await sttRes.json();

        if (!sttData.text?.trim()) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: "Sorry bru, didn't catch that – try again?" },
          ]);
          setIsListening(false);
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const transcript = sttData.text.trim();
        setLiveTranscript('');
        setMessages((prev) => [...prev, { role: 'user', content: transcript }]);

        // ─────── 2. Grok gets the transcript (and optional accent info) ───────
        const grokRes = await fetch('/api/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: transcript,
            metadata: { accent: sttData.language || 'en-ZA' },
          }),
        });
        const { reply } = await grokRes.json();

        setMessages((prev) => [...prev, { role: 'assistant', content: reply || 'Eish, no reply…' }]);

        // ─────── 3. Secure TTS via our own /api/eleven route ───────
        const ttsForm = new FormData();
        ttsForm.append('action', 'tts');
        ttsForm.append('text', reply);
        ttsForm.append('voice_id', VOICE_ID);

        const ttsRes = await fetch('/api/eleven', {
          method: 'POST',
          body: ttsForm,
        });

        const audioBlobTts = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(audioBlobTts);
        new Audio(audioUrl).play();

        setIsListening(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);

      // Auto-stop after 12 seconds (perfect length for shopping queries)
      setTimeout(() => mediaRecorder.stop(), 12000);
    } catch (err) {
      console.error('Mic error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Microphone blocked – please allow it and try again.' },
      ]);
      setIsListening(false);
    }
  };

  // Auto-start listening the moment the modal opens
  useEffect(() => {
    startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold"
        >
          ×
        </button>

        <h2 className="text-3xl font-bold text-center mb-6 text-orange-600">
          Hey Vox, what can I get you?
        </h2>

        {isListening && (
          <div className="text-center text-red-600 font-bold animate-pulse text-xl mb-4">
            {liveTranscript}
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl max-w-xs ${
                m.role === 'user'
                  ? 'bg-orange-100 ml-auto text-right'
                  : 'bg-gray-100 mr-auto text-left'
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <button
          onClick={startRecording}
          disabled={isListening}
          className="w-full py-5 bg-orange-600 text-white rounded-xl font-bold text-xl hover:bg-orange-700 disabled:opacity-50 transition"
        >
          {isListening ? 'Recording… (12s)' : 'Tap to speak again'}
        </button>
      </div>
    </div>
  );
}