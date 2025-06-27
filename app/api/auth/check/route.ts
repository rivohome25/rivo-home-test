import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export async function GET() {
  // Initialize Supabase client
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
  
  // Get the current user session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
  
  return NextResponse.json({
    authenticated: !!session,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email
    } : null
  })
} 