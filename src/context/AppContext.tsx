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

type SessionData = {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  sessionNumber: number;
  [key: string]: unknown;
};

type AppContextType = AppState & {
  addThought: (text: string, sessionData?: SessionData) => Promise<void>;
  removeThought: (thoughtId: string) => Promise<void>;
  completeThought: (thoughtId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  reorderThoughts: (startIndex: number, endIndex: number) => void;
  incrementSessions: () => void;
  clearAll: () => void;
  setTheme: (theme: string) => void;
  syncWithServer: () => Promise<void>;
  saveSession: (sessionData: Record<string, unknown>) => Promise<void>;
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
  const [deletingThoughts, setDeletingThoughts] = useState<Set<string>>(new Set());

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
  const syncWithServer = useCallback(async () => {
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
        thoughts: (thoughtsData.thoughts || []).map((thought: Record<string, unknown>) => ({
          ...thought,
          isCompleted: thought.isCompleted ?? false, // Default to false if missing
        })).filter((thought: Record<string, unknown>) => !thought.isDeleted), // Filter out soft-deleted thoughts
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to sync with server:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [session]);

  // Sync with server when authenticated
  useEffect(() => {
    if (session && !hasLoadedFromServer) {
      syncWithServer();
      setHasLoadedFromServer(true);
    }
  }, [session, hasLoadedFromServer, syncWithServer]);

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

  const addThought = useCallback(async (text: string, sessionData?: SessionData) => {
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
    if (!session) {
      console.warn('No session available for removing thought');
      return;
    }
    
    if (!thoughtId || typeof thoughtId !== 'string') {
      console.error('Invalid thoughtId provided:', thoughtId);
      return;
    }
    
    // Prevent duplicate deletion attempts
    if (deletingThoughts.has(thoughtId)) {
      console.warn('Thought deletion already in progress:', thoughtId);
      return;
    }
    
    // Check if thought still exists in our state
    const thoughtExists = state.thoughts.some(t => t._id === thoughtId);
    if (!thoughtExists) {
      console.warn('Thought not found in local state:', thoughtId);
      return;
    }
    
    console.log('Attempting to delete thought with ID:', thoughtId);
    
    // Mark as being deleted
    setDeletingThoughts(prev => new Set(prev).add(thoughtId));
    
    // Store the thought to restore if deletion fails
    const thoughtToDelete = state.thoughts.find(t => t._id === thoughtId);
    
    // Remove from local state immediately
    setState((prev) => ({
      ...prev,
      thoughts: prev.thoughts.filter(t => t._id !== thoughtId),
    }));
    
    try {
      const response = await axios.delete(`/api/thoughts/${thoughtId}`);
      console.log('Thought deleted successfully:', response.data);
    } catch (error: any) {
      console.error('Failed to remove thought from server:', {
        thoughtId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Only restore if it's not a 404 (thought already deleted)
      if (error.response?.status !== 404) {
        // Re-add the thought if server deletion failed and we have the original thought
        if (thoughtToDelete) {
          setState((prev) => ({
            ...prev,
            thoughts: [thoughtToDelete, ...prev.thoughts],
          }));
        } else {
          // Fallback: sync with server to restore state
          syncWithServer();
        }
      }
    } finally {
      // Remove from deleting set
      setDeletingThoughts(prev => {
        const newSet = new Set(prev);
        newSet.delete(thoughtId);
        return newSet;
      });
    }
  }, [session, state.thoughts, syncWithServer, deletingThoughts]);
  
  const saveSession = useCallback(async (sessionData: Record<string, unknown>) => {
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
  }, [session]);

  const incrementSessions = useCallback(() => {
    setState((prev) => ({ ...prev, sessionsCompleted: prev.sessionsCompleted + 1 }));
  }, []);

  const clearAll = useCallback(() => setState(defaultState), []);

  const setTheme = useCallback((theme: string) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const reorderThoughts = useCallback((startIndex: number, endIndex: number) => {
    setState((prev) => {
      const result = Array.from(prev.thoughts);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { ...prev, thoughts: result };
    });
  }, []);

  // Auto-cleanup is no longer needed - thoughts are deleted immediately
  // useEffect removed for simplicity

  const value = useMemo<AppContextType>(() => ({
    ...state,
    addThought,
    removeThought,
    completeThought,
    toggleTaskComplete,
    reorderThoughts,
    incrementSessions,
    clearAll,
    setTheme,
    syncWithServer,
    saveSession,
  }), [state, addThought, removeThought, completeThought, toggleTaskComplete, reorderThoughts, incrementSessions, clearAll, setTheme, syncWithServer, saveSession]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}


