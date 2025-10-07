// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/supabase';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database connection
    const dbHealthy = await testConnection();
    const dbResponseTime = Date.now() - startTime;
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    const envHealthy = missingEnvVars.length === 0;
    
    // Overall health status
    const healthy = dbHealthy && envHealthy;
    
    const healthData = {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          responseTime: dbResponseTime,
        },
        environment: {
          status: envHealthy ? 'healthy' : 'unhealthy',
          missingVars: missingEnvVars,
        },
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    };
    
    return NextResponse.json(healthData, {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Simple liveness probe
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}