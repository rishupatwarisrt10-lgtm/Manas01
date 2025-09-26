// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/database';
import User from '@/models/User';
import { authRateLimit } from '@/lib/rateLimit';
import { validateRegistration, sanitizeText } from '@/lib/validation';
import { addSecurityHeaders, createErrorResponse } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = authRateLimit(request);
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
      response.headers.set('Retry-After', '900'); // 15 minutes
      return addSecurityHeaders(response);
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    const validation = validateRegistration({ email, password, name });
    if (!validation.valid) {
      return addSecurityHeaders(NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      ));
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      ));
    }

    // Hash password with increased rounds for better security
    const hashedPassword = await bcrypt.hash(password, 14);

    // Create user with sanitized data
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name ? sanitizeText(name) : '',
      provider: 'credentials',
    });

    // Return success (don't return password)
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
    
    return addSecurityHeaders(response);
  } catch (error) {
    return createErrorResponse(error, process.env.NODE_ENV === 'development');
  }
}