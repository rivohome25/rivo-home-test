/**
 * Telnyx Webhook Handler for RivoHome
 * Handles incoming SMS messages for two-way communication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/telnyx'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Telnyx webhook structure
    const event = body.data
    
    if (!event) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Handle different Telnyx event types
    switch (event.record_type) {
      case 'message':
        await handleIncomingSMS(event)
        break
      case 'message_status':
        await handleMessageStatus(event)
        break
      default:
        console.log('Unhandled webhook event type:', event.record_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Telnyx webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle incoming SMS messages
 */
async function handleIncomingSMS(event: any) {
  try {
    const fromNumber = event.from?.phone_number
    const message = event.text?.toLowerCase().trim()
    const toNumber = event.to?.[0]?.phone_number

    if (!fromNumber || !message) {
      console.warn('Invalid SMS event - missing from number or message')
      return
    }

    console.log('Processing incoming SMS:', { from: fromNumber, message })

    const supabase = await createClient()

    // Look for recent bookings from this phone number
    const { data: recentBookings, error } = await supabase
      .from('view_provider_bookings')
      .select('*')
      .or(`homeowner_phone.eq.${fromNumber},provider_phone.eq.${fromNumber}`)
      .gte('start_ts', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error finding recent bookings:', error)
      return
    }

    if (!recentBookings || recentBookings.length === 0) {
      // Send help message for unknown numbers
      await sendSms(fromNumber, "Hi! We received your message but couldn't find any recent bookings associated with this number. For assistance, please contact our support team or log into your RivoHome account.")
      return
    }

    const booking = recentBookings[0]
    const isFromHomeowner = booking.homeowner_phone === fromNumber
    const isFromProvider = booking.provider_phone === fromNumber

    // Handle common commands
    if (message.includes('cancel') || message === 'c' || message === 'x') {
      await handleCancelRequest(booking, isFromHomeowner, fromNumber)
    } else if (message.includes('confirm') || message === 'y' || message === 'yes') {
      await handleConfirmRequest(booking, isFromHomeowner, fromNumber)
    } else if (message.includes('reschedule') || message.includes('change')) {
      await handleRescheduleRequest(booking, isFromHomeowner, fromNumber)
    } else if (message.includes('help') || message === '?') {
      await sendHelpMessage(fromNumber, isFromHomeowner)
    } else {
      // Forward message to the other party
      await forwardMessage(booking, isFromHomeowner, fromNumber, event.text)
    }

  } catch (error) {
    console.error('Error handling incoming SMS:', error)
  }
}

/**
 * Handle cancellation requests via SMS
 */
async function handleCancelRequest(booking: any, isFromHomeowner: boolean, fromNumber: string) {
  if (booking.status === 'cancelled') {
    await sendSms(fromNumber, `Booking ${booking.id.slice(-8)} is already cancelled.`)
    return
  }

  if (isFromHomeowner) {
    await sendSms(fromNumber, `To cancel your ${booking.service_type} appointment on ${new Date(booking.start_ts).toLocaleString()}, please log into your RivoHome account or call our support team. Cancellations require a reason for the provider.`)
  } else {
    await sendSms(fromNumber, `To cancel the ${booking.service_type} appointment on ${new Date(booking.start_ts).toLocaleString()}, please log into your provider dashboard to provide a cancellation reason.`)
  }
}

/**
 * Handle confirmation requests via SMS
 */
async function handleConfirmRequest(booking: any, isFromHomeowner: boolean, fromNumber: string) {
  if (booking.status === 'confirmed') {
    await sendSms(fromNumber, `Booking ${booking.id.slice(-8)} is already confirmed. See you ${new Date(booking.start_ts).toLocaleString()}!`)
    return
  }

  if (booking.status === 'cancelled') {
    await sendSms(fromNumber, `Booking ${booking.id.slice(-8)} has been cancelled and cannot be confirmed.`)
    return
  }

  if (isFromHomeowner) {
    await sendSms(fromNumber, `Your booking ${booking.id.slice(-8)} is pending provider confirmation. You'll be notified once they respond.`)
  } else {
    await sendSms(fromNumber, `To confirm the ${booking.service_type} appointment, please log into your provider dashboard for full booking management.`)
  }
}

/**
 * Handle reschedule requests via SMS  
 */
async function handleRescheduleRequest(booking: any, isFromHomeowner: boolean, fromNumber: string) {
  const userType = isFromHomeowner ? 'homeowner' : 'provider'
  await sendSms(fromNumber, `To reschedule your ${booking.service_type} appointment, please log into your RivoHome ${userType} dashboard where you can view available time slots and make changes.`)
}

/**
 * Send help message
 */
async function sendHelpMessage(fromNumber: string, isFromHomeowner: boolean) {
  const userType = isFromHomeowner ? 'homeowner' : 'provider'
  const helpText = `RivoHome SMS Help:
• Reply "CANCEL" for cancellation info
• Reply "CONFIRM" for confirmation status  
• Reply "RESCHEDULE" for scheduling help
• Log into your ${userType} dashboard for full booking management
• Contact support for immediate assistance`

  await sendSms(fromNumber, helpText)
}

/**
 * Forward message between homeowner and provider
 */
async function forwardMessage(booking: any, isFromHomeowner: boolean, fromNumber: string, originalMessage: string) {
  const recipientNumber = isFromHomeowner ? booking.provider_phone : booking.homeowner_phone
  const senderName = isFromHomeowner ? booking.homeowner_name : booking.provider_business_name || booking.provider_name
  
  if (!recipientNumber) {
    await sendSms(fromNumber, "Unable to forward message - recipient contact info not available.")
    return
  }

  const forwardedMessage = `Message from ${senderName} regarding booking ${booking.id.slice(-8)}: "${originalMessage}"`
  
  await sendSms(recipientNumber, forwardedMessage)
  await sendSms(fromNumber, "Your message has been forwarded. For faster response, please use your RivoHome dashboard.")
}

/**
 * Handle message delivery status updates
 */
async function handleMessageStatus(event: any) {
  console.log('Message status update:', {
    messageId: event.id,
    status: event.status,
    to: event.to?.[0]?.phone_number
  })
  
  // Log delivery failures for monitoring
  if (event.status === 'failed') {
    console.error('SMS delivery failed:', {
      messageId: event.id,
      failureReason: event.errors?.[0]?.detail
    })
  }
} 