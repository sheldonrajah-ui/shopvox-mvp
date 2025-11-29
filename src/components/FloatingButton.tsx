import { motion } from 'framer-motion';

export default function FloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 flex h-20 w-20 items-center justify-center rounded-full bg-orange-600 text-white shadow-2xl"
      whileTap={{ scale: 0.9 }}
      animate={{ y: [0, -15, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <span className="text-5xl">🔥</span>
    </motion.button>
  );
}