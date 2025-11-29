'use client';

import { useEffect, useRef, useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion } from 'framer-motion';

export default function ShopVoxModal({ onClose }: { onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('Hey bru! What can I get for you today? 🔥');
  const recognitionRef = useRef<any>(null);

  // Avatar that talks: https://lottiefiles.com/animations/braai-master
  const avatarJson = 'https://assets1.lottiefiles.com/packages/lf20_5rImXb.json';

  useEffect(() => {
    // Web Speech API setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-ZA'; // South African English 🔥

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          setTranscript(`You: ${last[0].transcript}\nShopVox: Sharp bru, let me sort that for you!`);
          speak(`Sharp bru, I'm adding that to your trolley right now!`);
        }
      };
    }

    // Initial greeting
    speak('Yo yo yo, ShopVox in the house! What are we buying today my bru?');
  }, []);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-ZA';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-80"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="relative flex w-full max-w-2xl flex-col rounded-t-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4 text-4xl">✕</button>

        {/* Avatar */}
        <Player autoplay loop src={avatarJson} style={{ height: '280px' }} />

        {/* Transcript */}
        <div className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-gray-100 p-4 font-medium">
          {transcript}
        </div>

        {/* Mic button */}
        <button
          onClick={toggleListening}
          className={`mt-6 flex h-20 w-20 items-center justify-center self-center rounded-full shadow-2xl transition-all ${
            isListening ? 'animate-pulse bg-red-600' : 'bg-orange-600'
          }`}
        >
          <span className="text-5xl">{isListening ? '🎙️' : '🎤'}</span>
        </button>
        <p className="mt-3 text-center text-sm text-gray-600">
          {isListening ? 'I\'m listening bru…' : 'Tap & talk to me'}
        </p>
      </motion.div>
    </motion.div>
  );
}