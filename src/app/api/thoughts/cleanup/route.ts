// src/app/api/thoughts/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/database';
import Thought from '@/models/Thought';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    
    // Delete thoughts that are scheduled for deletion and the time has passed
    // Also clean up soft-deleted thoughts older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const result = await Thought.deleteMany({
      userId: session.user.id,
      $or: [
        // Original logic: thoughts marked as dealt with and scheduled
        {
          isDealtWith: true,
          scheduledForDeletion: { $lte: now }
        },
        // New logic: soft-deleted thoughts older than 30 days
        {
          isDeleted: true,
          deletedAt: { $lte: thirtyDaysAgo }
        }
      ]
    });

    return NextResponse.json({ 
      message: 'Cleanup completed',
      deletedCount: result.deletedCount 
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
export async function DELETE(request: NextRequest) {
  try {
    // Optional: Add API key authentication for global cleanup
    const apiKey = request.headers.get('x-api-key');
    if (process.env.CLEANUP_API_KEY && apiKey !== process.env.CLEANUP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    
    // Delete all thoughts from all users that are scheduled for deletion
    // Also clean up soft-deleted thoughts older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const result = await Thought.deleteMany({
      $or: [
        // Original logic: thoughts marked as dealt with and scheduled
        {
          isDealtWith: true,
          scheduledForDeletion: { $lte: now }
        },
        // New logic: soft-deleted thoughts older than 30 days
        {
          isDeleted: true,
          deletedAt: { $lte: thirtyDaysAgo }
        }
      ]
    });

    return NextResponse.json({ 
      message: 'Global cleanup completed',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Global cleanup thoughts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}