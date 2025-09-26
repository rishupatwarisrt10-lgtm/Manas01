// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/database';
import Session from '@/models/Session';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;
    const mode = searchParams.get('mode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectToDatabase();

    // Build query
    const query: any = { userId: session.user.id };
    if (mode) query.mode = mode;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Session.countDocuments(query);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode, duration, completed, startTime, endTime, pausedDuration, thoughtsCaptured } = await request.json();

    // Validation
    if (!mode || !['focus', 'shortBreak', 'longBreak'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid session mode' },
        { status: 400 }
      );
    }

    if (!duration || duration <= 0) {
      return NextResponse.json(
        { error: 'Duration must be greater than 0' },
        { status: 400 }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Create session
    const newSession = await Session.create({
      userId: session.user.id,
      mode,
      duration,
      completed: completed || false,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      pausedDuration: pausedDuration || 0,
      thoughtsCaptured: thoughtsCaptured || 0,
    });

    // Update user stats if session is completed and it's a focus session
    if (completed && mode === 'focus') {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { 
          sessionsCompleted: 1,
          totalFocusTime: duration 
        },
        lastActiveDate: new Date(),
      });
    }

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}