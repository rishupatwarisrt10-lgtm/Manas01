// src/app/components/ThoughtCatcher.tsx
'use client';

import { PomodoroMode } from '@/hooks/usePomodoro';

interface ThoughtCatcherProps {
  mode: PomodoroMode;
  onOpen: () => void;
}

export default function ThoughtCatcher({ mode, onOpen }: ThoughtCatcherProps) {
  // This component renders nothing if not in focus mode
  if (mode !== 'focus') {
    return null;
  }

  return (
    <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-10 lg:absolute lg:bottom-10 lg:right-10 z-30">
      <button
        onClick={onOpen}
        className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-500/80 text-white rounded-full font-semibold hover:bg-indigo-500 transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg backdrop-blur-sm text-sm sm:text-base min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Capture a thought"
      >
        <span className="hidden xs:inline">Capture a Thought</span>
        <span className="xs:hidden">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </span>
      </button>
    </div>
  );
}