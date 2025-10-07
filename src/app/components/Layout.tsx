// src/app/components/Layout.tsx
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PerformanceMonitor from './PerformanceMonitor';

// Lazy load MusicPlayer to improve initial load time
const MusicPlayer = dynamic(() => import('./MusicPlayer'), {
  loading: () => <div className="bg-slate-900/80 p-3 sm:p-4 rounded-xl animate-pulse h-32"></div>,
  ssr: false,
});

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const { theme } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  // Aggressive prefetching for instant navigation
  useEffect(() => {
    // Prefetch all routes immediately
    router.prefetch('/dashboard');
    router.prefetch('/settings');
    router.prefetch('/auth/login');
    router.prefetch('/auth/register');
    router.prefetch('/');
  }, [router]);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      // Remove any previous animated-* classes
      body.className = body.className.replace(/animated-\w+/g, '').trim();
      // Add the new theme class, fallback to animated-gradient if theme is invalid
      const validTheme = theme || 'animated-gradient';
      body.classList.add(validTheme);
      // Ensure text color classes are preserved
      if (!body.classList.contains('text-white')) {
        body.classList.add('text-white');
      }
      if (!body.classList.contains('h-screen')) {
        body.classList.add('h-screen');
      }
      if (!body.classList.contains('overflow-hidden')) {
        body.classList.add('overflow-hidden');
      }
    }
  }, [theme]);
  
  // Initialize theme on mount if not set
  useEffect(() => {
    if (typeof document !== 'undefined' && !theme) {
      const body = document.body;
      body.classList.add('animated-gradient');
    }
  }, [theme]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMobileMenuOpen, theme]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <PerformanceMonitor />
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-black/20 backdrop-blur-lg p-4 hidden lg:block flex-shrink-0 overflow-y-auto relative z-10">
        <div className="font-bold text-2xl text-white mb-6">Manas</div>
        
        {/* User Info */}
        {session && (
          <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center space-x-3">
              {session.user.image ? (
                <Image 
                  src={session.user.image} 
                  alt={session.user.name || 'User'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {session.user.name || 'Anonymous'}
                </p>
                <p className="text-white/60 text-sm truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="mt-3 w-full text-sm text-white/80 hover:text-white transition-colors duration-150 py-2 px-3 rounded bg-white/10 hover:bg-white/20 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        )}
        
        <nav className="mb-6">
          <Link 
            href="/" 
            prefetch={true} 
            onMouseEnter={() => router.prefetch('/')}
            className="block py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
          >
            🏠 Home
          </Link>
          <Link 
            href="/dashboard" 
            prefetch={true} 
            onMouseEnter={() => router.prefetch('/dashboard')}
            className="block py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
          >
            📊 Dashboard
          </Link>
          <Link 
            href="/settings" 
            prefetch={true} 
            onMouseEnter={() => router.prefetch('/settings')}
            className="block py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
          >
            ⚙️ Settings
          </Link>
          {!session && (
            <>
              <div className="border-t border-white/20 my-4 pt-4">
                <p className="text-white/60 text-sm mb-2 px-4">Authentication</p>
                <Link 
                  href="/auth/login" 
                  prefetch={true} 
                  onMouseEnter={() => router.prefetch('/auth/login')}
                  className="block py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                >
                  🔐 Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  prefetch={true} 
                  onMouseEnter={() => router.prefetch('/auth/register')}
                  className="block py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                >
                  📝 Sign Up
                </Link>
              </div>
            </>
          )}
        </nav>
        
        {/* Music Player - Visible on desktop screens */}
        <div className="lg:block hidden">
          <MusicPlayer />
        </div>
      </aside>

      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center justify-between p-4">
          <div className="font-bold text-xl text-white">Manas</div>
          <button
            onClick={toggleMobileMenu}
            className="mobile-menu-button p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-150"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mobile-menu lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-black/30 backdrop-blur-xl p-4 z-50 overflow-y-auto"
            >
              <div className="font-bold text-2xl text-white mb-6 mt-16">Manas</div>
              
              {/* User Info - Mobile */}
              {session && (
                <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex items-center space-x-3">
                    {session.user.image ? (
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {session.user.name || 'Anonymous'}
                      </p>
                      <p className="text-white/60 text-sm truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/auth/login' });
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-3 w-full text-sm text-white/80 hover:text-white transition-colors duration-150 py-2 px-3 rounded bg-white/10 hover:bg-white/20 active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              )}
              
              {/* Mobile Navigation */}
              <nav className="mb-6 space-y-2">
                <Link 
                  href="/" 
                  prefetch={true}
                  onTouchStart={() => router.prefetch('/')}
                  className="flex items-center gap-3 py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🏠 Home
                </Link>
                <Link 
                  href="/dashboard" 
                  prefetch={true}
                  onTouchStart={() => router.prefetch('/dashboard')}
                  className="flex items-center gap-3 py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📊 Dashboard
                </Link>
                <Link 
                  href="/settings" 
                  prefetch={true}
                  onTouchStart={() => router.prefetch('/settings')}
                  className="flex items-center gap-3 py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ⚙️ Settings
                </Link>
                {!session && (
                  <>
                    <div className="border-t border-white/20 my-4 pt-4">
                      <p className="text-white/60 text-sm mb-2 px-4">Authentication</p>
                      <Link 
                        href="/auth/login" 
                        prefetch={true}
                        onTouchStart={() => router.prefetch('/auth/login')}
                        className="flex items-center gap-3 py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        🔐 Sign In
                      </Link>
                      <Link 
                        href="/auth/register" 
                        prefetch={true}
                        onTouchStart={() => router.prefetch('/auth/register')}
                        className="flex items-center gap-3 py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        📝 Sign Up
                      </Link>
                    </div>
                  </>
                )}
              </nav>
              
              {/* Compact Music Player for Mobile */}
              <div className="mt-auto">
                <MusicPlayer />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-10 pt-20 lg:pt-4">
          {children}
        </div>
      </main>
    </div>
  );
}