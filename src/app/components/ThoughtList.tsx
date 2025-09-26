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
  onThoughtComplete?: (thoughtId: string) => Promise<void>;
  onThoughtDelete?: (thoughtId: string) => Promise<void>;
  onToggleComplete?: (thoughtId: string) => Promise<void>;
}

export default function ThoughtList({ thoughts, onThoughtComplete, onThoughtDelete, onToggleComplete }: ThoughtListProps) {
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
    if (!thought._id || processingThoughts.has(thought._id)) return;
    
    setProcessingThoughts(prev => new Set(prev).add(thought._id!));
    
    try {
      await onThoughtDelete?.(thought._id);
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
      <div className="bg-white/10 p-3 sm:p-4 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 max-h-48 sm:max-h-64 overflow-y-auto">
        <ul className="space-y-2 sm:space-y-3">
          <AnimatePresence>
            {thoughts.map((thought, index) => {
              const isProcessing = thought._id && processingThoughts.has(thought._id);
              const isCompleted = thought.isCompleted;
              
              return (
                <motion.li
                  key={thought._id || index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: isProcessing ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/20"
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    
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
                      onClick={() => handleDeleteThought(thought)}
                      disabled={isProcessing || !thought._id}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/30 border-2 border-red-400/50 flex items-center justify-center text-white font-bold text-sm sm:text-lg hover:bg-red-500/50 hover:border-red-400 flex-shrink-0"
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