// src/app/components/InstantLoader.tsx
'use client';

import React from 'react';

interface InstantLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export default function InstantLoader({ isLoading, children }: InstantLoaderProps) {
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm flex items-center justify-center">
        <div className="relative">
          {/* Fast spinning loader */}
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {/* Pulsing background */}
          <div className="absolute inset-0 w-8 h-8 border border-white/20 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}