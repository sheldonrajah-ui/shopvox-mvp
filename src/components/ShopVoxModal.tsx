'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/cache';   

import type { Dispatch, SetStateAction } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;  
  onClose: () => void;
}











async function cacheOfflineVoice() {
  if (localStorage.getItem('offline-voice')) return;

  const text = "No signal bru, here's what I've got saved for you.";
  const form = new FormData();
  form.append('action', 'tts');
  form.append('text', text);
  form.append('voice_id', 'pNInz6obpgDQGcFmaJgB');

  try {
    const res = await fetch('/api/eleven', { method: 'POST', body: form });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    localStorage.setItem('offline-voice', url);
  } catch (e) {
    // silently fail – we’ll use browser voice
  }
}













// Play cached ElevenLabs voice when offline
function speakOffline(text: string) {
  const cachedUrl = localStorage.getItem('offline-voice');
  if (cachedUrl) {
    new Audio(cachedUrl).play();
  } else {
    // Fallback to browser voice (still works offline)
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-ZA';
    speechSynthesis.speak(utter);
  }
}







// Run when the phone gets internet again
useEffect(() => {
  const handleOnline = () => {
    console.log("Back online – caching offline voice");
    cacheOfflineVoice();
  };

  window.addEventListener('online', handleOnline);
  
  // Also try once when component loads (in case already online)
  if (navigator.onLine) cacheOfflineVoice();

  return () => window.removeEventListener('online', handleOnline);
}, []);
































export default function ShopVoxModal({ messages, setMessages, onClose }: Props) {
  
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


  // ── Silence detection (stops recording after ~1.5 seconds of quiet) ──
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = Date.now();

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (volume < 15) { // very quiet
          if (Date.now() - silenceStart > 1500) { // 1.5 seconds of silence
            mediaRecorder.stop();
            return;
          }
        } else {
          silenceStart = Date.now(); // reset timer when speaking
        }
        if (mediaRecorder.state === 'recording') requestAnimationFrame(checkSilence);
      };
      checkSilence();

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
            { role: 'assistant', content: "Sorry bro, didn't catch that – try again?" },
          ]);
          setIsListening(false);
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const transcript = sttData.text.trim();
        setLiveTranscript('');
        setMessages((prev) => [...prev, { role: 'user', content: transcript }]);




        // ─────── 2. Grok gets the transcript ───────
        let reply = "Eish, something went wrong…";

        try {
          const grokRes = await fetch('/api/grok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: transcript,
              metadata: { accent: sttData.language || 'en-ZA' },
            }),
          });

          if (!grokRes.ok) throw new Error('Grok failed');

          const data = await grokRes.json();
          reply = data.reply || "Didn't quite catch that, bro – try again?";
        } catch (err) {
          // ←←←←←←←←←←←← OFFLINE FALLBACK STARTS HERE ←←←←←←←←←←←←
          console.log('No internet – switching to offline cache');
          const cached = await getProducts();

          if (cached && cached.length > 0) {
            reply = `No signal, bro – here’s what I’ve got saved:\n\n` +
                    cached.slice(0, 4)
                          .map(p => `• ${p.name} – R${p.price}`)
                          .join('\n') +
                    `\n\nI’ll get you the fresh deals when you’re back online!`;

            // Optional: play a real offline voice (see next step)
            speakOffline(reply);
          } else {
            reply = "No signal and no products saved yet – try again when you’re online!";
          }
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      
        
        
        
        
        
        
        
        
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
      setTimeout(() => mediaRecorder.state === 'recording' && mediaRecorder.stop(), 12000);





    } catch (err) {
      console.error('Mic error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Microphone blocked – please allow it and try again.' },
      ]);
      setIsListening(false);
    }
  };

  
  
  
  useEffect(() => {
  startRecording();

  // Cache the real voice the first time we have internet
  if (navigator.onLine) {
    cacheOfflineVoice();
  }

  // Also listen for when internet comes back
  const handleOnline = () => cacheOfflineVoice();
  window.addEventListener('online', handleOnline);

  return () => window.removeEventListener('online', handleOnline);
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