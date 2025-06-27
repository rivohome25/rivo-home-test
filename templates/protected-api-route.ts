/**
 * @file protected-api-route-template.ts
 * @description Template for creating rate-limited API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit-middleware';
import { logger } from '@/lib/secure-logger';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Authentication rate limiting for auth-related endpoints
    if (request.nextUrl.pathname.includes('/auth/')) {
      const authRateLimitResult = await authRateLimit(request);
      if (authRateLimitResult) {
        return authRateLimitResult;
      }
    }
    
    // Your API logic here
    logger.info('API request processed', {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    logger.error('API error', { error: error.message, endpoint: request.nextUrl.pathname });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to other HTTP methods as needed
export async function GET(request: NextRequest) {
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  // Your GET logic here
  return NextResponse.json({ message: 'Hello from protected API' });
}
