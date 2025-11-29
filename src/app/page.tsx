'use client';

import { useState } from 'react';
import ShopVoxModal from '@/components/ShopVoxModal';
import FloatingButton from '@/components/FloatingButton';

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white p-8">
        <div className="text-center">
          <h1 className="text-7xl font-black text-orange-600 mb-6">ShopVox 🔥</h1>
          <p className="text-2xl text-gray-700">The braai master that closes sales</p>
          <p className="text-lg text-gray-600 mt-4">Tap the orange button → allow mic → talk to me bru</p>
        </div>
      </main>

      <FloatingButton onClick={() => setIsOpen(true)} />
      {isOpen && <ShopVoxModal onClose={() => setIsOpen(false)} />}
    </>
  );
}