// src/app/settings/loading.tsx
'use client';

import { motion } from 'framer-motion';

export default function SettingsLoading() {
  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="animate-pulse mb-6 sm:mb-8">
          <div className="h-8 sm:h-10 bg-white/10 rounded-lg w-48 mb-2"></div>
          <div className="h-5 sm:h-6 bg-white/10 rounded-lg w-64"></div>
        </div>

        {/* Settings grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white/10 p-4 sm:p-6 rounded-2xl animate-pulse ${
                i === 0 ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="h-5 bg-white/20 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/20 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-10 bg-white/20 rounded w-full"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}