// Debug endpoint to check auth configuration
import { NextResponse } from 'next/server';

export async function GET() {
  const debugInfo = {
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'NOT SET',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
    environment: {
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: !!process.env.VERCEL,
      isPreview: process.env.VERCEL_ENV === 'preview'
    }
  };

  return NextResponse.json(debugInfo);
}