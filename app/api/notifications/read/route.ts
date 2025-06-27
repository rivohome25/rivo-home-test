import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ids, markAll = false } = body

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    if (markAll) {
      // Mark all notifications as read for the user
      query = query.eq('is_read', false)
    } else if (ids && Array.isArray(ids)) {
      // Mark multiple specific notifications as read
      query = query.in('id', ids)
    } else if (id) {
      // Mark single notification as read
      query = query.eq('id', id)
    } else {
      return NextResponse.json({ 
        error: 'Must provide id, ids array, or markAll=true' 
      }, { status: 400 })
    }

    const { data, error } = await query.select()

    if (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      updated: data?.length || 0,
      message: `Marked ${data?.length || 0} notification(s) as read`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 