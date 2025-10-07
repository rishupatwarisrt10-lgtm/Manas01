// src/app/api/thoughts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Thought from '@/models/Thought';

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

    // Use Supabase for pagination and filtering
    const { data: thoughts, error } = await supabaseAdmin
      .from('thoughts')
      .select('*')
      .eq('user_id', session.user.id)
      .neq('is_deleted', true) // Exclude soft-deleted thoughts
      .order('timestamp', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Get thoughts error:', error);
      throw error;
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('thoughts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .neq('is_deleted', true);

    if (countError) {
      console.error('Get thoughts count error:', countError);
      throw countError;
    }

    const total = count || 0;

    // Format thoughts to match expected structure
    const formattedThoughts = thoughts.map(thought => ({
      id: thought.id,
      userId: thought.user_id, // Keep old field name for compatibility
      text: thought.text,
      timestamp: thought.timestamp,
      session: thought.session,
      tags: thought.tags,
      isCompleted: thought.is_completed, // Keep old field name for compatibility
      isDeleted: thought.is_deleted, // Keep old field name for compatibility
      deletedAt: thought.deleted_at,
      createdAt: thought.created_at,
      updatedAt: thought.updated_at,
    }));

    return NextResponse.json({
      thoughts: formattedThoughts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get thoughts error:', error);
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

    const { text, session: sessionData, tags } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Thought text is required' },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Thought text is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const thought = await Thought.create({
      user_id: session.user.id,
      text: text.trim(),
      session: sessionData,
      tags: tags || [],
      timestamp: new Date(),
      is_completed: false, // Initialize as not completed
      is_deleted: false, // Initialize as not deleted
    });

    // Format response to match expected structure
    const formattedThought = {
      id: thought.id,
      userId: thought.user_id,
      text: thought.text,
      timestamp: thought.timestamp,
      session: thought.session,
      tags: thought.tags,
      isCompleted: thought.is_completed,
      isDeleted: thought.is_deleted,
      deletedAt: thought.deleted_at,
      createdAt: thought.created_at,
      updatedAt: thought.updated_at,
    };

    return NextResponse.json(formattedThought, { status: 201 });
  } catch (error) {
    console.error('Create thought error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}