'use client';

import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  onClose: () => void;
}

export default function ShopVoxModal({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // This is the proper startVoice function – now lives here
  const startVoice = async () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Voice not supported on this browser – try Chrome/Edge');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-ZA';

    recognition.onstart = () => setIsListening(true);

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied – please allow it in your browser settings');
      }
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
    let currentTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
         const result = event.results[i];
    if (result.isFinal) {
      // FINAL: Append to chat once, clean
      const finalText = Array.from(result)
        .map(alt => alt.transcript)
        .join(' ');
      setTranscript(''); // Clear preview
      setMessages(prev => [...prev, { role: 'user', content: finalText.trim() }]);
      
      // Grok ping + TTS (unchanged)
      try {
        const res = await fetch('/api/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalText.trim() }),
        });
        const data = await res.json();
        const assistantReply = data.reply || "Hmm, didn't quite catch that – try again?";
        setMessages(prev => [...prev, { role: 'assistant', content: assistantReply }]);
        
        const utter = new SpeechSynthesisUtterance(assistantReply);
        utter.lang = 'en-ZA';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Network error – try again?' }]);
      }
    } else {
      // INTERIM: Live preview only (no chat spam) – stitch all non-finals
      currentTranscript += Array.from(result)
        .map(alt => alt.transcript)
        .join(' ');
      setTranscript(currentTranscript); // Updates preview div
    }
  }
};          

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Auto-start listening when modal opens (feels magical)
  useEffect(() => {
    startVoice();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
        >
          Close
        </button>

        <h2 className="text-3xl font-bold text-center mb-6">Hey Vox, what can I get you?</h2>

        {isListening && (
          <div className="text-center text-red-600 font-bold animate-pulse text-xl mb-4">
            Listening… speak now
          </div>
        )}

        {transcript && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4 italic text-sm">
          Live: {transcript}...
          </div>
          )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl ${
                msg.role === 'user' ? 'bg-orange-100 ml-auto max-w-xs' : 'bg-gray-100 mr-auto max-w-md'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Manual retry button */}
        <button
          onClick={startVoice}
          className="mt-6 w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-xl hover:bg-orange-700 transition"
        >
          {isListening ? 'Listening…' : 'Tap to speak again'}
        </button>
      </div>
    </div>
  );
}