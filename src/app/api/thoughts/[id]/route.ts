// src/app/api/thoughts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/database';
import Thought from '@/models/Thought';
import mongoose from 'mongoose';

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid thought ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Soft delete: mark as deleted instead of removing
    const thought = await Thought.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id,
        isDeleted: { $ne: true } // Only update if not already deleted
      },
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      },
      { new: true }
    );

    if (!thought) {
      return NextResponse.json(
        { error: 'Thought not found or already deleted' },
        { status: 404 }
      );
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid thought ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateData: any = {};
    
    // Handle completion status toggle
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
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
    
    // Handle "dealt with" status
    if (isDealtWith !== undefined) {
      updateData.isDealtWith = isDealtWith;
      
      if (isDealtWith) {
        updateData.dealtWithAt = new Date();
        // Schedule for deletion at next midnight
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0); // Next midnight
        updateData.scheduledForDeletion = nextMidnight;
      } else {
        // If unmarking as dealt with, remove deletion schedule
        updateData.dealtWithAt = null;
        updateData.scheduledForDeletion = null;
      }
    }
    
    updateData.updatedAt = new Date();

    const thought = await Thought.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id,
        isDeleted: { $ne: true } // Only update if not deleted
      },
      updateData,
      { new: true }
    );

    if (!thought) {
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(thought);
  } catch (error) {
    console.error('Update thought error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}