// src/app/api/thoughts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid thought ID' },
        { status: 400 }
      );
    }

    // Soft delete: mark as deleted instead of removing
    const { error } = await supabaseAdmin
      .from('thoughts')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('is_deleted', true) // Only update if not already deleted
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      // Check if the thought exists but is already deleted
      const { data: deletedThought, error: checkError } = await supabaseAdmin
        .from('thoughts')
        .select('id')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .eq('is_deleted', true)
        .single();
      
      if (!checkError && deletedThought) {
        // Thought was already deleted, return success to prevent errors
        return NextResponse.json({ message: 'Thought was already deleted' });
      }
      
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      );
    }

    if (error) {
      console.error('Delete thought error:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Thought deleted successfully' });
  } catch (error) {
    console.error('Delete thought error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { text, tags, isDealtWith, isCompleted } = await request.json();

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid thought ID' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    
    // Handle completion status toggle
    if (isCompleted !== undefined) {
      updateData.is_completed = isCompleted;
    }
    
    // Handle text and tags updates
    if (text !== undefined) {
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
      updateData.text = text.trim();
    }
    
    if (tags !== undefined) {
      updateData.tags = tags || [];
    }
    
    // Handle "dealt with" status (if your app supports this)
    if (isDealtWith !== undefined) {
      // Note: This field doesn't exist in our Supabase schema, 
      // but we can add it to the completion status
      updateData.is_completed = isDealtWith;
      
      if (isDealtWith) {
        // You might want to add these fields to your schema if needed
        // updateData.dealt_with_at = new Date().toISOString();
        // Schedule for deletion at next midnight
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0); // Next midnight
        // updateData.scheduled_for_deletion = nextMidnight.toISOString();
      }
    }

    const { data: thought, error } = await supabaseAdmin
      .from('thoughts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .neq('is_deleted', true) // Only update if not deleted
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Thought not found' },
          { status: 404 }
        );
      }
      console.error('Update thought error:', error);
      throw error;
    }

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

    return NextResponse.json(formattedThought);
  } catch (error) {
    console.error('Update thought error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}