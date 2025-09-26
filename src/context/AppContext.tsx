// src/context/AppContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export type Thought = { 
  _id?: string;
  text: string; 
  timestamp: string;
  session?: {
    mode: 'focus' | 'shortBreak' | 'longBreak';
    sessionNumber: number;
  };
  tags?: string[];
  isCompleted?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
};

type AppState = {
  sessionsCompleted: number;
  thoughts: Thought[];
  theme: string;
  isLoading: boolean;
  totalFocusTime: number;
  streak: number;
};

type AppContextType = AppState & {
  addThought: (text: string, sessionData?: any) => Promise<void>;
  removeThought: (thoughtId: string) => Promise<void>;
  completeThought: (thoughtId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  incrementSessions: () => void;
  clearAll: () => void;
  setTheme: (theme: string) => void;
  syncWithServer: () => Promise<void>;
  saveSession: (sessionData: any) => Promise<void>;
};

const defaultState: AppState = {
  sessionsCompleted: 0,
  thoughts: [],
  theme: 'animated-gradient',
  isLoading: false,
  totalFocusTime: 0,
  streak: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'manas_app_state_v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [state, setState] = useState<AppState>(defaultState);
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  // Load from localStorage initially (for offline/guest usage)
  useEffect(() => {
    if (status === 'loading') return;
    
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw && !session) {
        // Only use localStorage if not authenticated
        const parsed = JSON.parse(raw) as AppState;
        setState({
          sessionsCompleted: parsed.sessionsCompleted ?? 0,
          thoughts: Array.isArray(parsed.thoughts) 
            ? parsed.thoughts.map((thought: any) => ({
                ...thought,
                isCompleted: thought.isCompleted ?? false,
              }))
            : [],
          theme: parsed.theme ?? 'animated-gradient',
          isLoading: false,
          totalFocusTime: parsed.totalFocusTime ?? 0,
          streak: parsed.streak ?? 0,
        });
      }
    } catch {
      // ignore corrupted data
    }
  }, [session, status]);

  // Sync with server when authenticated
  const syncWithServer = async () => {
    if (!session) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Fetch user stats and thoughts from server
      const [statsResponse, thoughtsResponse] = await Promise.all([
        axios.get('/api/user/stats'),
        axios.get('/api/thoughts?limit=200')
      ]);
      
      const stats = statsResponse.data;
      const thoughtsData = thoughtsResponse.data;
      
      setState(prev => ({
        ...prev,
        sessionsCompleted: stats.sessionsCompleted || 0,
        totalFocusTime: stats.totalFocusTime || 0,
        streak: stats.streak || 0,
        thoughts: (thoughtsData.thoughts || []).map((thought: any) => ({
          ...thought,
          isCompleted: thought.isCompleted ?? false, // Default to false if missing
        })).filter((thought: any) => !thought.isDeleted), // Filter out soft-deleted thoughts
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to sync with server:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Sync with server when authenticated
  useEffect(() => {
    if (session && !hasLoadedFromServer) {
      syncWithServer();
      setHasLoadedFromServer(true);
    }
  }, [session, hasLoadedFromServer]);

  // Persist to localStorage (for guest usage)
  useEffect(() => {
    if (!session && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage may be unavailable; ignore
      }
    }
  }, [state, session]);

  const addThought = useCallback(async (text: string, sessionData?: any) => {
    if (!text.trim()) return;
    
    const newThought: Thought = {
      text: text.trim(),
      timestamp: new Date().toISOString(),
      session: sessionData,
      isCompleted: false, // Initialize as not completed
      isDeleted: false, // Initialize as not deleted
    };
    
    // Update local state immediately for better UX
    setState((prev) => ({
      ...prev,
      thoughts: [newThought, ...prev.thoughts].slice(0, 200),
    }));
    
    // If authenticated, save to server
    if (session) {
      try {
        const response = await axios.post('/api/thoughts', {
          text: text.trim(),
          session: sessionData,
        });
        
        // Update with server response (includes _id and all fields)
        const savedThought = response.data;
        setState((prev) => ({
          ...prev,
          thoughts: prev.thoughts.map((t, index) => 
            index === 0 ? savedThought : t
          ),
        }));
      } catch (error) {
        console.error('Failed to save thought to server:', error);
        // Keep the local version
      }
    }
  }, [session]);
  
  const toggleTaskComplete = useCallback(async (taskId: string) => {
    if (!session) return;
    
    // Optimistically update local state
    setState((prev) => ({
      ...prev,
      thoughts: prev.thoughts.map(t => 
        t._id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      ),
    }));
    
    try {
      const currentTask = state.thoughts.find(t => t._id === taskId);
      const newCompletedState = !currentTask?.isCompleted;
      
      await axios.put(`/api/thoughts/${taskId}`, {
        isCompleted: newCompletedState,
      });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      // Revert the optimistic update
      setState((prev) => ({
        ...prev,
        thoughts: prev.thoughts.map(t => 
          t._id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        ),
      }));
    }
  }, [session, state.thoughts]);
  
  const completeThought = useCallback(async (thoughtId: string) => {
    if (!session) return;
    
    try {
      // Delete the thought immediately
      await axios.delete(`/api/thoughts/${thoughtId}`);
      
      // Remove from local state
      setState((prev) => ({
        ...prev,
        thoughts: prev.thoughts.filter(t => t._id !== thoughtId),
      }));
    } catch (error) {
      console.error('Failed to complete thought:', error);
    }
  }, [session]);

  const removeThought = useCallback(async (thoughtId: string) => {
    if (!session) return;
    
    // Remove from local state immediately
    setState((prev) => ({
      ...prev,
      thoughts: prev.thoughts.filter(t => t._id !== thoughtId),
    }));
    
    try {
      await axios.delete(`/api/thoughts/${thoughtId}`);
    } catch (error) {
      console.error('Failed to remove thought from server:', error);
      // Re-add the thought if server deletion failed
      syncWithServer();
    }
  }, [session]);
  
  const saveSession = async (sessionData: any) => {
    if (!session) return;
    
    try {
      await axios.post('/api/sessions', sessionData);
      // Refresh stats after saving session
      if (sessionData.completed && sessionData.mode === 'focus') {
        syncWithServer();
      }
    } catch (error) {
      console.error('Failed to save session to server:', error);
    }
  };

  const incrementSessions = useCallback(() => {
    setState((prev) => ({ ...prev, sessionsCompleted: prev.sessionsCompleted + 1 }));
  }, []);

  const clearAll = useCallback(() => setState(defaultState), []);

  const setTheme = useCallback((theme: string) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  // Auto-cleanup is no longer needed - thoughts are deleted immediately
  // useEffect removed for simplicity

  const value = useMemo<AppContextType>(() => ({
    ...state,
    addThought,
    removeThought,
    completeThought,
    toggleTaskComplete,
    incrementSessions,
    clearAll,
    setTheme,
    syncWithServer,
    saveSession,
  }), [state, addThought, removeThought, completeThought, toggleTaskComplete, incrementSessions, clearAll, setTheme, syncWithServer, saveSession]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}


