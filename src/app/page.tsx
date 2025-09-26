// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppContext } from '@/context/AppContext';
import usePomodoro from "@/hooks/usePomodoro";
import dynamic from 'next/dynamic';
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/app/components/Layout";
import Timer from "@/app/components/Timer";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { preloadCriticalComponents } from '@/utils/prefetch';

// Only lazy load non-critical components that aren't needed immediately
const ThoughtCatcher = dynamic(() => import("@/app/components/ThoughtCatcher"), {
  ssr: false,
});

const ThoughtModal = dynamic(() => import("@/app/components/ThoughtModal"), {
  ssr: false,
});

const TaskList = dynamic(() => import("@/app/components/ThoughtList"), {
  loading: () => <div className="bg-white/10 p-4 rounded-2xl animate-pulse h-32"></div>,
});

const FloatingNavbar = dynamic(() => import("@/app/components/FloatingNavbar"), {
  ssr: false,
});

export default function Home() {
  const { data: session } = useSession();
  
  // Preload critical components for faster navigation
  useEffect(() => {
    preloadCriticalComponents();
  }, []);
  
  // If not authenticated, show landing page
  if (!session) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center p-4 pt-20 lg:pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl text-center px-4"
        >
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6"
          >
            Manas
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl text-white/80 mb-6 sm:mb-8"
          >
            The Mindful Pomodoro
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-base sm:text-lg text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            A sanctuary for deep focus and mindful productivity. Combine the power of the Pomodoro Technique with mindful thought capturing to transform your work sessions into moments of clarity and purpose.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href="/auth/register"
              className="w-full sm:w-auto inline-block bg-white text-gray-900 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-white/90 transition-colors duration-200 text-center min-w-[140px]"
            >
              Get Started
            </Link>
            <Link 
              href="/auth/login"
              className="w-full sm:w-auto inline-block bg-white/20 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg border border-white/30 hover:bg-white/30 transition-colors duration-200 text-center min-w-[140px]"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { 
    mode, 
    timeRemaining, 
    isActive, 
    durations,
    startStop, 
    resetTimer,
    switchMode,
    updateDuration
  } = usePomodoro();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addThought, thoughts, sessionsCompleted, completeThought, removeThought, toggleTaskComplete } = useAppContext();

  const handleSaveThought = async (thoughtText: string) => {
    await addThought(thoughtText, {
      mode,
      sessionNumber: sessionsCompleted + 1,
    });
    setIsModalOpen(false);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-start h-full min-h-0 py-4 sm:py-6 md:py-8">
        
        <Timer 
          mode={mode}
          timeRemaining={timeRemaining}
          durations={durations}
          updateDuration={updateDuration}
        />

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm">
          <button 
            onClick={startStop} 
            className="flex-1 px-8 sm:px-12 py-3 sm:py-4 bg-black/80 text-white border border-white/30 rounded-lg font-semibold text-base sm:text-lg hover:bg-black/90 transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button 
            onClick={resetTimer} 
            className="flex-none px-6 sm:px-8 py-3 sm:py-4 bg-gray-500/30 text-white rounded-lg font-semibold hover:bg-gray-500/50 transition-colors duration-150 active:scale-[0.98] text-base sm:text-lg"
          >
            Reset
          </button>
        </div>

        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
            <button onClick={() => switchMode('focus')} className="text-sm sm:text-base opacity-60 hover:opacity-100 transition-opacity duration-150 active:scale-95 px-2 py-1">Focus</button>
            <button onClick={() => switchMode('shortBreak')} className="text-sm sm:text-base opacity-60 hover:opacity-100 transition-opacity duration-150 active:scale-95 px-2 py-1">Short Break</button>
            <button onClick={() => switchMode('longBreak')} className="text-sm sm:text-base opacity-60 hover:opacity-100 transition-opacity duration-150 active:scale-95 px-2 py-1">Long Break</button>
        </div>

        {/* --- THOUGHT MANAGEMENT --- */}
        {/* Only show the ThoughtList when NOT in a focus session - with max height and scroll */}
        {(mode !== 'focus') && (
          <div className="mt-6 sm:mt-8 max-h-48 sm:max-h-64 overflow-y-auto w-full max-w-xs sm:max-w-sm md:max-w-2xl px-4">
            <TaskList 
              thoughts={thoughts} 
              onThoughtComplete={completeThought}
              onThoughtDelete={removeThought}
              onToggleComplete={toggleTaskComplete}
            />
          </div>
        )}

        <div className="mt-6 sm:mt-8 mb-4">
          <ThoughtCatcher mode={mode} onOpen={() => setIsModalOpen(true)} />
        </div>
        
        <ThoughtModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveThought={handleSaveThought}
        />
        
        {/* Floating Navbar */}
        <FloatingNavbar />
        
      </div>
    </Layout>
  );
}