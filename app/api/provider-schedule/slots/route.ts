import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/provider-schedule/slots?provider=uuid&from=iso_date&to=iso_date&slot_mins=30
 * Fetch available booking slots for a provider
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const providerId = searchParams.get('provider')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const slotMins = parseInt(searchParams.get('slot_mins') || '30')

    if (!providerId || !fromDate || !toDate) {
      return NextResponse.json({ 
        error: 'Missing required parameters: provider, from, to' 
      }, { status: 400 })
    }

    // Validate dates
    const fromTs = new Date(fromDate)
    const toTs = new Date(toDate)
    
    if (isNaN(fromTs.getTime()) || isNaN(toTs.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (toTs <= fromTs) {
      return NextResponse.json({ error: 'To date must be after from date' }, { status: 400 })
    }

    // Validate slot minutes
    if (slotMins < 15 || slotMins > 480) { // 15 mins to 8 hours
      return NextResponse.json({ error: 'Slot duration must be between 15 and 480 minutes' }, { status: 400 })
    }

    // Call the slot generation function
    const { data: slots, error } = await supabase
      .rpc('get_available_slots', {
        p_provider: providerId,
        p_from: fromTs.toISOString(),
        p_to: toTs.toISOString(),
        p_slot_mins: slotMins
      })

    if (error) {
      console.error('Error fetching available slots:', error)
      return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 })
    }

    // Group slots by date for easier frontend consumption
    const slotsByDate: Record<string, Array<{ start: string; end: string }>> = {}
    
    slots?.forEach((slot: any) => {
      const date = slot.slot_start.split('T')[0] // Get YYYY-MM-DD part
      if (!slotsByDate[date]) {
        slotsByDate[date] = []
      }
      slotsByDate[date].push({
        start: slot.slot_start,
        end: slot.slot_end
      })
    })

    return NextResponse.json({ 
      slots: slotsByDate,
      total_slots: slots?.length || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 