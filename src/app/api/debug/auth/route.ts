// Debug endpoint to check auth configuration
import { NextResponse } from 'next/server';

export async function GET() {
  const debugInfo = {
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json(debugInfo);
}