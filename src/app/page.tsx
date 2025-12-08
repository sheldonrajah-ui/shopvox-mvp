'use client';

import { useState } from 'react';
import ShopVoxModal from '@/components/ShopVoxModal';
import FloatingButton from '@/components/FloatingButton';

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-100 flex items-center justify-center p-8 relative">
      {/* Your beautiful PDF text */}
      <div className="max-w-4xl text-center space-y-6 text-red-800">
        <h1 className="text-5xl font-bold">ShopVox – AI Shopping Concierge</h1>
        <div className="prose prose-lg mx-auto leading-relaxed">
          <p className="text-xl">The majority of online shopping is done on computers…</p>
          {/* … rest of your PDF copy … */}
          <p className="font-bold text-2xl mt-8">Introducing ShopVox – the AI that fixes mobile shopping forever.</p>
        </div>
      </div>

      {/* Floating button only opens the modal */}
      <FloatingButton onClick={() => setIsOpen(true)} />

      {/* The modal now owns ALL voice logic */}
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