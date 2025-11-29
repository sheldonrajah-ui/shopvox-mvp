'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import the Lottie player ONLY on the client (this kills the document error)
const Lottie = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), {
  ssr: false,
});

export default function ShopVoxModal({ onClose }: { onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);

  // Braai master greeting – plays automatically when modal opens
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance('Yo yo yo! ShopVox in the house bru! What are we buying today?');
      utter.rate = 0.95;
      utter.pitch = 0.9;
      // Try get a South-African-ish voice
      const voices = window.speechSynthesis.getVoices();
      const saVoice = voices.find(v => v.lang.includes('en-ZA') || v.lang.includes('en_AU'));
      if (saVoice) utter.voice = saVoice;
      window.speechSynthesis.speak(utter);
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.5, rotate: 20 }}
          className="relative w-96 max-w-full rounded-3xl bg-white p-8 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Lottie Braai Master – only renders in browser */}
          <Lottie
            loop
            autoplay
            src="https://lottie.host/your-braai-master-animation.json" // ← replace with real one later
            style={{ width: '280px', height: '280px', margin: '0 auto' }}
          />

          <h2 className="mt-6 text-center text-3xl font-black text-orange-600">
            ShopVox 🔥
          </h2>
          <p className="mt-4 text-center text-lg text-gray-700">
            {isListening ? 'Listening bru… speak now!' : 'Tap the mic & talk to me'}
          </p>

          <button
            onClick={() => setIsListening(!isListening)}
            className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-orange-600 text-5xl text-white shadow-xl active:scale-95"
          >
            {isListening ? '🔴' : '🎤'}
          </button>

          <button
            onClick={onClose}
            className="mt-8 block w-full rounded-xl bg-gray-200 py-4 font-bold text-gray-800"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}