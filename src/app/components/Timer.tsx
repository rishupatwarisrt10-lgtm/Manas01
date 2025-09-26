// src/app/components/Timer.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PomodoroMode } from '@/hooks/usePomodoro';
import { soundManager } from '@/utils/sounds';

// Helper function to format time from seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface TimerProps {
  mode: PomodoroMode;
  timeRemaining: number;
  durations: { focus: number; shortBreak: number; longBreak: number };
  updateDuration: (mode: PomodoroMode, minutes: number) => void;
}

export default function Timer({ mode, timeRemaining, durations, updateDuration }: TimerProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  // Local state to manage the input value before saving
  const [newDuration, setNewDuration] = useState(durations[mode] / 60);

  // Initialize sound manager and sync sound state
  useEffect(() => {
    soundManager.initialize();
    setIsSoundEnabled(soundManager.isEnabledStatus());
  }, []);

  const toggleSound = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    
    if (newSoundState) {
      soundManager.enable();
      // Play a test sound to confirm it's working
      soundManager.playTimerStart();
    } else {
      soundManager.disable();
    }
  };

  const handleSave = () => {
    updateDuration(mode, newDuration);
    setIsSettingsOpen(false);
  };

  const handleTimerClick = () => {
    // When opening settings, sync the input with the current mode's duration
    setNewDuration(durations[mode] / 60);
    setIsSettingsOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 text-center transition-all duration-300 relative mx-auto"
    >
      
      {/* Sound Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleSound}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-150 active:scale-90"
        title={isSoundEnabled ? 'Disable sounds' : 'Enable sounds'}
      >
        {isSoundEnabled ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.817L4.05 13.06a1 1 0 01-.383-.787V7.727a1 1 0 01.383-.787L8.383 3.183a1 1 0 011 0z" clipRule="evenodd" />
            <path d="M12 6.75a.75.75 0 011.5 0V9.5a.75.75 0 01-1.5 0V6.75z" />
            <path d="M15 5.25a.75.75 0 011.5 0V11a.75.75 0 01-1.5 0V5.25z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.817L4.05 13.06a1 1 0 01-.383-.787V7.727a1 1 0 01.383-.787L8.383 3.183a1 1 0 011 0z" clipRule="evenodd" />
            <path d="M14.293 7.293a1 1 0 011.414 0L17 8.586l1.293-1.293a1 1 0 111.414 1.414L18.414 10l1.293 1.293a1 1 0 01-1.414 1.414L17 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L15.586 10l-1.293-1.293a1 1 0 010-1.414z" />
          </svg>
        )}
      </motion.button>
      
      {/* Settings View */}
      {isSettingsOpen ? (
        <div className="flex flex-col items-center px-2">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">Set Duration for <span className="capitalize">{mode}</span> (minutes)</h3>
          <input
            type="number"
            value={newDuration}
            onChange={(e) => setNewDuration(Number(e.target.value))}
            className="w-24 sm:w-32 text-center bg-black/30 text-white text-2xl sm:text-3xl font-bold rounded-lg p-2 mb-3 sm:mb-4"
          />
          <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => setIsSettingsOpen(false)} 
              className="px-4 sm:px-6 py-2 bg-gray-500/50 rounded-lg hover:bg-gray-500/80 transition-colors duration-150 active:scale-95 text-sm sm:text-base"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={handleSave} 
              className="px-4 sm:px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-150 active:scale-95 text-sm sm:text-base"
            >
              Save
            </motion.button>
          </div>
        </div>
      ) : (
        
        /* Default Timer View */
        <div onClick={handleTimerClick} className="cursor-pointer group px-2">
          <p className="text-lg sm:text-xl capitalize mb-1 sm:mb-2 tracking-widest opacity-80">{mode}</p>
          <p className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-mono font-bold mb-2 sm:mb-4 transition-transform duration-300 group-hover:scale-105 leading-none">
            {formatTime(timeRemaining)}
          </p>
          <p className="text-xs sm:text-sm opacity-50 group-hover:opacity-100 transition-opacity px-2">Click to edit duration</p>
        </div>
      )}
    </motion.div>
  );
}