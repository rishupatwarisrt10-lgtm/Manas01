// src/app/components/DashboardCard.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Allow custom classes for grid spanning
}

export default function DashboardCard({ title, children, className = '' }: DashboardCardProps) {
  return (
    // The parent element with the 'perspective' property
    <motion.div
      className={`[perspective:1000px] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* The card itself with 3D transform properties */}
      <motion.div
        className="
          [transform-style:preserve-3d]
          group
          h-full
          bg-white/10 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20
          transition-all duration-500 ease-in-out
          hover:shadow-2xl hover:shadow-indigo-500/30
          hover:-rotate-y-4 hover:rotate-x-2
        "
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative z-10">
          <h3 className="text-base sm:text-lg font-semibold text-white/80 mb-3 sm:mb-4">{title}</h3>
          <div className="text-white">
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}