/**
 * @file auth-utils.ts
 * @description Authentication utilities to reduce redundant calls and handle rate limiting
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Cache for session checks to avoid repeated calls
let sessionCache: { session: any; timestamp: number } | null = null
const CACHE_DURATION = 30 * 1000 // 30 seconds

/**
 * Get current user session with caching to reduce rate limiting
 */
export async function getCachedSession() {
  const supabase = createClientComponentClient()
  
  // Return cached session if still valid
  if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
    return sessionCache.session
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }
    
    // Update cache
    sessionCache = {
      session,
      timestamp: Date.now()
    }
    
    return session
  } catch (err) {
    console.error('Failed to get session:', err)
    return null
  }
}

/**
 * Clear the session cache - call this after sign in/out operations
 */
export function clearSessionCache() {
  sessionCache = null
}

/**
 * Get user with minimal calls - checks cache first
 */
export async function getCachedUser() {
  const session = await getCachedSession()
  return session?.user || null
}

/**
 * Simple delay utility for retrying requests after rate limits
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry wrapper for auth operations that might hit rate limits
 */
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 2000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // If it's a rate limit error and we have retries left, wait and try again
      if (error.message?.includes('rate limit') && i < maxRetries) {
        console.log(`Rate limit hit, retrying in ${delayMs}ms... (attempt ${i + 1}/${maxRetries + 1})`)
        await delay(delayMs)
        continue
      }
      
      // Otherwise, throw the error
      throw error
    }
  }
  
  throw lastError
}

/**
 * Validate user role for API endpoints
 */
export async function validateUserRole(
  userId: string, 
  requiredRole: 'homeowner' | 'provider' | 'admin',
  supabase: any
): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', userId)
      .single()
    
    if (!profile) {
      return false
    }
    
    // Admin users can access any role
    if (profile.is_admin || profile.role === 'admin') {
      return true
    }
    
    return profile.role === requiredRole
  } catch (error) {
    console.error('Role validation error:', error)
    return false
  }
}

/**
 * Get user role and admin status
 */
export async function getUserRole(userId: string, supabase: any): Promise<{
  role: string | null;
  isAdmin: boolean;
}> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', userId)
      .single()
    
    return {
      role: profile?.role || null,
      isAdmin: profile?.is_admin || false
    }
  } catch (error) {
    console.error('Error getting user role:', error)
    return { role: null, isAdmin: false }
  }
} 