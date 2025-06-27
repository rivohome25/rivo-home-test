import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/provider-schedule/book
 * Book an appointment slot
 * Body: { provider_id, start_ts, end_ts, service_type, description, homeowner_notes }
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
    const { provider_id, start_ts, end_ts, service_type, description, homeowner_notes } = body

    if (!provider_id || !start_ts || !end_ts || !service_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: provider_id, start_ts, end_ts, service_type' 
      }, { status: 400 })
    }

    // Validate dates
    const startTime = new Date(start_ts)
    const endTime = new Date(end_ts)
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Check if the slot is still available
    const { data: availableSlots, error: slotsError } = await supabase
      .rpc('get_available_slots', {
        p_provider: provider_id,
        p_from: start_ts,
        p_to: end_ts,
        p_slot_mins: Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      })

    if (slotsError) {
      console.error('Error checking slot availability:', slotsError)
      return NextResponse.json({ error: 'Failed to verify slot availability' }, { status: 500 })
    }

    // Check if the exact slot is available
    const slotAvailable = availableSlots?.some((slot: any) => 
      slot.slot_start === start_ts && slot.slot_end === end_ts
    )

    if (!slotAvailable) {
      return NextResponse.json({ 
        error: 'Selected time slot is no longer available' 
      }, { status: 409 })
    }

    // Create the booking
    const { data: booking, error } = await supabase
      .from('provider_bookings')
      .insert({
        provider_id,
        homeowner_id: user.id,
        start_ts,
        end_ts,
        service_type,
        description: description || null,
        homeowner_notes: homeowner_notes || null,
        status: 'pending'
      })
      .select(`
        *,
        provider_profiles!provider_bookings_provider_id_fkey (
          business_name,
          full_name,
          email,
          phone
        )
      `)
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({ 
      booking,
      message: 'Booking created successfully' 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 