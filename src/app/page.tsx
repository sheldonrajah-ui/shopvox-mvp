'use client';

import { useState } from 'react';
import ShopVoxModal from '@/components/ShopVoxModal';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">ShopVox Demo</h1>
          <p className="text-xl mb-10">Tap the mic orb and say: "braai for 8 mates"</p>

          {/* Floating Orb Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 w-20 h-20 bg-orange-600 rounded-full shadow-2xl flex items-center justify-center text-4xl hover:scale-110 transition-all z-40"
          >
            🎤
          </button>
        </div>
      </div>

      {/* Modal with ALL required props */}
      {isOpen && (
        <ShopVoxModal
          messages={messages}
          setMessages={setMessages}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}