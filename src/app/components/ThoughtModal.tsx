// src/app/components/ThoughtModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveThought: (thoughtText: string) => void;
}

export default function ThoughtModal({ isOpen, onClose, onSaveThought }: ThoughtModalProps) {
  const [thought, setThought] = useState('');

  const handleSave = () => {
    if (thought.trim()) {
      onSaveThought(thought.trim());
      setThought(''); // Clear textarea after saving
      onClose();
    }
  };

  // Clear the thought when the modal is closed without saving
  useEffect(() => {
    if (!isOpen) {
      setThought('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose} // Close modal on backdrop click
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-gray-800/50 border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 w-[90vw] max-w-lg shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Capture a Fleeting Thought</h2>
            <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">Jot it down and return to your focus. You can review it later.</p>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="What's on your mind? e.g., 'Email Mr. Sharma...'"
              className="w-full h-24 sm:h-32 p-3 sm:p-4 bg-black/30 rounded-lg text-white/90 placeholder:text-white/40 focus:ring-2 focus:ring-white/50 focus:outline-none transition-shadow text-sm sm:text-base resize-none"
              maxLength={500}
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2 bg-gray-500/50 rounded-lg hover:bg-gray-500/80 transition-colors duration-150 active:scale-95 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 sm:px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-150 active:scale-95 text-sm sm:text-base order-1 sm:order-2"
              >
                Save Thought
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}