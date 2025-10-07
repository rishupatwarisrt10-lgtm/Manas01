// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Layout from "@/app/components/Layout";
import { useAppContext } from "@/context/AppContext";
import AuthGuard from "@/components/AuthGuard";
import axios from 'axios';

// Only lazy load non-critical components
const DashboardCard = dynamic(() => import("@/app/dashboard/DashboardCard"), {
  loading: () => <div className="bg-white/10 p-4 sm:p-6 rounded-2xl animate-pulse h-32"></div>,
});

interface UserStats {
  sessionsCompleted: number;
  totalFocusTime: number;
  streak: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
  totalThoughts: number;
  activeThoughts: number;
  peakHour: number;
  memberSince: string;
  lastActive: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { thoughts, isLoading: contextLoading } = useAppContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);
  
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/user/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || contextLoading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }
  return (
    <AuthGuard allowBoth={true}>
      <Layout>
        <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Atma-Darshan</h1>
            <h2 className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8">Your Mirror to the Self</h2>
            
            {!session && (
              <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  👤 <strong>Guest Mode:</strong> You&apos;re viewing in guest mode. 
                  <Link href="/auth/login" className="underline hover:text-white transition-colors">
                    Sign in
                  </Link> to save your progress and sync across devices.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-8">
              {/* Card 1: Total Focus Sessions */}
              <DashboardCard title="Sessions Completed">
                <p className="text-4xl sm:text-5xl font-bold">{stats?.sessionsCompleted || 0}</p>
                <p className="text-sm text-white/70 mt-1">focus sessions</p>
              </DashboardCard>
              
              {/* Card 2: Session Streak */}
              <DashboardCard title="Session Streak">
                <p className="text-4xl sm:text-5xl font-bold">{stats?.streak || 0}</p>
                <p className="text-sm text-white/70 mt-1">consecutive days</p>
              </DashboardCard>
              
              {/* Card 3: Peak Focus Analysis */}
              <DashboardCard title="Peak Focus Analysis">
                <p className="text-4xl sm:text-5xl font-bold">
                  {stats?.peakHour ? `${stats.peakHour}:00` : '10:00'}
                </p>
                <p className="text-sm text-white/70 mt-1">Your most productive hour</p>
              </DashboardCard>
              
              {/* Card 4: Today's Sessions */}
              <DashboardCard title="Today's Sessions">
                <p className="text-4xl sm:text-5xl font-bold">{stats?.todaySessions || 0}</p>
                <p className="text-sm text-white/70 mt-1">completed today</p>
              </DashboardCard>
              
              {/* Card 5: This Week */}
              <DashboardCard title="This Week">
                <p className="text-4xl sm:text-5xl font-bold">{stats?.weekSessions || 0}</p>
                <p className="text-sm text-white/70 mt-1">sessions this week</p>
              </DashboardCard>
              
              {/* Card 6: Total Focus Time */}
              <DashboardCard title="Total Focus Time">
                <p className="text-4xl sm:text-5xl font-bold">
                  {Math.round((stats?.totalFocusTime || 0) / 60)}h
                </p>
                <p className="text-sm text-white/70 mt-1">hours of deep focus</p>
              </DashboardCard>

              {/* Bonus Card: Thoughts Captured */}
              <DashboardCard title="Thoughts Captured" className="sm:col-span-2 lg:col-span-3">
                 <p className="text-4xl sm:text-5xl font-bold">{stats?.totalThoughts || 0}</p>
                 <p className="text-sm text-white/70 mt-1">fleeting ideas saved (lifetime)</p>
                 <p className="text-xs text-white/50 mt-1">Active: {stats?.activeThoughts || thoughts.length}</p>
              </DashboardCard>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}