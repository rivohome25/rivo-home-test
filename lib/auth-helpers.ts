/**
 * @file auth-helpers.ts
 * @description Authentication helper functions for different environments
 */

/**
 * Get the appropriate auth callback URL for the current environment
 */
export function getAuthCallbackUrl(): string {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  
  // Server-side detection
  const vercelUrl = process.env.VERCEL_URL;
  const customDomain = process.env.NEXT_PUBLIC_APP_URL;
  
  if (customDomain) {
    return `${customDomain}/auth/callback`;
  }
  
  if (vercelUrl) {
    return `https://${vercelUrl}/auth/callback`;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000/auth/callback';
}

/**
 * Get the base URL for the current environment
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  const vercelUrl = process.env.VERCEL_URL;
  const customDomain = process.env.NEXT_PUBLIC_APP_URL;
  
  if (customDomain) {
    return customDomain;
  }
  
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  
  return 'http://localhost:3000';
}

/**
 * Get redirect URL after successful authentication based on role
 */
export function getPostAuthRedirectUrl(role: string = 'homeowner'): string {
  const baseUrl = getBaseUrl();
  const timestamp = new Date().getTime();
  
  switch (role) {
    case 'admin':
      return `${baseUrl}/admin?t=${timestamp}`;
    case 'provider':
      return `${baseUrl}/dashboard?t=${timestamp}`;
    default:
      return `${baseUrl}/onboarding?t=${timestamp}`;
  }
} 