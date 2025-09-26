// src/lib/rateLimit.ts
import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest) => {
    const key = config.keyGenerator 
      ? config.keyGenerator(req) 
      : getClientIP(req);
      
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up old entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < windowStart) {
        delete store[k];
      }
    });
    
    // Get or create rate limit data
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }
    
    const rateData = store[key];
    
    // Reset if window expired
    if (rateData.resetTime < now) {
      rateData.count = 0;
      rateData.resetTime = now + config.windowMs;
    }
    
    rateData.count++;
    
    return {
      success: rateData.count <= config.maxRequests,
      count: rateData.count,
      remaining: Math.max(0, config.maxRequests - rateData.count),
      resetTime: rateData.resetTime
    };
  };
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Predefined rate limiters
export const authRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const apiRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const strictRateLimit = rateLimit({
  maxRequests: 3,
  windowMs: 60 * 1000, // 1 minute
});