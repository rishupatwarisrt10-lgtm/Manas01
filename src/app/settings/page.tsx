// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Layout from "@/app/components/Layout";
import { useAppContext } from "@/context/AppContext";
import AuthGuard from "@/components/AuthGuard";
import axios from 'axios';

// Only lazy load non-critical components
const ThemeSwitcher = dynamic(() => import("@/app/components/ThemeSwitcher"), {
  loading: () => <div className="bg-white/10 p-4 rounded-xl animate-pulse h-24"></div>,
});

interface UserPreferences {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  theme: string;
  notifications: boolean;
  liveBackground: {
    enabled: boolean;
    videoUrl: string;
    opacity: number;
  };
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { clearAll, setTheme } = useAppContext();
  const [preferences, setPreferences] = useState<UserPreferences>({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    theme: 'animated-gradient',
    notifications: true,
    liveBackground: {
      enabled: false,
      videoUrl: '',
      opacity: 30,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (session) {
      fetchPreferences();
    } else {
      setIsLoading(false);
    }
  }, [session]);
  
  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/user/preferences');
      const data = response.data;
      
      // Ensure liveBackground property exists with defaults
      const updatedPreferences = {
        ...data,
        liveBackground: {
          enabled: false,
          videoUrl: '',
          opacity: 30,
          ...(data.liveBackground || {})
        }
      };
      
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const savePreferences = async () => {
    // Immediate visual feedback
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 200);
    
    if (!session) {
      // Save to localStorage for non-authenticated users
      if (typeof window !== 'undefined') {
        try {
          const backgroundSettings = preferences.liveBackground || {
            enabled: false,
            videoUrl: '',
            opacity: 30
          };
          localStorage.setItem('liveBackgroundSettings', JSON.stringify(backgroundSettings));
          // Trigger storage event to update LiveBackground component
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'liveBackgroundSettings',
            newValue: JSON.stringify(backgroundSettings)
          }));
          setMessage('Settings saved locally!');
          setTimeout(() => setMessage(''), 3000);
        } catch (error) {
          setMessage('Failed to save settings locally.');
          setTimeout(() => setMessage(''), 3000);
        }
      }
      return;
    }
    
    // For authenticated users - do optimistic update first
    setTheme(preferences.theme);
    setMessage('Settings saved successfully!');
    
    // Save to localStorage immediately for instant background effect
    if (typeof window !== 'undefined') {
      const backgroundSettings = preferences.liveBackground || {
        enabled: false,
        videoUrl: '',
        opacity: 30
      };
      localStorage.setItem('liveBackgroundSettings', JSON.stringify(backgroundSettings));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'liveBackgroundSettings',
        newValue: JSON.stringify(backgroundSettings)
      }));
    }
    
    // Save to server in background (non-blocking)
    setIsSaving(true);
    setTimeout(async () => {
      try {
        await axios.put('/api/user/preferences', preferences);
        // Keep the success message
      } catch (error) {
        console.error('Failed to save preferences:', error);
        setMessage('Settings applied locally. Server sync failed.');
      } finally {
        setIsSaving(false);
        setTimeout(() => setMessage(''), 3000);
      }
    }, 0); // Use setTimeout to make it non-blocking
  };
  
  const handleChange = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleLiveBackgroundChange = (field: keyof UserPreferences['liveBackground'], value: any) => {
    // Immediate update for instant feedback
    setPreferences(prev => ({
      ...prev,
      liveBackground: {
        ...prev.liveBackground,
        [field]: value
      }
    }));
    
    // If it's a URL change, immediately update localStorage for instant background effect
    if (field === 'videoUrl' || field === 'enabled' || field === 'opacity') {
      setTimeout(() => {
        const updatedSettings = {
          ...preferences.liveBackground,
          [field]: value
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('liveBackgroundSettings', JSON.stringify(updatedSettings));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'liveBackgroundSettings',
            newValue: JSON.stringify(updatedSettings)
          }));
        }
      }, 0);
    }
  };

  // Helper function to parse YouTube URL
  const parseYouTubeUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Preset background videos
  const backgroundPresets = {
    'NYC Street Walk': 'https://www.youtube.com/watch?v=1aedKShR1rA',
    'Tokyo Street Walk': 'https://www.youtube.com/watch?v=28ZjrtD_iL0',
    'Switzerland Walk': 'https://www.youtube.com/watch?v=Bq4rmeIvJbs',
    'London Rain Walk': 'https://www.youtube.com/watch?v=Guf53QoCy3w',
    'Cozy Coffee Shop': 'https://www.youtube.com/watch?v=0L38Z9hIi5s',
    'Forest Rain': 'https://www.youtube.com/watch?v=CedhfuMMRNk'
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAll();
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }

  return (
    <AuthGuard allowBoth={true}>
      <Layout>
        <div className="max-w-7xl mx-auto h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
          <h2 className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8">Customize your Manas experience</h2>
          
          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                : 'bg-red-500/20 border border-red-500/30 text-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pb-8">
            {/* Timer Settings - Only for authenticated users */}
            {session && (
              <div className="bg-white/10 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 lg:col-span-2">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Timer Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base">
                      Focus Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={preferences.focusDuration}
                      onChange={(e) => handleChange('focusDuration', parseInt(e.target.value))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base">
                      Short Break (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={preferences.shortBreakDuration}
                      onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base">
                      Long Break (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={preferences.longBreakDuration}
                      onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={savePreferences}
                    disabled={isSaving}
                    className={`font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-100 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                      isButtonPressed ? 'bg-white/40 text-white scale-95' : 'bg-white/20 hover:bg-white/30 text-white active:scale-95 active:bg-white/40'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Timer Settings'}
                  </button>
                </div>
              </div>
            )}            
            
            {/* Theme Settings */}
            <div className="bg-white/10 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Appearance</h3>
              <ThemeSwitcher />
            </div>

            {/* Data Management */}
            <div className="bg-white/10 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Data Management</h3>
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  Clear all your local data including sessions completed and thoughts.
                </p>
                <button
                  onClick={() => {
                    setIsButtonPressed(true);
                    setTimeout(() => setIsButtonPressed(false), 150);
                    handleClearData();
                  }}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-100 text-sm sm:text-base ${
                    isButtonPressed ? 'bg-red-700 text-white scale-95' : 'bg-red-600/80 text-white hover:bg-red-600 active:scale-95 active:bg-red-700'
                  }`}
                >
                  Clear Local Data
                </button>
              </div>
            </div>

            {/* Live Background Settings */}
            <div className="bg-white/10 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 lg:col-span-2">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Live Background</h3>
              
              {/* Enable/Disable Toggle */}
              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.liveBackground?.enabled || false}
                    onChange={(e) => handleLiveBackgroundChange('enabled', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 bg-white/10 border-white/30 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <span className="text-white font-medium text-sm sm:text-base">Enable Live Background Videos</span>
                </label>
                <p className="text-white/60 text-xs sm:text-sm mt-2">Play YouTube videos as ambient background while you work</p>
              </div>

              {(preferences.liveBackground?.enabled) && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Video Presets */}
                  <div>
                    <label className="block text-white/80 font-medium mb-3 text-sm sm:text-base">Choose a Preset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {Object.entries(backgroundPresets).map(([name, url]) => (
                        <button
                          key={name}
                          onClick={() => {
                            setIsButtonPressed(true);
                            setTimeout(() => setIsButtonPressed(false), 150);
                            handleLiveBackgroundChange('videoUrl', url);
                          }}
                          className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-100 text-xs sm:text-sm font-medium ${
                            (preferences.liveBackground?.videoUrl) === url
                              ? 'border-indigo-400 bg-indigo-400/20 text-white scale-95'
                              : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 active:scale-95 active:bg-white/20'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom URL Input */}
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base">Or Enter Custom YouTube URL</label>
                    <input
                      type="text"
                      value={preferences.liveBackground?.videoUrl || ''}
                      onChange={(e) => handleLiveBackgroundChange('videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base"
                    />
                    {preferences.liveBackground?.videoUrl && !parseYouTubeUrl(preferences.liveBackground.videoUrl) && (
                      <p className="text-red-400 text-xs sm:text-sm mt-1">Please enter a valid YouTube URL</p>
                    )}
                  </div>

                  {/* Opacity Control */}
                  <div>
                    <label className="block text-white/80 font-medium mb-2 text-sm sm:text-base">
                      Background Opacity: {preferences.liveBackground?.opacity || 30}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={preferences.liveBackground?.opacity || 30}
                      onChange={(e) => handleLiveBackgroundChange('opacity', parseInt(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>Subtle (10%)</span>
                      <span>Balanced (30%)</span>
                      <span>Prominent (60%)</span>
                    </div>
                  </div>

                  {/* Preview */}
                  {preferences.liveBackground?.videoUrl && parseYouTubeUrl(preferences.liveBackground.videoUrl) && (
                    <div className="border border-white/20 rounded-lg p-3 sm:p-4 bg-white/5">
                      <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Preview</h4>
                      <div className="aspect-video w-full max-w-xs sm:max-w-sm rounded-lg overflow-hidden bg-black/20">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${parseYouTubeUrl(preferences.liveBackground.videoUrl)}?autoplay=0&mute=1&loop=1&controls=0`}
                          title="Background preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          className="w-full h-full"
                        ></iframe>
                      </div>
                      <p className="text-white/60 text-xs mt-2">
                        This will play muted and looped in the background at {preferences.liveBackground?.opacity || 30}% opacity
                      </p>
                    </div>
                  )}
                  
                  {/* Save Background Settings Button */}
                  <div className="pt-4 border-t border-white/20">
                    <button
                      onClick={() => {
                        setIsButtonPressed(true);
                        setTimeout(() => setIsButtonPressed(false), 150);
                        savePreferences();
                      }}
                      disabled={isSaving}
                      className={`font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                        isButtonPressed ? 'bg-indigo-700 text-white scale-95' : 'bg-indigo-600/80 hover:bg-indigo-600 text-white active:scale-95 active:bg-indigo-700'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Apply Live Background'}
                    </button>
                    <p className="text-white/60 text-xs mt-2">
                      Changes will take effect immediately
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* About */}
            <div className="bg-white/10 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 lg:col-span-2">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">About Manas</h3>
              <div className="space-y-3 text-white/80 text-sm sm:text-base">
                <p>
                  Manas is a mindful Pomodoro timer designed to help you achieve deep focus while maintaining awareness of your thoughts and mental state.
                </p>
                <p>
                  The name "Manas" comes from Sanskrit, meaning "mind" or "mental faculty," representing the space where thoughts arise and where mindfulness is cultivated.
                </p>
                <p>
                  Created by <span className="text-white font-semibold">Rishu Patwari</span>, a vibe coder who crafted this experience with the help of AI to bring mindful productivity to your digital workspace.
                </p>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-xs sm:text-sm text-white/60">
                    Version 2.0.0 • Built with Next.js, NextAuth.js, and MongoDB • Made with ❤️ for mindful productivity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}