import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/provider-schedule/unavailability
 * Fetch provider's unavailability blocks
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch provider's unavailability blocks
    const { data: unavailability, error } = await supabase
      .from('provider_unavailability')
      .select('*')
      .eq('provider_id', user.id)
      .order('start_ts')

    if (error) {
      console.error('Error fetching unavailability:', error)
      return NextResponse.json({ error: 'Failed to fetch unavailability' }, { status: 500 })
    }

    return NextResponse.json({ unavailability })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/provider-schedule/unavailability
 * Create a new unavailability block
 * Body: { start_ts, end_ts, reason }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { start_ts, end_ts, reason } = body

    if (!start_ts || !end_ts) {
      return NextResponse.json({ error: 'Start and end times are required' }, { status: 400 })
    }

    // Validate that end time is after start time
    if (new Date(end_ts) <= new Date(start_ts)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Insert new unavailability block
    const { data, error } = await supabase
      .from('provider_unavailability')
      .insert({
        provider_id: user.id,
        start_ts,
        end_ts,
        reason: reason || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating unavailability:', error)
      return NextResponse.json({ error: 'Failed to create unavailability block' }, { status: 500 })
    }

    return NextResponse.json({ unavailability: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 