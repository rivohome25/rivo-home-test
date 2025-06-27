/**
 * @file rate-limit-middleware.ts
 * @description Middleware for applying rate limits to different endpoint types
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMIT_CONFIGS } from './redis-rate-limiter';

/**
 * Authentication rate limiting middleware
 */
export async function authRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Stricter limits for failed authentication attempts
  const isPasswordReset = request.nextUrl.pathname.includes('reset');
  
  const config = isPasswordReset 
    ? RATE_LIMIT_CONFIGS.passwordReset 
    : RATE_LIMIT_CONFIGS.auth;
  
  return await rateLimit(request, {
    ...config,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      const endpoint = isPasswordReset ? 'password-reset' : 'auth';
      return `rate_limit:${ip}:${endpoint}`;
    }
  });
}

/**
 * Admin endpoint rate limiting middleware
 */
export async function adminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return await rateLimit(request, {
    ...RATE_LIMIT_CONFIGS.admin,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      // More restrictive key for admin endpoints
      return `rate_limit:admin:${ip}:${userAgent.substring(0, 20)}`;
    }
  });
}

/**
 * File upload rate limiting middleware
 */
export async function fileUploadRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return await rateLimit(request, {
    ...RATE_LIMIT_CONFIGS.fileUpload,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      return `rate_limit:upload:${ip}`;
    }
  });
}

/**
 * Payment/billing rate limiting middleware
 */
export async function paymentRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return await rateLimit(request, {
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5, // 5 payment attempts per 10 minutes
    message: 'Too many payment attempts. Please try again in 10 minutes.',
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      return `rate_limit:payment:${ip}`;
    }
  });
}

/**
 * API route rate limiting middleware
 */
export async function apiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Different limits based on authentication status
  const authHeader = request.headers.get('authorization');
  const isAuthenticated = !!authHeader;
  
  const config = isAuthenticated 
    ? { ...RATE_LIMIT_CONFIGS.api, limit: 200 } // Higher limit for authenticated users
    : RATE_LIMIT_CONFIGS.api;
  
  return await rateLimit(request, config);
}

/**
 * Brute force protection for specific user accounts
 */
export async function userSpecificRateLimit(
  request: NextRequest, 
  userId: string, 
  action: string
): Promise<NextResponse | null> {
  return await rateLimit(request, {
    windowMs: 30 * 60 * 1000, // 30 minutes
    limit: 10, // 10 attempts per 30 minutes per user
    message: `Too many ${action} attempts for this account. Please try again in 30 minutes.`,
    keyGenerator: () => `rate_limit:user:${userId}:${action}`
  });
}
