// src/app/dashboard/loading.tsx
'use client';

import { motion } from 'framer-motion';

export default function DashboardLoading() {
  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="animate-pulse mb-6 sm:mb-8">
          <div className="h-8 sm:h-10 bg-white/10 rounded-lg w-64 mb-2"></div>
          <div className="h-5 sm:h-6 bg-white/10 rounded-lg w-48"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 p-4 sm:p-6 rounded-2xl animate-pulse"
            >
              <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
              <div className="h-12 bg-white/20 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-2/3"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}