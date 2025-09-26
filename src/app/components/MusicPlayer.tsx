// src/app/components/MusicPlayer.tsx
'use client';

import { useState } from 'react';

// A simple data structure for our playlist items
interface PlaylistItem {
  id: string; // The YouTube video ID
  url: string; // The full URL for display and re-parsing
}

// Pre-set options for the user
const presets = {
  lofi: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  rain: 'https://www.youtube.com/watch?v=n61ULEU7CO0',
  piano: 'https://www.youtube.com/watch?v=WJ3-F02-F_Y',
};

export default function MusicPlayer() {
  const [urlInput, setUrlInput] = useState(presets.lofi);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null); // Start with no video loaded
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Playlist State ---
  // We'll pre-populate it to demonstrate the feature
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([
    { id: 'jfKfPfyJRdk', url: presets.lofi },
    { id: 'n61ULEU7CO0', url: presets.rain },
  ]);

  // Helper function to parse various YouTube URL formats
  function parseYouTubeUrl(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  const handleLoadVideo = (urlToLoad: string) => {
    setError(null);
    const videoId = parseYouTubeUrl(urlToLoad);
    if (videoId) {
      setCurrentVideoId(videoId);
      setIsPlaying(false); // Don't auto-play when loading
    } else {
      setError('Invalid YouTube URL.');
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const stopVideo = () => {
    setIsPlaying(false);
    setCurrentVideoId(null);
  };

  const handleAddToPlaylist = () => {
    setError(null);
    const videoId = parseYouTubeUrl(urlInput);
    if (!videoId) {
      setError('Cannot add invalid URL to playlist.');
      return;
    }
    // Prevent adding duplicates
    if (playlist.some(item => item.id === videoId)) {
      setError('This video is already in the playlist.');
      return;
    }
    setPlaylist(prev => [...prev, { id: videoId, url: urlInput }]);
  };
  
  return (
    <div className="bg-slate-900/80 p-3 sm:p-4 rounded-xl shadow-lg backdrop-blur-md border border-white/20 isolate z-50">
      <h3 className="font-semibold text-white/90 mb-2 sm:mb-3 text-base sm:text-lg">Focus Video</h3>

      {/* Video Player Iframe */}
      {currentVideoId && (
        <div className="aspect-video w-full rounded-lg overflow-hidden mb-3 sm:mb-4 bg-black/20 relative">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
          
          {/* Video Controls Overlay */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlayPause}
                className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors duration-150 active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={stopVideo}
                className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors duration-150 active:scale-95"
                title="Stop and close video"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="text-white/80 text-xs">
              {isPlaying ? 'Playing' : 'Paused'}
            </div>
          </div>
        </div>
      )}

      {/* URL Input and Controls */}
      <div className="space-y-2 sm:space-y-3">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste YouTube URL"
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-black/40 rounded-md text-xs sm:text-sm text-white/90 placeholder:text-white/40 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              handleLoadVideo(urlInput);
              setIsPlaying(true); // Start playing when explicitly loading
            }}
            className="flex-grow py-1.5 sm:py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 transition-colors duration-150 text-xs sm:text-sm active:scale-95"
          >
            Load & Play Video
          </button>
          <button
            onClick={handleAddToPlaylist}
            className="flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-500 transition-colors duration-150 text-xs sm:text-sm active:scale-95 whitespace-nowrap"
          >
            Add to Playlist
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      {/* --- SANGEET-MALA PLAYLIST --- */}
      <div className="mt-4 sm:mt-6">
        <h4 className="font-semibold text-white/80 mb-2 text-sm sm:text-base">Playlist</h4>
        <ul className="space-y-1 max-h-32 sm:max-h-48 overflow-y-auto pr-1 sm:pr-2">
          {playlist.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                handleLoadVideo(item.url);
                setIsPlaying(true); // Start playing when selecting from playlist
              }}
              className="p-1.5 sm:p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors duration-150 active:scale-95"
            >
              <p className="text-xs sm:text-sm text-white/90 truncate">youtube.com/watch?v={item.id}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}