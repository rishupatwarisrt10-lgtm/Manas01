// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Allow all requests if environment variables are not properly configured
    if (!process.env.NEXTAUTH_SECRET || !process.env.NEXTAUTH_URL) {
      console.warn('NextAuth not properly configured, allowing all requests');
      return NextResponse.next();
    }
    
    // Skip middleware for API routes, static files, and auth pages
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/auth/') ||
      pathname.includes('.') ||
      pathname === '/'
    ) {
      return NextResponse.next();
    }
    
    // For protected routes, check if user has a valid session token
    // This is a simplified check - in production you'd want to verify the JWT
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token');
    
    const protectedRoutes: string[] = []; // Remove all route protection for guest access
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute && !sessionToken) {
      // Redirect to login if accessing protected route without session
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of any error, allow the request to proceed
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};