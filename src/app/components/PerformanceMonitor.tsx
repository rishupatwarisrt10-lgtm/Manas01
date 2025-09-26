// src/app/components/PerformanceMonitor.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PerformanceMonitor() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Track navigation performance
    const measureNavigationTime = () => {
      if (typeof window !== 'undefined' && window.performance) {
        // Use the Navigation API to get precise timing
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const navEntry = navEntries[0] as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 Page load time for ${pathname}: ${loadTime.toFixed(2)}ms`);
          }
        }
        
        // Measure time to interactive
        setTimeout(() => {
          const entries = performance.getEntriesByType('paint');
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp && process.env.NODE_ENV === 'development') {
            console.log(`🎨 First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
          }
        }, 100);
      }
    };

    measureNavigationTime();
  }, [pathname]);

  return null; // This component doesn't render anything
}