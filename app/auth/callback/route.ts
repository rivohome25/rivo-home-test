import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const role = requestUrl.searchParams.get('role') || 'homeowner'
  
  console.log('Auth callback: Processing authorization code');
  console.log('Auth callback: Request URL:', requestUrl.toString());
  console.log('Auth callback: Origin:', requestUrl.origin);

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      console.log('Auth callback: Exchanging code for session');
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Auth callback: Session exchange error', sessionError);
        return NextResponse.redirect(new URL('/sign-in?error=session_error', request.url))
      }
      
      console.log('Auth callback: Getting user');
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth callback: Error getting user', error);
        return NextResponse.redirect(new URL('/sign-in?error=auth_error', request.url))
      }
      
      if (user) {
        console.log('Auth callback: User authenticated:', user.id);
        
        // Update user metadata with role if it's provided or missing (but only if necessary)
        const userRole = user.user_metadata?.role as string
        
        if (!userRole || (role === 'provider' && userRole !== 'provider')) {
          console.log('Auth callback: Setting user role to', role);
          await supabase.auth.updateUser({
            data: { role }
          })
        }
        
        // Get the current role, either the updated one or the original
        const currentRole = userRole || role
        console.log('Auth callback: User role:', currentRole);
        
        // Add timestamp to prevent redirect loops
        const timestamp = new Date().getTime();
        
        // Simple role-based redirect - let the destination pages handle detailed checks
        if (currentRole === 'admin') {
          console.log('Auth callback: Admin user detected, redirecting to admin dashboard');
          return NextResponse.redirect(new URL(`/admin?t=${timestamp}`, request.url))
        }
        
        if (currentRole === 'provider') {
          console.log('Auth callback: Redirecting to provider dashboard/onboarding');
          return NextResponse.redirect(new URL(`/dashboard?t=${timestamp}`, request.url))
        } else {
          // Homeowner or default case
          console.log('Auth callback: Redirecting to homeowner onboarding');
          return NextResponse.redirect(new URL(`/onboarding?t=${timestamp}`, request.url))
        }
      } else {
        console.error('Auth callback: No user found after authentication');
        return NextResponse.redirect(new URL('/sign-in?error=no_user', request.url))
      }
    } catch (err) {
      console.error('Auth callback: Unexpected error', err);
      return NextResponse.redirect(new URL('/sign-in?error=unknown', request.url))
    }
  }

  console.log('Auth callback: No code provided, redirecting to sign-in');
  return NextResponse.redirect(new URL('/sign-in', request.url))
}