// src/app/api/user/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/database';
import User from '@/models/User';
import Session from '@/models/Session';
import Thought from '@/models/Thought';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user basic stats
    const user = await User.findById(session.user.id).select(
      'sessionsCompleted totalFocusTime streak lastActiveDate createdAt'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get additional stats from sessions
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySessions,
      weekSessions,
      monthSessions,
      totalThoughts,
      activeThoughts,
      recentSessions
    ] = await Promise.all([
      Session.countDocuments({
        userId: session.user.id,
        completed: true,
        startTime: { $gte: today }
      }),
      Session.countDocuments({
        userId: session.user.id,
        completed: true,
        startTime: { $gte: thisWeek }
      }),
      Session.countDocuments({
        userId: session.user.id,
        completed: true,
        startTime: { $gte: thisMonth }
      }),
      Thought.countDocuments({
        userId: session.user.id
        // Count ALL thoughts including deleted ones for dashboard stats
      }),
      Thought.countDocuments({
        userId: session.user.id,
        isDeleted: { $ne: true } // Count only active thoughts
      }),
      Session.find({
        userId: session.user.id,
        completed: true
      })
        .sort({ startTime: -1 })
        .limit(10)
        .select('mode duration startTime')
        .lean()
    ]);

    // Calculate streak (consecutive days with completed focus sessions)
    const streak = await calculateStreak(session.user.id);

    // Get peak productivity hours
    const peakHour = await getPeakProductivityHour(session.user.id);

    const stats = {
      sessionsCompleted: user.sessionsCompleted,
      totalFocusTime: user.totalFocusTime,
      streak,
      todaySessions,
      weekSessions,
      monthSessions,
      totalThoughts, // All thoughts including deleted (for lifetime count)
      activeThoughts, // Only non-deleted thoughts
      peakHour,
      memberSince: user.createdAt,
      lastActive: user.lastActiveDate,
      recentSessions,
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
  const sessions = await Session.find({
    userId,
    mode: 'focus',
    completed: true
  })
    .sort({ startTime: -1 })
    .select('startTime')
    .lean();

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const sessionDates = sessions.map(s => {
    const date = new Date(s.startTime);
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
  const sessions = await Session.find({
    userId,
    mode: 'focus',
    completed: true
  })
    .select('startTime')
    .lean();

  if (sessions.length === 0) return 10; // Default to 10 AM

  const hourCounts: { [hour: number]: number } = {};

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
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