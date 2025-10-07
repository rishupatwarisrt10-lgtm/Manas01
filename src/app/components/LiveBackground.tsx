// src/app/components/LiveBackground.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function LiveBackground() {
  const { theme: _theme } = useAppContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [backgroundSettings, setBackgroundSettings] = useState({
    enabled: false,
    videoUrl: '',
    opacity: 30,
  });
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Load background settings from localStorage or user preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('liveBackgroundSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setBackgroundSettings(settings);
        }
      } catch (error) {
        console.error('Failed to load background settings:', error);
      }
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'liveBackgroundSettings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          setBackgroundSettings(settings);
        } catch (error) {
          console.error('Failed to parse background settings:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update video only when URL actually changes to prevent reloading
  useEffect(() => {
    if (backgroundSettings.enabled && backgroundSettings.videoUrl) {
      const videoId = parseYouTubeUrl(backgroundSettings.videoUrl);
      if (videoId && videoId !== currentVideoId) {
        setCurrentVideoId(videoId);
      }
    } else {
      setCurrentVideoId(null);
    }
  }, [backgroundSettings.enabled, backgroundSettings.videoUrl, currentVideoId]);

  // Helper function to parse YouTube URL
  const parseYouTubeUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Don't render if disabled or no valid video URL
  if (!backgroundSettings.enabled || !currentVideoId) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: backgroundSettings.opacity / 100 }}
    >
      <iframe
        ref={iframeRef}
        key={currentVideoId} // Force re-render only when video actually changes
        className="absolute top-1/2 left-1/2 w-[177.77vh] h-[56.25vw] min-h-full min-w-full transform -translate-x-1/2 -translate-y-1/2"
        src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=1&loop=1&playlist=${currentVideoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&cc_load_policy=0&start=0&end=0`}
        title="Live Background Video"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen={false}
      ></iframe>
      
      {/* Gradient overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}