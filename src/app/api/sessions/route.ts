// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Build query using Supabase
    let query = supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id);

    if (mode) {
      query = query.eq('mode', mode);
    }
    
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    query = query
      .order('start_time', { ascending: false })
      .range(skip, skip + limit - 1);

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Get sessions error:', error);
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (mode) {
      countQuery = countQuery.eq('mode', mode);
    }
    
    if (startDate) {
      countQuery = countQuery.gte('start_time', startDate);
    }
    
    if (endDate) {
      countQuery = countQuery.lte('start_time', endDate);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Get sessions count error:', countError);
      throw countError;
    }

    const total = count || 0;

    // Format sessions to match expected structure
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      userId: session.user_id, // Keep old field name for compatibility
      mode: session.mode,
      duration: session.duration,
      completed: session.completed,
      startTime: session.start_time, // Keep old field name for compatibility
      endTime: session.end_time, // Keep old field name for compatibility
      pausedDuration: session.paused_duration, // Keep old field name for compatibility
      thoughtsCaptured: session.thoughts_captured, // Keep old field name for compatibility
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
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

    // Create session
    const newSession = await Session.create({
      user_id: session.user.id,
      mode,
      duration,
      completed: completed || false,
      start_time: new Date(startTime),
      end_time: endTime ? new Date(endTime) : undefined,
      paused_duration: pausedDuration || 0,
      thoughts_captured: thoughtsCaptured || 0,
    });

    // Update user stats if session is completed and it's a focus session
    if (completed && mode === 'focus') {
      const currentUser = await User.findById(session.user.id);
      if (currentUser) {
        await User.updateById(session.user.id, {
          sessions_completed: currentUser.sessions_completed + 1,
          total_focus_time: currentUser.total_focus_time + duration,
          last_active_date: new Date(),
        });
      }
    }

    // Format response to match expected structure
    const formattedSession = {
      id: newSession.id,
      userId: newSession.user_id,
      mode: newSession.mode,
      duration: newSession.duration,
      completed: newSession.completed,
      startTime: newSession.start_time,
      endTime: newSession.end_time,
      pausedDuration: newSession.paused_duration,
      thoughtsCaptured: newSession.thoughts_captured,
      createdAt: newSession.created_at,
      updatedAt: newSession.updated_at,
    };

    return NextResponse.json(formattedSession, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}