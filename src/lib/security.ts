// src/lib/security.ts
import { NextRequest, NextResponse } from 'next/server';

// Security headers for production
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // CSP (Content Security Policy)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return response;
}

// Rate limiting helper
export function createRateLimitResponse(retryAfter: number): NextResponse {
  const response = NextResponse.json(
    { error: 'Too Many Requests' },
    { status: 429 }
  );
  
  response.headers.set('Retry-After', retryAfter.toString());
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '0');
  
  return response;
}

// Input sanitization
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove XSS characters
      .slice(0, 10000); // Prevent DoS via large inputs
  }
  
  if (Array.isArray(input)) {
    return input.slice(0, 100).map(sanitizeInput); // Limit array size
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {};
    const inputObj = input as Record<string, unknown>;
    Object.keys(inputObj).slice(0, 50).forEach(key => { // Limit object keys
      sanitized[key] = sanitizeInput(inputObj[key]);
    });
    return sanitized;
  }
  
  return input;
}

// Enhanced error handler that doesn't leak sensitive info
export function createErrorResponse(error: unknown, isDev: boolean = false): NextResponse {
  console.error('API Error:', error);
  
  // In development, show more details
  if (isDev && process.env.NODE_ENV === 'development') {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
  
  // In production, generic error message
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Validate origin for CORS
export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow same-origin requests
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ];
  
  return allowedOrigins.includes(origin);
}

// API key validation (for future use)
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) return true; // Skip validation if not configured
  
  return apiKey === validApiKey;
}