import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/provider-schedule/availability
 * Fetch provider's weekly availability schedule
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch provider's availability
    const { data: availability, error } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', user.id)
      .order('day_of_week')

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/provider-schedule/availability
 * Update provider's weekly availability schedule
 * Body: { availability: Array<{ day_of_week, start_time, end_time, buffer_mins }> }
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
    const { availability } = body

    if (!availability || !Array.isArray(availability)) {
      return NextResponse.json({ error: 'Invalid availability data' }, { status: 400 })
    }

    // Delete existing availability for this provider
    const { error: deleteError } = await supabase
      .from('provider_availability')
      .delete()
      .eq('provider_id', user.id)

    if (deleteError) {
      console.error('Error deleting old availability:', deleteError)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }

    // Insert new availability records
    if (availability.length > 0) {
      const availabilityWithProvider = availability.map(slot => ({
        ...slot,
        provider_id: user.id
      }))

      const { error: insertError } = await supabase
        .from('provider_availability')
        .insert(availabilityWithProvider)

      if (insertError) {
        console.error('Error inserting availability:', insertError)
        return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Availability updated successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 