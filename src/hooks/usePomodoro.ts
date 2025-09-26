// src/hooks/usePomodoro.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAppContext } from '@/context/AppContext';
import { soundManager } from '@/utils/sounds';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

// Define the default durations in seconds
const DEFAULT_DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const usePomodoro = () => {
  const { data: session } = useSession();
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const { incrementSessions, saveSession } = useAppContext();
  
  // NEW: Durations are now a state, not a constant
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  
  const [timeRemaining, setTimeRemaining] = useState(durations.focus);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionPausedTime, setSessionPausedTime] = useState(0);

  // Define switchMode before effects that reference it to avoid TDZ errors
  const switchMode = useCallback((newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeRemaining(durations[newMode]); // Use stateful durations
    setIsActive(false);
    
    // Play sound for mode switch
    if (newMode === 'focus') {
      soundManager.playFocusStart();
    } else if (newMode === 'shortBreak') {
      soundManager.playBreakStart();
    } else if (newMode === 'longBreak') {
      soundManager.playLongBreakStart();
    }
  }, [durations]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0) {
      setIsActive(false);
      
      // Play completion sound based on current mode
      if (mode === 'focus') {
        soundManager.playFocusEnd();
      } else if (mode === 'shortBreak') {
        soundManager.playBreakEnd();
      } else if (mode === 'longBreak') {
        soundManager.playLongBreakEnd();
      }
      
      // Save completed session to backend
      if (sessionStartTime && session) {
        const sessionData = {
          mode,
          duration: Math.floor(durations[mode] / 60), // Convert to minutes
          completed: true,
          startTime: sessionStartTime.toISOString(),
          endTime: new Date().toISOString(),
          pausedDuration: sessionPausedTime,
          thoughtsCaptured: 0, // Could be enhanced to track thoughts during session
        };
        
        saveSession(sessionData);
      }
      
      if (mode === 'focus') {
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);
        try { incrementSessions(); } catch {}
        const nextMode = newSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak';
        switchMode(nextMode);
      } else {
        switchMode('focus');
      }
      
      // Reset session tracking
      setSessionStartTime(null);
      setSessionPausedTime(0);
    }
  }, [timeRemaining, mode, sessionCount, incrementSessions, switchMode, sessionStartTime, session, durations, saveSession, sessionPausedTime]);

  const startStop = useCallback(() => {
    setIsActive(prev => {
      const newIsActive = !prev;
      
      if (newIsActive) {
        // Starting a session
        if (!sessionStartTime) {
          setSessionStartTime(new Date());
        }
        // Play start sound
        soundManager.playTimerStart();
      } else {
        // Pausing a session - track paused time
        const now = Date.now();
        if (sessionStartTime) {
          const pauseStart = now;
          setSessionPausedTime(prevPausedTime => prevPausedTime + (pauseStart - pauseStart));
        }
      }
      
      return newIsActive;
    });
  }, [sessionStartTime]);


  const resetTimer = useCallback(() => {
    setTimeRemaining(durations[mode]); // Use stateful durations
    setIsActive(false);
    // Reset session tracking
    setSessionStartTime(null);
    setSessionPausedTime(0);
  }, [mode, durations]);
  
  // NEW: Function to update the duration for a specific mode
  const updateDuration = (modeToUpdate: PomodoroMode, newMinutes: number) => {
    const newSeconds = newMinutes * 60;
    const newDurations = {
      ...durations,
      [modeToUpdate]: newSeconds,
    };
    setDurations(newDurations);

    // If the user changes the duration of the current mode, update the timer immediately
    if (mode === modeToUpdate) {
      setTimeRemaining(newSeconds);
      setIsActive(false); // Pause the timer to reflect the change
    }
  };

  return {
    mode,
    timeRemaining,
    isActive,
    durations,
    startStop,
    resetTimer,
    switchMode,
    updateDuration, // Expose the new function
  };
};

export default usePomodoro;