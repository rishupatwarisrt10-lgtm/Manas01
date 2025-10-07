// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert field names for compatibility
    const preferences = {
      focusDuration: user.preferences?.focus_duration || 25,
      shortBreakDuration: user.preferences?.short_break_duration || 5,
      longBreakDuration: user.preferences?.long_break_duration || 15,
      theme: user.preferences?.theme || 'animated-gradient',
      notifications: user.preferences?.notifications !== false,
    };

    return NextResponse.json(preferences);
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

    // Convert field names to match Supabase schema
    const supabasePreferences = {
      focus_duration: preferences.focusDuration || 25,
      short_break_duration: preferences.shortBreakDuration || 5,
      long_break_duration: preferences.longBreakDuration || 15,
      theme: preferences.theme || 'animated-gradient',
      notifications: preferences.notifications !== false,
    };

    const user = await User.updateById(session.user.id, {
      preferences: supabasePreferences
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert back to frontend format
    const responsePreferences = {
      focusDuration: user.preferences?.focus_duration || 25,
      shortBreakDuration: user.preferences?.short_break_duration || 5,
      longBreakDuration: user.preferences?.long_break_duration || 15,
      theme: user.preferences?.theme || 'animated-gradient',
      notifications: user.preferences?.notifications !== false,
    };

    return NextResponse.json(responsePreferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}