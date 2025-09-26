// src/components/AuthGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowBoth?: boolean; // New prop to allow both authenticated and non-authenticated users
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login',
  allowBoth = false
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    // If allowBoth is true, allow access regardless of auth status
    if (allowBoth) return;

    if (requireAuth && !session) {
      router.push(redirectTo);
      return;
    }

    if (!requireAuth && session) {
      // If user is authenticated but accessing auth pages, redirect to dashboard
      router.push('/dashboard');
      return;
    }
  }, [session, status, requireAuth, redirectTo, router, allowBoth]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // If allowBoth is true, always render children
  if (allowBoth) {
    return <>{children}</>;
  }

  if (requireAuth && !session) {
    return null; // Will redirect
  }

  if (!requireAuth && session) {
    return null; // Will redirect
  }

  return <>{children}</>;
}