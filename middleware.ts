import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { rateLimit } from './lib/redis-rate-limiter';

// Add protected routes that require authentication
const protectedRoutes = ['/dashboard', '/complete-profile', '/onboarding', '/settings', '/dashboard/diy-library'];

// Rate limiting configurations for different route types
const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Increased from 5 to 10 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour window
    limit: 3, // 3 signup attempts per hour (more reasonable)
    message: 'Too many signup attempts. Please try again in an hour.'
  },
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10, // 10 requests per 5 minutes
    message: 'Too many admin requests. Please try again in 5 minutes.'
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per 15 minutes
    message: 'Too many API requests. Please try again later.'
  },
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // 20 uploads per hour
    message: 'Too many file uploads. Please try again later.'
  },
  payment: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5, // 5 payment attempts per 10 minutes
    message: 'Too many payment attempts. Please try again in 10 minutes.'
  }
};

export async function middleware(request: NextRequest) {
  // Apply rate limiting first before other middleware
  
  // Admin routes - very strict
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.admin);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Signup routes - separate, more lenient rate limiting
  if (request.nextUrl.pathname.includes('/sign-up')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.signup);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Other authentication routes - moderate limiting
  else if (request.nextUrl.pathname.includes('/auth/') || 
           request.nextUrl.pathname.includes('/sign-in') ||
           request.nextUrl.pathname.startsWith('/api/auth/')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.auth);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // File upload routes
  if (request.nextUrl.pathname.includes('/upload') || 
      (request.method === 'POST' && request.headers.get('content-type')?.includes('multipart/form-data'))) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.fileUpload);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Payment routes
  if (request.nextUrl.pathname.includes('/stripe/') || 
      request.nextUrl.pathname.includes('/billing/') ||
      request.nextUrl.pathname.includes('/payment/')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.payment);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // General API routes - moderate
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.api);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  // Create a response first
  const res = NextResponse.next();
  
  // Create a Supabase client with the recommended API
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Check if the user is authenticated
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // If accessing protected route without auth, redirect to sign-in
  const isProtectedRoute = protectedRoutes.some(
    route => request.nextUrl.pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !session) {
    console.log(`Middleware: Redirecting from ${request.nextUrl.pathname} to /sign-in (no session)`);
    const redirectUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Add security headers
  const securityHeaders = {
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': '',  // Will be set based on route below
    // Rate limiting headers
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99',
    'X-RateLimit-Reset': new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  // Get the Supabase URL from env to use in CSP
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : '';

  // Determine which CSP to use based on the route
  let csp = '';

  if (request.nextUrl.pathname.startsWith('/resources') || request.nextUrl.pathname.startsWith('/dashboard/diy-library')) {
    // Enhanced CSP for resources pages and dashboard DIY library with YouTube embeds
    csp = "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s3.amazonaws.com https://*.list-manage.com https://*.mailchimp.com https://va.vercel-scripts.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn-images.mailchimp.com; " +
          "img-src 'self' https://img.youtube.com data: https:; " +
          `connect-src 'self' https://${supabaseDomain} https://*.supabase.co https://*.api.mailchimp.com https://*.list-manage.com https://vitals.vercel-insights.com; ` +
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; " +
          "font-src 'self' data:;";
  } else {
    // Standard CSP for all other pages, including Supabase endpoints
    csp = "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.amazonaws.com https://*.list-manage.com https://*.mailchimp.com https://va.vercel-scripts.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn-images.mailchimp.com; " +
          "img-src 'self' data: https:; " +
          `connect-src 'self' https://${supabaseDomain} https://*.supabase.co https://*.api.mailchimp.com https://*.list-manage.com https://vitals.vercel-insights.com; ` +
          "frame-src 'self'; " +
          "font-src 'self' data:;";
  }

  // Add CSP to security headers
  securityHeaders['Content-Security-Policy'] = csp;

  // Add each security header to the response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Force HTTPS only in production (not for localhost)
  if (
    request.nextUrl.protocol === 'http:' && 
    !request.nextUrl.hostname.includes('localhost') && 
    !request.nextUrl.hostname.includes('127.0.0.1')
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl);
  }

  return res;
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 