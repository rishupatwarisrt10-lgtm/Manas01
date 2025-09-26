// src/app/api/thoughts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/database';
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

    await connectToDatabase();

    const thoughts = await Thought.find({ 
      userId: session.user.id,
      isDeleted: { $ne: true } // Exclude soft-deleted thoughts
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Thought.countDocuments({ 
      userId: session.user.id,
      isDeleted: { $ne: true } // Exclude soft-deleted thoughts
    });

    return NextResponse.json({
      thoughts,
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

    await connectToDatabase();

    const thought = await Thought.create({
      userId: session.user.id,
      text: text.trim(),
      session: sessionData,
      tags: tags || [],
      timestamp: new Date(),
      isCompleted: false, // Initialize as not completed
      isDeleted: false, // Initialize as not deleted
    });

    return NextResponse.json(thought, { status: 201 });
  } catch (error) {
    console.error('Create thought error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}