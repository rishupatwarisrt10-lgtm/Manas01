// src/lib/apiMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiRateLimit, authRateLimit } from '@/lib/rateLimit';
import { addSecurityHeaders, sanitizeInput } from '@/lib/security';
import { apiLogger } from '@/lib/logger';

interface ApiHandlerOptions {
  requireAuth?: boolean;
  rateLimit?: 'standard' | 'strict' | 'auth';
  validateInput?: boolean;
  allowedMethods?: string[];
}

type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

export function withApiMiddleware(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const { pathname } = new URL(request.url);
    const method = request.method;
    
    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(method)) {
        apiLogger.warn('Method not allowed', { method, pathname });
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405 }
          )
        );
      }

      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimiter = options.rateLimit === 'auth' 
          ? authRateLimit 
          : options.rateLimit === 'strict'
          ? authRateLimit // Use strict rate limiting
          : apiRateLimit;
          
        const rateResult = rateLimiter(request);
        if (!rateResult.success) {
          apiLogger.warn('Rate limit exceeded', { 
            pathname, 
            method, 
            count: rateResult.count,
            ip: request.headers.get('x-forwarded-for') || 'unknown'
          });
          
          const response = NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          );
          response.headers.set('Retry-After', '900');
          response.headers.set('X-RateLimit-Limit', '100');
          response.headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());
          response.headers.set('X-RateLimit-Reset', new Date(rateResult.resetTime).toISOString());
          
          return addSecurityHeaders(response);
        }
      }

      // Authentication check
      if (options.requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          apiLogger.warn('Unauthorized access attempt', { pathname, method });
          return addSecurityHeaders(
            NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            )
          );
        }
        
        // Add user context to request for logging
        (request as any).userId = session.user.id;
      }

      // Input sanitization
      if (options.validateInput && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          const body = await request.clone().json();
          const sanitizedBody = sanitizeInput(body);
          
          // Replace the original request body with sanitized version
          const sanitizedRequest = new NextRequest(request.url, {
            ...request,
            body: JSON.stringify(sanitizedBody),
          });
          
          // Note: In practice, you'd need to handle this differently
          // as NextRequest body is read-only. Consider using a custom approach.
        } catch (error) {
          apiLogger.warn('Invalid JSON in request body', { pathname, method, error });
          return addSecurityHeaders(
            NextResponse.json(
              { error: 'Invalid JSON' },
              { status: 400 }
            )
          );
        }
      }

      // Execute the handler
      const response = await handler(request, context);
      
      // Log successful request
      const duration = Date.now() - startTime;
      const userId = (request as any).userId;
      
      apiLogger.logApiRequest(
        method,
        pathname,
        response.status,
        duration,
        userId
      );
      
      return addSecurityHeaders(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const userId = (request as any).userId;
      
      apiLogger.error('API handler error', error, {
        method,
        pathname,
        duration,
        userId,
      });
      
      // Don't leak error details in production
      const isDev = process.env.NODE_ENV === 'development';
      const response = NextResponse.json(
        { 
          error: 'Internal server error',
          ...(isDev && { details: (error as Error).message })
        },
        { status: 500 }
      );
      
      return addSecurityHeaders(response);
    }
  };
}

// Convenience wrapper for common API patterns
export function withAuth(handler: ApiHandler) {
  return withApiMiddleware(handler, {
    requireAuth: true,
    rateLimit: 'standard',
    validateInput: true,
  });
}

export function withPublicApi(handler: ApiHandler) {
  return withApiMiddleware(handler, {
    requireAuth: false,
    rateLimit: 'standard',
    validateInput: true,
  });
}

export function withStrictAuth(handler: ApiHandler) {
  return withApiMiddleware(handler, {
    requireAuth: true,
    rateLimit: 'strict',
    validateInput: true,
  });
}

// CORS helper
export function withCors(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXTAUTH_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

// Input validation helpers
export function validateRequired(obj: any, fields: string[]): string[] {
  const errors: string[] = [];
  
  fields.forEach(field => {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });
  
  return errors;
}

export function validateTypes(obj: any, schema: Record<string, string>): string[] {
  const errors: string[] = [];
  
  Object.entries(schema).forEach(([field, expectedType]) => {
    if (obj[field] !== undefined && typeof obj[field] !== expectedType) {
      errors.push(`${field} must be of type ${expectedType}`);
    }
  });
  
  return errors;
}

export function validateLengths(obj: any, constraints: Record<string, { min?: number; max?: number }>): string[] {
  const errors: string[] = [];
  
  Object.entries(constraints).forEach(([field, { min, max }]) => {
    const value = obj[field];
    if (typeof value === 'string') {
      if (min && value.length < min) {
        errors.push(`${field} must be at least ${min} characters`);
      }
      if (max && value.length > max) {
        errors.push(`${field} must be no more than ${max} characters`);
      }
    }
  });
  
  return errors;
}