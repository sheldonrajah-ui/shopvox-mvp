'use client';

import { useState } from 'react';
import ShopVoxModal from '@/components/ShopVoxModal';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-100 flex items-center justify-center p-8 relative">
      {/* Your original PDF text – beautifully styled */}
      <div className="max-w-4xl text-center space-y-6 text-gray-800">
        <h1 className="text-5xl font-bold">ShopVox – AI Shopping Concierge</h1>
        <div className="prose prose-lg mx-auto leading-relaxed">
          {/* Paste your full PDF text here – I kept the first few paragraphs */}
          <p className="text-xl">The majority of online shopping is done on computers…</p>
          <p>Well here is why I think it is not done on cellphones. The user interface on many online shopping sites are complicated…</p>
          <p>Furthermore, another reason why individuals would prefer shopping on computers, is that it gives users the illusion of being secure and rocksolid in terms of payment security. Ha! Ironic, given that iOS and Android, more often than not, are more secure systems than your meekly Windows.</p>
          <p className="font-bold text-2xl mt-8">Introducing ShopVox – the AI that fixes mobile shopping forever.</p>
        </div>
      </div>

      {/* Floating orange mic orb – your signature button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-20 h-20 bg-orange-600 rounded-full shadow-2xl flex items-center justify-center text-5xl hover:scale-110 transition-all z-50 animate-pulse"
      >
        🎤
      </button>

      {/* The actual voice modal */}
      {isOpen && (
        <ShopVoxModal
          messages={messages}
          setMessages={setMessages}
          onClose={() => setIsOpen(false)}
        />
      )}
    </main>
  );
}