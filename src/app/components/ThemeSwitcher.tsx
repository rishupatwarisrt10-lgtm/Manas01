// src/app/components/ThemeSwitcher.tsx
'use client';

import { useAppContext } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { useState } from 'react';

const THEMES = [
  { key: 'animated-gradient', label: 'Aurora' },
  { key: 'animated-ocean', label: 'Ocean' },
  { key: 'animated-sunset', label: 'Sunset' },
  { key: 'animated-forest', label: 'Forest' },
  { key: 'animated-galaxy', label: 'Galaxy' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useAppContext();
  const [pressedTheme, setPressedTheme] = useState<string | null>(null);
  
  const handleThemeClick = (themeKey: string) => {
    setPressedTheme(themeKey);
    setTimeout(() => setPressedTheme(null), 150);
    setTheme(themeKey);
  };
  return (
    <div className="">
      <p className="text-xs sm:text-sm text-white/70 mb-3 sm:mb-4">Choose your preferred theme</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {THEMES.map(t => (
          <motion.button
            key={t.key}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleThemeClick(t.key)}
            className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-100 min-h-[60px] sm:min-h-[80px] ${
              theme === t.key || pressedTheme === t.key
                ? 'bg-black/80 text-white border-2 border-white/50 shadow-lg scale-95' 
                : 'bg-white/10 text-white/90 hover:bg-white/20 border-2 border-white/20 hover:border-white/30 active:scale-95 active:bg-white/25'
            }`}
          >
            <div className="flex flex-col items-center space-y-1 sm:space-y-2">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getThemePreview(t.key)}`}></div>
              <span className="leading-tight">{t.label}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Helper function to show theme preview colors
function getThemePreview(themeKey: string): string {
  switch (themeKey) {
    case 'animated-gradient':
      return 'bg-gradient-to-r from-blue-600 to-purple-600';
    case 'animated-ocean':
      return 'bg-gradient-to-r from-blue-800 to-teal-600';
    case 'animated-sunset':
      return 'bg-gradient-to-r from-orange-600 to-red-600';
    case 'animated-forest':
      return 'bg-gradient-to-r from-green-700 to-emerald-600';
    case 'animated-galaxy':
      return 'bg-gradient-to-r from-purple-800 to-indigo-700';
    default:
      return 'bg-gray-500';
  }
}


