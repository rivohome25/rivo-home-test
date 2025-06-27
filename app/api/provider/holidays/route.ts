import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all holidays for the current year and next year
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1
    
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${nextYear}-12-31`)
      .order('date', { ascending: true })

    if (holidaysError) {
      console.error('Error fetching holidays:', holidaysError)
      return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 })
    }

    // Get provider's holiday preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('provider_holiday_preferences')
      .select('holiday_id, blocks_availability')
      .eq('provider_id', session.user.id)

    if (preferencesError) {
      console.error('Error fetching holiday preferences:', preferencesError)
      return NextResponse.json({ error: 'Failed to fetch holiday preferences' }, { status: 500 })
    }

    // Create a map of holiday preferences for easy lookup
    const preferencesMap = new Map()
    preferences.forEach(pref => {
      preferencesMap.set(pref.holiday_id, pref.blocks_availability)
    })

    // Combine holidays with preferences
    const holidaysWithPreferences = holidays.map(holiday => ({
      ...holiday,
      blocks_availability: preferencesMap.get(holiday.id) ?? false
    }))

    return NextResponse.json({
      holidays: holidaysWithPreferences,
      message: 'Holidays fetched successfully'
    })

  } catch (error) {
    console.error('Error in holiday API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { holiday_preferences } = await request.json()

    if (!Array.isArray(holiday_preferences)) {
      return NextResponse.json({ error: 'holiday_preferences must be an array' }, { status: 400 })
    }

    // Clear existing preferences for this provider
    const { error: deleteError } = await supabase
      .from('provider_holiday_preferences')
      .delete()
      .eq('provider_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting existing preferences:', deleteError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    // Insert new preferences (only for holidays that block availability)
    const preferencesToInsert = holiday_preferences
      .filter(pref => pref.blocks_availability === true)
      .map(pref => ({
        provider_id: session.user.id,
        holiday_id: pref.holiday_id,
        blocks_availability: true
      }))

    if (preferencesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('provider_holiday_preferences')
        .insert(preferencesToInsert)

      if (insertError) {
        console.error('Error inserting holiday preferences:', insertError)
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: 'Holiday preferences updated successfully'
    })

  } catch (error) {
    console.error('Error updating holiday preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 