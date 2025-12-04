'use client';

import { useRef, useState, useEffect } from 'react';
//import Lottie from 'lottie-react';
//import braaiAnimation from '../animations/braai-flames.json';  // Add a Lottie file or use placeholder

type Message = { role: 'user' | 'assistant'; content: string };

type Props = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onClose: () => void;
};

export default function ShopVoxModal({ messages, setMessages, onClose }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const recognitionRef = useRef<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    const res = await fetch('/api/grok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    // Stream response (add to messages as it comes – stub for now)
    setMessages(prev => [...prev, { role: 'assistant', content: 'Lekker! Processing your braai...' }]);
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      alert('Mic needed – allow in settings!');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert('Voice not supported');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-ZA';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      if (event.results[event.results.length - 1].isFinal) {
        sendMessage(transcript);
      }
    };

    recognition.onerror = (e: any) => console.error('Speech error:', e.error);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const addToCart = (item: any) => {
    setCart(prev => [...prev, item]);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);
  };

  useEffect(() => {
    // Load cart from storage
    const saved = sessionStorage.getItem('shopvox-cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('shopvox-cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-4xl">✕</button>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all ${
              isListening ? 'bg-red-600 animate-pulse' : 'bg-orange-600'
            }`}
          >
            {isListening ? '🔴' : '🎤'}
          </button>
        </div>
        {/*showAnimation && (
          <Lottie animationData={braaiAnimation} loop={false} className="w-32 h-32 mx-auto" />
        )*/}
        {cart.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h3 className="font-bold">Trolley (R{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)})</h3>
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>R{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <button className="w-full mt-2 bg-green-600 text-white p-2 rounded">Face ID Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}