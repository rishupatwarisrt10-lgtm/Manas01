// src/app/components/ThoughtList.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Thought {
  _id?: string;
  text: string;
  timestamp?: string;
  isCompleted?: boolean;
}

interface ThoughtListProps {
  thoughts: Thought[];
  onThoughtDelete?: (thoughtId: string) => Promise<void>;
  onToggleComplete?: (thoughtId: string) => Promise<void>;
  onReorderThoughts?: (startIndex: number, endIndex: number) => void;
}

export default function ThoughtList({ thoughts, onThoughtDelete, onToggleComplete, onReorderThoughts }: ThoughtListProps) {
  const [processingThoughts, setProcessingThoughts] = useState<Set<string>>(new Set());

  // If there are no thoughts, render nothing.
  if (thoughts.length === 0) {
    return null;
  }

  const handleToggleComplete = async (thought: Thought) => {
    if (!thought._id || processingThoughts.has(thought._id)) return;
    
    setProcessingThoughts(prev => new Set(prev).add(thought._id!));
    
    try {
      await onToggleComplete?.(thought._id);
    } catch (error) {
      console.error('Failed to toggle thought completion:', error);
    } finally {
      setProcessingThoughts(prev => {
        const newSet = new Set(prev);
        newSet.delete(thought._id!);
        return newSet;
      });
    }
  };

  const handleDeleteThought = async (thought: Thought) => {
    if (!thought._id || processingThoughts.has(thought._id)) {
      console.warn('Cannot delete thought - invalid ID or already processing:', { id: thought._id, thought });
      return;
    }
    
    console.log('Deleting thought:', { id: thought._id, text: thought.text });
    
    setProcessingThoughts(prev => new Set(prev).add(thought._id!));
    
    try {
      await onThoughtDelete?.(thought._id);
      console.log('Thought deleted successfully');
    } catch (error) {
      console.error('Failed to delete thought:', error);
    } finally {
      setProcessingThoughts(prev => {
        const newSet = new Set(prev);
        newSet.delete(thought._id!);
        return newSet;
      });
    }
  };

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl mt-6 sm:mt-8">
      <h3 className="text-base sm:text-lg font-semibold text-white/80 mb-3 text-center">Captured Thoughts</h3>
      {thoughts.length > 1 && (
        <p className="text-xs text-white/50 text-center mb-3">✨ Smoothly drag thoughts up/down to reorder them</p>
      )}
      <div className="bg-white/10 p-3 sm:p-4 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 max-h-48 sm:max-h-64 overflow-y-auto scrollbar-custom">
        <style jsx>{`
          .scrollbar-custom::-webkit-scrollbar {
            width: 12px;
          }
          .scrollbar-custom::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            border: 2px solid transparent;
            background-clip: content-box;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
            background-clip: content-box;
          }
        `}</style>
        <ul className="space-y-2 sm:space-y-3">
          <AnimatePresence>
            {thoughts.map((thought, index) => {
              const isProcessing = thought._id && processingThoughts.has(thought._id);
              const isCompleted = thought.isCompleted;
              
              return (
                <motion.li
                  key={thought._id || index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: isProcessing ? 0.5 : 1, 
                    y: 0,
                    scale: 1,
                    rotate: 0,
                    transition: { type: "spring", stiffness: 300, damping: 25 }
                  }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  dragMomentum={false}
                  dragTransition={{ bounceStiffness: 300, bounceDamping: 40 }}
                  onDragStart={() => {
                    // Add haptic feedback if supported
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  onDragEnd={(event, info) => {
                    const threshold = 25;
                    const velocity = Math.abs(info.velocity.y);
                    const offset = info.offset.y;
                    
                    // Consider both offset and velocity for more responsive reordering
                    if ((Math.abs(offset) > threshold || velocity > 300) && onReorderThoughts) {
                      const newIndex = offset > 0 
                        ? Math.min(index + 1, thoughts.length - 1)
                        : Math.max(index - 1, 0);
                      if (newIndex !== index) {
                        onReorderThoughts(index, newIndex);
                      }
                    }
                  }}
                  whileDrag={{ 
                    scale: 1.08, 
                    zIndex: 10, 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    rotate: Math.random() * 4 - 2 // Subtle random rotation
                  }}
                  layout
                  layoutId={thought._id || `thought-${index}`}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30, duration: 0.6 },
                    default: { type: "spring", stiffness: 300, damping: 25 }
                  }}
                  className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/20 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    
                    {/* Drag Handle */}
                    <motion.div 
                      className="flex flex-col gap-1 text-white/40 cursor-grab active:cursor-grabbing mr-2 p-1 rounded"
                      whileHover={{ scale: 1.1, color: 'rgba(255,255,255,0.6)' }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                    </motion.div>
                    
                    {/* CHECKBOX - Mark as dealt with */}
                    <button
                      onClick={() => handleToggleComplete(thought)}
                      disabled={isProcessing || !thought._id}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500 border-green-400 text-white'
                          : 'bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/60'
                      }`}
                      title={isCompleted ? 'Mark as not dealt with' : 'Mark as dealt with'}
                    >
                      {isCompleted ? '✓' : '□'}
                    </button>
                    
                    {/* THOUGHT TEXT */}
                    <span className={`flex-1 text-white/90 text-sm sm:text-base min-w-0 break-words ${
                      isCompleted ? 'line-through opacity-60' : ''
                    }`}>
                      {thought.text}
                    </span>
                    
                    {/* DELETE BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteThought(thought);
                      }}
                      disabled={isProcessing || !thought._id}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/30 border-2 border-red-400/50 flex items-center justify-center text-white font-bold text-sm sm:text-lg hover:bg-red-500/50 hover:border-red-400 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete this thought"
                    >
                      ✕
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}