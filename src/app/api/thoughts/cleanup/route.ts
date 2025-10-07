// src/app/api/thoughts/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Thought from '@/models/Thought';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Delete thoughts that are soft-deleted and older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const { data: deletedThoughts, error } = await supabaseAdmin
      .from('thoughts')
      .delete()
      .eq('user_id', session.user.id)
      .eq('is_deleted', true)
      .lte('deleted_at', thirtyDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('Cleanup thoughts error:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'Cleanup completed',
      deletedCount: deletedThoughts?.length || 0
    });
  } catch (error) {
    console.error('Cleanup thoughts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Global cleanup endpoint (for cron jobs or admin use)
export async function DELETE(_request: NextRequest) {
  try {
    // Optional: Add API key authentication for global cleanup
    const apiKey = _request.headers.get('x-api-key');
    if (process.env.CLEANUP_API_KEY && apiKey !== process.env.CLEANUP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Delete all thoughts from all users that are soft-deleted and older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const { data: deletedThoughts, error } = await supabaseAdmin
      .from('thoughts')
      .delete()
      .eq('is_deleted', true)
      .lte('deleted_at', thirtyDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('Global cleanup thoughts error:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'Global cleanup completed',
      deletedCount: deletedThoughts?.length || 0
    });
  } catch (error) {
    console.error('Global cleanup thoughts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}