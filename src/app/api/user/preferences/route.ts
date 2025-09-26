// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/database';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('preferences');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();

    // Validate preferences
    if (preferences.focusDuration && (preferences.focusDuration < 1 || preferences.focusDuration > 120)) {
      return NextResponse.json(
        { error: 'Focus duration must be between 1 and 120 minutes' },
        { status: 400 }
      );
    }

    if (preferences.shortBreakDuration && (preferences.shortBreakDuration < 1 || preferences.shortBreakDuration > 30)) {
      return NextResponse.json(
        { error: 'Short break duration must be between 1 and 30 minutes' },
        { status: 400 }
      );
    }

    if (preferences.longBreakDuration && (preferences.longBreakDuration < 5 || preferences.longBreakDuration > 60)) {
      return NextResponse.json(
        { error: 'Long break duration must be between 5 and 60 minutes' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { preferences } },
      { new: true, runValidators: true }
    ).select('preferences');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.preferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}