import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the user session from cookies
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.log('Admin provider status API: No session found')
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('Admin provider status API: User is not an admin', session.user.id)
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { status } = await req.json()
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    console.log('Admin provider status API: Updating provider status', params.userId, status)

    // Use admin client to update provider status
    const { error } = await supabaseAdmin
      .from('provider_profiles')
      .update({ onboarding_status: status, updated_at: 'now()' })
      .eq('user_id', params.userId)

    if (error) {
      console.error('Admin provider status API: Database error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('Admin provider status API: Successfully updated provider status', params.userId)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Admin provider status API: Unexpected error:", error)
    return NextResponse.json({ 
      error: "Failed to update provider status", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
} 