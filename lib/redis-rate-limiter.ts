/**
 * @file redis-rate-limiter.ts
 * @description Enterprise-grade Redis-backed rate limiting (Edge Runtime compatible)
 */

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
  private isEdgeRuntime: boolean;
  private fallbackStore = new Map<string, { count: number; resetTime: number }>();

  private constructor() {
    // Check if we're in Edge Runtime
    this.isEdgeRuntime = typeof EdgeRuntime !== 'undefined';
    
    if (this.isEdgeRuntime) {
      console.log('🔄 Using in-memory rate limiting (Edge Runtime)');
    } else {
      console.log('🔄 Redis rate limiter initialized (Node.js Runtime)');
    }
  }

  static getInstance(): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter();
    }
    return RedisRateLimiter.instance;
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
    
    try {
      if (this.isEdgeRuntime) {
        // Always use in-memory for Edge Runtime
        return this.checkMemoryRateLimit(key, config, now);
      } else {
        // Try Redis in Node.js runtime, fallback to memory
        return await this.checkRedisOrFallback(key, config, now);
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

  private async checkRedisOrFallback(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitResponse> {
    // Try using Redis with REST API (Upstash compatible)
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      try {
        return await this.checkUpstashRedis(key, config, now, redisUrl, redisToken);
      } catch (error) {
        console.warn('Upstash Redis failed, falling back to memory:', error);
      }
    }
    
    // Fallback to memory
    return this.checkMemoryRateLimit(key, config, now);
  }

  private async checkUpstashRedis(
    key: string,
    config: RateLimitConfig,
    now: number,
    redisUrl: string,
    redisToken: string
  ): Promise<RateLimitResponse> {
    const windowStart = now - config.windowMs;
    
    // Use Redis REST API for Edge Runtime compatibility
    const headers = {
      'Authorization': `Bearer ${redisToken}`,
      'Content-Type': 'application/json',
    };

    // Create pipeline commands
    const pipeline = [
      ['ZREMRANGEBYSCORE', key, 0, windowStart],
      ['ZCARD', key],
      ['ZADD', key, now, `${now}-${Math.random()}`],
      ['EXPIRE', key, Math.ceil(config.windowMs / 1000)]
    ];

    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pipeline)
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status}`);
    }

    const results = await response.json();
    
    if (!Array.isArray(results) || results.length < 2) {
      throw new Error('Invalid Redis response');
    }

    const currentCount = (results[1].result || 0) + 1; // +1 for the request we just added
    const resetTime = new Date(now + config.windowMs);
    
    const success = currentCount <= config.limit;
    
    if (!success) {
      // Remove the request we just added since we're rejecting it
      await fetch(`${redisUrl}/ZREM/${key}/${now}-${Math.random()}`, {
        method: 'POST',
        headers
      });
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
    now: number
  ): RateLimitResponse {
    // Clean up expired entries (only keep last 1000 to prevent memory leaks)
    if (this.fallbackStore.size > 1000) {
      const entries = Array.from(this.fallbackStore.entries());
      entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
      
      // Remove oldest 200 entries
      for (let i = 0; i < 200; i++) {
        this.fallbackStore.delete(entries[i][0]);
      }
    }
    
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

  // Enhanced logging for rate limit events
  async logRateLimit(
    request: NextRequest,
    config: RateLimitConfig,
    result: RateLimitResponse
  ): Promise<void> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!result.success) {
      console.warn(`🚫 Rate limit exceeded`, {
        ip,
        path: request.nextUrl.pathname,
        method: request.method,
        userAgent: userAgent.substring(0, 100),
        limit: result.limit,
        current: result.current,
        resetTime: result.resetTime.toISOString(),
        timestamp: new Date().toISOString()
      });
    } else if (result.remaining <= Math.ceil(config.limit * 0.1)) {
      // Warn when approaching rate limit (90% used)
      console.warn(`⚠️ Rate limit warning`, {
        ip,
        path: request.nextUrl.pathname,
        limit: result.limit,
        remaining: result.remaining,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Rate limiting middleware factory
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const limiter = RedisRateLimiter.getInstance();
  const result = await limiter.checkRateLimit(request, config);
  
  // Log the rate limit check
  await limiter.logRateLimit(request, config, result);
  
  if (!result.success) {
    const response = NextResponse.json(
      { 
        error: config.message || 'Too many requests',
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime.toISOString()
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());
    response.headers.set('Retry-After', Math.ceil(config.windowMs / 1000).toString());
    
    return response;
  }
  
  return null; // Allow request to proceed
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Very strict for sensitive endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    message: 'Too many authentication attempts'
  },
  
  // Moderate for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    limit: 100,
    message: 'API rate limit exceeded'
  },
  
  // Lenient for general pages
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000,
    message: 'Too many requests'
  },
  
  // Strict for booking operations
  booking: {
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10,
    message: 'Too many booking attempts'
  },
  
  // Admin endpoints - very strict
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50,
    message: 'Admin rate limit exceeded'
  }
} as const;

export default RedisRateLimiter;
