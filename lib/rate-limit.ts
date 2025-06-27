/**
 * @file rate-limit.ts
 * @description Simple rate limiting utility for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  limit: number;         // Maximum number of requests allowed
  windowMs: number;      // Time window in milliseconds
  message?: string;      // Optional error message
}

// In-memory store for rate limiting
// Note: This will reset on server restart. For production,
// consider using Redis or another persistent store
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

/**
 * Cleanup expired rate limit entries periodically
 */
const cleanupInterval = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, cleanupInterval);

/**
 * Rate limiting middleware for Next.js API routes
 * @param request NextRequest object
 * @param config Rate limiting configuration
 * @returns NextResponse object if rate limit is exceeded, null otherwise
 */
export function rateLimit(request: NextRequest, config: RateLimitConfig): NextResponse | null {
  const { limit, windowMs, message = 'Too many requests, please try again later.' } = config;
  
  // Get client IP for rate limiting
  // Use X-Forwarded-For header if available, fallback to connection remote address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown-ip') + ':' + request.nextUrl.pathname;
  
  // Get current timestamp
  const now = Date.now();
  
  // Initialize or get existing entry
  const entry = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };
  
  // If the reset time has passed, reset the counter
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }
  
  // Increment request count
  entry.count += 1;
  
  // Update store
  rateLimitStore.set(ip, entry);
  
  // Check if rate limit is exceeded
  if (entry.count > limit) {
    // Calculate remaining time until reset
    const remainingMs = entry.resetTime - now;
    const seconds = Math.ceil(remainingMs / 1000);
    
    // Return rate limit error response
    return NextResponse.json(
      { error: message },
      { 
        status: 429, 
        headers: {
          'Retry-After': seconds.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
        }
      }
    );
  }
  
  // If rate limit is not exceeded, return null to continue
  return null;
} 