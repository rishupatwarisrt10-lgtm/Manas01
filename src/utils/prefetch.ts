// src/utils/prefetch.ts
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Hook to prefetch routes on app load for faster navigation
export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Immediate prefetch for critical routes - no delay
    router.prefetch('/dashboard');
    router.prefetch('/settings');
    router.prefetch('/auth/login');
    router.prefetch('/auth/register');
    router.prefetch('/');
    
    // Preload heavy components aggressively
    setTimeout(() => {
      // Preload Dashboard components
      import('@/app/dashboard/page');
      import('@/app/dashboard/DashboardCard');
      
      // Preload Settings components  
      import('@/app/settings/page');
      import('@/app/components/ThemeSwitcher');
      
      // Preload Layout and common components
      import('@/app/components/Layout');
      import('@/app/components/Timer');
      import('@/app/components/FloatingNavbar');
    }, 100); // Very short delay for immediate preloading

  }, [router]);

  // Prefetch route on hover for instant navigation
  const prefetchOnHover = (route: string) => {
    router.prefetch(route);
  };

  return { prefetchOnHover };
}

// Utility to preload critical components
export const preloadComponent = (componentImport: () => Promise<unknown>) => {
  // Preload component immediately
  componentImport();
};

// Aggressive preloader for critical page components
export const preloadCriticalComponents = () => {
  // Start preloading immediately when called
  const preloadPromises = [
    import('@/app/components/Layout'),
    import('@/app/components/Timer'),
    import('@/app/components/FloatingNavbar'),
    import('@/app/dashboard/page'),
    import('@/app/settings/page'),
  ];
  
  return Promise.all(preloadPromises);
};