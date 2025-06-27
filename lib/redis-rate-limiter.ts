/**
 * @file redis-rate-limiter.ts
 * @description Enterprise-grade Redis-backed rate limiting
 */

import { createClient } from 'redis';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  limit: number;        // Maximum requests per window
  message?: string;     // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitResponse {
  success: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

class RedisRateLimiter {
  private static instance: RedisRateLimiter;
  private client: ReturnType<typeof createClient> | null = null;
  private fallbackStore = new Map<string, { count: number; resetTime: number }>();

  private constructor() {
    this.initRedis();
  }

  static getInstance(): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter();
    }
    return RedisRateLimiter.instance;
  }

  private async initRedis(): Promise<void> {
    try {
      // Use Redis if available, fallback to in-memory
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      
      if (redisUrl) {
        this.client = createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 5000,
            commandTimeout: 5000,
          }
        });
        
        this.client.on('error', (err) => {
          console.warn('Redis rate limiter error, falling back to memory:', err.message);
          this.client = null;
        });
        
        await this.client.connect();
        console.log('✅ Redis rate limiter connected');
      } else {
        console.warn('⚠️ No Redis URL found, using in-memory rate limiting');
      }
    } catch (error) {
      console.warn('Redis connection failed, using in-memory fallback:', error);
      this.client = null;
    }
  }

  private getClientIP(request: NextRequest): string {
    // Get real IP, considering various proxy headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const remoteAddress = request.headers.get('remote-address');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIp || remoteAddress || 'unknown';
  }

  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;
    return `rate_limit:${ip}:${path}`;
  }

  async checkRateLimit(
    request: NextRequest, 
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const key = config.keyGenerator 
      ? config.keyGenerator(request) 
      : this.defaultKeyGenerator(request);
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      if (this.client) {
        return await this.checkRedisRateLimit(key, config, now, windowStart);
      } else {
        return this.checkMemoryRateLimit(key, config, now, windowStart);
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request but log it
      return {
        success: true,
        limit: config.limit,
        current: 0,
        remaining: config.limit,
        resetTime: new Date(now + config.windowMs)
      };
    }
  }

  private async checkRedisRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<RateLimitResponse> {
    if (!this.client) throw new Error('Redis client not available');

    // Use Redis pipeline for atomic operations
    const pipeline = this.client.multi();
    
    // Remove expired entries
    pipeline.zRemRangeByScore(key, 0, windowStart);
    
    // Count current requests
    pipeline.zCard(key);
    
    // Add current request
    pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) throw new Error('Redis pipeline failed');
    
    const currentCount = (results[1] as number) + 1; // +1 for the request we just added
    const resetTime = new Date(now + config.windowMs);
    
    const success = currentCount <= config.limit;
    
    if (!success) {
      // Remove the request we just added since we're rejecting it
      await this.client.zRem(key, `${now}-${Math.random()}`);
    }
    
    return {
      success,
      limit: config.limit,
      current: success ? currentCount : currentCount - 1,
      remaining: Math.max(0, config.limit - currentCount),
      resetTime
    };
  }

  private checkMemoryRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): RateLimitResponse {
    // Clean up expired entries
    for (const [k, v] of this.fallbackStore.entries()) {
      if (v.resetTime < now) {
        this.fallbackStore.delete(k);
      }
    }
    
    const entry = this.fallbackStore.get(key) || { count: 0, resetTime: now + config.windowMs };
    
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
    }
    
    entry.count++;
    this.fallbackStore.set(key, entry);
    
    const success = entry.count <= config.limit;
    
    return {
      success,
      limit: config.limit,
      current: entry.count,
      remaining: Math.max(0, config.limit - entry.count),
      resetTime: new Date(entry.resetTime)
    };
  }

  async logRateLimitViolation(
    request: NextRequest,
    config: RateLimitConfig,
    result: RateLimitResponse
  ): Promise<void> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const path = request.nextUrl.pathname;
    
    console.warn('🚨 Rate limit exceeded:', {
      ip,
      path,
      userAgent,
      limit: result.limit,
      current: result.current,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Integrate with your security monitoring system
    // await securityMonitoring.alert('RATE_LIMIT_EXCEEDED', { ip, path, userAgent });
  }
}

export const rateLimiter = RedisRateLimiter.getInstance();

/**
 * Middleware function for rate limiting
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await rateLimiter.checkRateLimit(request, config);
  
  if (!result.success) {
    await rateLimiter.logRateLimitViolation(request, config, result);
    
    const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
    
    return NextResponse.json(
      { 
        error: config.message || 'Too many requests, please try again later.',
        retryAfter 
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
        }
      }
    );
  }
  
  return null;
}

/**
 * Rate limiting configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - very strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  
  // Password reset - prevent abuse
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3, // 3 attempts per hour
    message: 'Too many password reset requests. Please try again in 1 hour.',
  },
  
  // File uploads - prevent abuse
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // 20 uploads per hour
    message: 'Too many file uploads. Please try again later.',
  },
  
  // Admin endpoints - very strict
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10, // 10 requests per 5 minutes
    message: 'Admin endpoint rate limit exceeded.',
  },
  
  // API endpoints - moderate
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per 15 minutes
    message: 'API rate limit exceeded. Please try again later.',
  },
  
  // General web pages - generous
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests. Please try again later.',
  }
};
