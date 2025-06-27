/**
 * Booking Reminder SMS Notifications
 * Sends SMS reminders for bookings 24 hours in advance
 * Can be triggered by cron jobs or scheduled tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBookingReminder, formatPhoneNumber, isValidPhoneNumber } from '@/lib/telnyx'

// Protect this endpoint with a simple token or cron secret
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production'

export async function POST(req: NextRequest) {
  try {
    // Verify authorization for scheduled jobs
    const authHeader = req.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')
    
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Find bookings that need 24-hour reminders
    const reminderTime = new Date()
    reminderTime.setHours(reminderTime.getHours() + 24) // 24 hours from now
    
    // Get a 2-hour window around the reminder time (23-25 hours from now)
    const windowStart = new Date(reminderTime)
    windowStart.setHours(windowStart.getHours() - 1)
    
    const windowEnd = new Date(reminderTime)
    windowEnd.setHours(windowEnd.getHours() + 1)

    console.log('Looking for bookings to remind between:', windowStart.toISOString(), 'and', windowEnd.toISOString())

    // Fetch confirmed bookings in the reminder window
    const { data: bookingsToRemind, error } = await supabase
      .from('view_provider_bookings')
      .select('*')
      .eq('status', 'confirmed')
      .gte('start_ts', windowStart.toISOString())
      .lte('start_ts', windowEnd.toISOString())

    if (error) {
      console.error('Error fetching bookings for reminders:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    if (!bookingsToRemind || bookingsToRemind.length === 0) {
      console.log('No bookings found needing reminders')
      return NextResponse.json({ 
        message: 'No bookings found needing reminders',
        count: 0 
      })
    }

    console.log(`Found ${bookingsToRemind.length} bookings needing reminders`)

    let successCount = 0
    let failureCount = 0
    const results = []

    // Send reminders for each booking
    for (const booking of bookingsToRemind) {
      try {
        // Send reminder to homeowner
        if (booking.homeowner_phone && isValidPhoneNumber(booking.homeowner_phone)) {
          await sendBookingReminder(
            {
              name: booking.homeowner_name || 'Customer',
              phone: formatPhoneNumber(booking.homeowner_phone)
            },
            {
              id: booking.id,
              serviceType: booking.service_type,
              startTime: booking.start_ts,
              address: booking.property_address
            },
            false // isProvider = false
          )
          
          results.push({
            bookingId: booking.id,
            recipient: 'homeowner',
            phone: booking.homeowner_phone,
            status: 'sent'
          })
        }

        // Send reminder to provider
        if (booking.provider_phone && isValidPhoneNumber(booking.provider_phone)) {
          await sendBookingReminder(
            {
              name: booking.provider_business_name || booking.provider_name || 'Provider',
              phone: formatPhoneNumber(booking.provider_phone)
            },
            {
              id: booking.id,
              serviceType: booking.service_type,
              startTime: booking.start_ts,
              address: booking.property_address
            },
            true // isProvider = true
          )
          
          results.push({
            bookingId: booking.id,
            recipient: 'provider',
            phone: booking.provider_phone,
            status: 'sent'
          })
        }

        successCount++
        console.log(`Reminders sent successfully for booking ${booking.id}`)

      } catch (error) {
        failureCount++
        console.error(`Failed to send reminders for booking ${booking.id}:`, error)
        
        results.push({
          bookingId: booking.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Reminder processing complete`,
      totalBookings: bookingsToRemind.length,
      successfulReminders: successCount,
      failedReminders: failureCount,
      results
    })

  } catch (error) {
    console.error('Error in reminder processing:', error)
    return NextResponse.json({ 
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to test reminder functionality
 */
export async function GET(req: NextRequest) {
  try {
    // Basic auth check for testing
    const authHeader = req.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')
    
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Find upcoming confirmed bookings (next 48 hours)
    const now = new Date()
    const fortyEightHoursFromNow = new Date()
    fortyEightHoursFromNow.setHours(fortyEightHoursFromNow.getHours() + 48)

    const { data: upcomingBookings, error } = await supabase
      .from('view_provider_bookings')
      .select('id, service_type, start_ts, status, homeowner_name, provider_business_name')
      .eq('status', 'confirmed')
      .gte('start_ts', now.toISOString())
      .lte('start_ts', fortyEightHoursFromNow.toISOString())
      .order('start_ts', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Upcoming confirmed bookings',
      count: upcomingBookings?.length || 0,
      bookings: upcomingBookings || []
    })

  } catch (error) {
    console.error('Error fetching upcoming bookings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch upcoming bookings' 
    }, { status: 500 })
  }
} 