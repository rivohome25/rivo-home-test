/**
 * Add this to your existing middleware.ts file
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, RATE_LIMIT_CONFIGS } from './lib/redis-rate-limiter';

export async function middleware(request: NextRequest) {
  // Apply global rate limiting before other middleware
  
  // Admin routes - very strict
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.admin);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Authentication routes - strict
  if (request.nextUrl.pathname.includes('/auth/') || 
      request.nextUrl.pathname.includes('/sign-in') ||
      request.nextUrl.pathname.includes('/sign-up')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.auth);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // File upload routes
  if (request.nextUrl.pathname.includes('/upload') || 
      request.method === 'POST' && request.headers.get('content-type')?.includes('multipart/form-data')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.fileUpload);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Payment routes
  if (request.nextUrl.pathname.includes('/stripe/') || 
      request.nextUrl.pathname.includes('/billing/')) {
    const rateLimitResult = await rateLimit(request, {
      windowMs: 10 * 60 * 1000, // 10 minutes
      limit: 5, // 5 payment attempts per 10 minutes
      message: 'Too many payment attempts. Please try again in 10 minutes.'
    });
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // API routes - moderate
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.api);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // General pages - generous
  const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.general);
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  // Continue with your existing middleware logic...
  const res = NextResponse.next();
  
  // Add rate limit headers to all responses
  const rateLimitHeaders = request.headers.get('x-ratelimit-remaining');
  if (rateLimitHeaders) {
    res.headers.set('X-RateLimit-Remaining', rateLimitHeaders);
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
