/**
 * @file secure-upload-middleware.ts
 * @description Middleware for securing file uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUploadedFile, getSecureContentDisposition } from './secure-file-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Secure file upload middleware
 */
export async function secureFileUploadMiddleware(
  request: NextRequest,
  maxFileSize: number = 10 * 1024 * 1024,
  maxFilesPerHour: number = 20
): Promise<NextResponse | null> {
  
  // Apply rate limiting for file uploads
  const rateLimitResult = rateLimit(request, {
    limit: maxFilesPerHour,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many file uploads. Please try again later.'
  });
  
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  // Validate content type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Invalid content type for file upload' },
      { status: 400 }
    );
  }
  
  // Continue to route handler
  return null;
}

/**
 * Secure file response headers
 */
export function addSecureFileHeaders(response: NextResponse, fileName: string): NextResponse {
  // Prevent file execution
  response.headers.set('Content-Disposition', getSecureContentDisposition(fileName));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline';");
  
  // Prevent caching of sensitive files
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
