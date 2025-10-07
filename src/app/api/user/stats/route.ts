// src/app/api/user/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user basic stats
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get additional stats from sessions
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySessionsResult,
      weekSessionsResult,
      monthSessionsResult,
      totalThoughtsResult,
      activeThoughtsResult,
      recentSessionsResult
    ] = await Promise.all([
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('completed', true)
        .gte('start_time', today.toISOString()),
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('completed', true)
        .gte('start_time', thisWeek.toISOString()),
      supabaseAdmin
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('completed', true)
        .gte('start_time', thisMonth.toISOString()),
      supabaseAdmin
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id),
      supabaseAdmin
        .from('thoughts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .neq('is_deleted', true),
      supabaseAdmin
        .from('sessions')
        .select('mode, duration, start_time')
        .eq('user_id', session.user.id)
        .eq('completed', true)
        .order('start_time', { ascending: false })
        .limit(10)
    ]);

    const todaySessions = todaySessionsResult.count || 0;
    const weekSessions = weekSessionsResult.count || 0;
    const monthSessions = monthSessionsResult.count || 0;
    const totalThoughts = totalThoughtsResult.count || 0;
    const activeThoughts = activeThoughtsResult.count || 0;
    const recentSessions = recentSessionsResult.data || [];

    // Calculate streak (consecutive days with completed focus sessions)
    const streak = await calculateStreak(session.user.id);

    // Get peak productivity hours
    const peakHour = await getPeakProductivityHour(session.user.id);

    const stats = {
      sessionsCompleted: user.sessions_completed,
      totalFocusTime: user.total_focus_time,
      streak,
      todaySessions,
      weekSessions,
      monthSessions,
      totalThoughts, // All thoughts including deleted (for lifetime count)
      activeThoughts, // Only non-deleted thoughts
      peakHour,
      memberSince: user.created_at,
      lastActive: user.last_active_date,
      recentSessions: recentSessions.map(s => ({
        mode: s.mode,
        duration: s.duration,
        startTime: s.start_time, // Keep old field name for compatibility
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateStreak(userId: string): Promise<number> {
  const { data: sessions, error } = await supabaseAdmin
    .from('sessions')
    .select('start_time')
    .eq('user_id', userId)
    .eq('mode', 'focus')
    .eq('completed', true)
    .order('start_time', { ascending: false });

  if (error || !sessions || sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const sessionDates = sessions.map(s => {
    const date = new Date(s.start_time);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });

  const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a);

  for (const sessionDate of uniqueDates) {
    if (sessionDate === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (sessionDate === currentDate.getTime() + (24 * 60 * 60 * 1000)) {
      // Allow for yesterday if today hasn't been completed yet
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

async function getPeakProductivityHour(userId: string): Promise<number> {
  const { data: sessions, error } = await supabaseAdmin
    .from('sessions')
    .select('start_time')
    .eq('user_id', userId)
    .eq('mode', 'focus')
    .eq('completed', true);

  if (error || !sessions || sessions.length === 0) return 10; // Default to 10 AM

  const hourCounts: { [hour: number]: number } = {};

  sessions.forEach(session => {
    const hour = new Date(session.start_time).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let peakHour = 10;
  let maxCount = 0;

  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  }

  return peakHour;
}