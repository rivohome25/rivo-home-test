import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Check if the user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.log('Admin middleware: No session found, redirecting to /sign-in')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  // Check if the user is an admin
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()
  
  if (error || !profile || !profile.is_admin) {
    console.log('Admin middleware: User is not an admin, redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Add admin verification headers for API routes
  const response = NextResponse.next()
  response.headers.set('x-admin-verified', 'true')
  response.headers.set('x-admin-user', session.user.id)
  
  return response
}

export const config = {
  matcher: ['/api/admin/:path*'],
} 