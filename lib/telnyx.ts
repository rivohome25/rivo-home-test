/**
 * Telnyx SMS Integration for RivoHome
 * Handles SMS notifications for booking confirmations, cancellations, reminders, etc.
 */

import Telnyx from 'telnyx'

// Initialize Telnyx client
const telnyx = new Telnyx(process.env.TELNYX_API_KEY!)

// Validate environment variables on module load
if (!process.env.TELNYX_API_KEY) {
  console.warn('TELNYX_API_KEY is not set. SMS notifications will not work.')
}

if (!process.env.TELNYX_NUMBER) {
  console.warn('TELNYX_NUMBER is not set. SMS notifications will not work.')
}

/**
 * Send SMS message using Telnyx
 * @param to - Recipient phone number (E.164 format)
 * @param message - SMS message content
 * @returns Promise with Telnyx response data
 */
export async function sendSms(to: string, message: string) {
  try {
    // Validate inputs
    if (!to || !message) {
      throw new Error('Both "to" and "message" parameters are required')
    }

    // Ensure phone number is in E.164 format
    const formattedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`
    
    const response = await telnyx.messages.create({
      from: process.env.TELNYX_NUMBER!,
      to: formattedTo,
      text: message,
    })

    console.log('SMS sent successfully:', {
      to: formattedTo,
      messageId: response.data.id,
      status: response.data.status
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to send SMS:', {
      to,
      error: error.message,
      details: error.response?.data || error
    })
    throw error
  }
}

/**
 * Send booking confirmation SMS to homeowner
 */
export async function sendBookingConfirmation(
  homeowner: { name: string; phone: string },
  provider: { businessName: string; phone: string },
  booking: { id: string; serviceType: string; startTime: string; address?: string }
) {
  const message = `Hi ${homeowner.name}! Your ${booking.serviceType} appointment with ${provider.businessName} is confirmed for ${new Date(booking.startTime).toLocaleString()}. ${booking.address ? `Address: ${booking.address}. ` : ''}We'll send reminders as the date approaches. Booking ID: ${booking.id.slice(-8)}`

  return await sendSms(homeowner.phone, message)
}

/**
 * Send new booking notification to provider
 */
export async function sendProviderBookingNotification(
  provider: { businessName: string; phone: string },
  homeowner: { name: string; phone: string },
  booking: { id: string; serviceType: string; startTime: string; description?: string; address?: string }
) {
  const message = `New booking request! ${homeowner.name} (${homeowner.phone}) has requested ${booking.serviceType} for ${new Date(booking.startTime).toLocaleString()}. ${booking.address ? `Address: ${booking.address}. ` : ''}${booking.description ? `Details: ${booking.description}. ` : ''}Please review and confirm in your dashboard. ID: ${booking.id.slice(-8)}`

  return await sendSms(provider.phone, message)
}

/**
 * Send booking approval notification to homeowner
 */
export async function sendBookingApproval(
  homeowner: { name: string; phone: string },
  provider: { businessName: string; phone: string },
  booking: { id: string; serviceType: string; startTime: string }
) {
  const message = `Great news ${homeowner.name}! ${provider.businessName} has confirmed your ${booking.serviceType} appointment for ${new Date(booking.startTime).toLocaleString()}. Contact them at ${provider.phone} if needed. Booking ID: ${booking.id.slice(-8)}`

  return await sendSms(homeowner.phone, message)
}

/**
 * Send booking cancellation notification (provider cancelling)
 */
export async function sendProviderCancellation(
  homeowner: { name: string; phone: string },
  provider: { businessName: string },
  booking: { id: string; serviceType: string; startTime: string },
  reason?: string
) {
  const message = `We're sorry, but ${provider.businessName} had to cancel your ${booking.serviceType} appointment scheduled for ${new Date(booking.startTime).toLocaleString()}. ${reason ? `Reason: ${reason}. ` : ''}We'll help you find another provider. Booking ID: ${booking.id.slice(-8)}`

  return await sendSms(homeowner.phone, message)
}

/**
 * Send booking cancellation notification to provider (homeowner cancelling)
 */
export async function sendHomeownerCancellation(
  provider: { businessName: string; phone: string },
  homeowner: { name: string },
  booking: { id: string; serviceType: string; startTime: string },
  reason?: string
) {
  const message = `Booking cancelled: ${homeowner.name} has cancelled their ${booking.serviceType} appointment scheduled for ${new Date(booking.startTime).toLocaleString()}. ${reason ? `Reason: ${reason}. ` : ''}Booking ID: ${booking.id.slice(-8)}`

  return await sendSms(provider.phone, message)
}

/**
 * Send booking reminder (24 hours before)
 */
export async function sendBookingReminder(
  recipient: { name: string; phone: string },
  booking: { id: string; serviceType: string; startTime: string; address?: string },
  isProvider: boolean = false
) {
  const tomorrow = new Date(booking.startTime)
  const timeString = tomorrow.toLocaleString()
  
  const message = isProvider 
    ? `Reminder: You have a ${booking.serviceType} appointment tomorrow at ${timeString}. ${booking.address ? `Address: ${booking.address}. ` : ''}Booking ID: ${booking.id.slice(-8)}`
    : `Hi ${recipient.name}! Reminder: Your ${booking.serviceType} appointment is tomorrow at ${timeString}. ${booking.address ? `Address: ${booking.address}. ` : ''}Booking ID: ${booking.id.slice(-8)}`

  return await sendSms(recipient.phone, message)
}

/**
 * Send booking completion notification
 */
export async function sendBookingCompletion(
  homeowner: { name: string; phone: string },
  provider: { businessName: string },
  booking: { id: string; serviceType: string }
) {
  const message = `Hi ${homeowner.name}! Your ${booking.serviceType} service with ${provider.businessName} has been completed. Please consider leaving a review to help other homeowners. Booking ID: ${booking.id.slice(-8)}`

  return await sendSms(homeowner.phone, message)
}

/**
 * Utility function to format phone numbers to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If it already starts with 1, add the + prefix
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`
  }
  
  // If it's a 10-digit US number, add +1 prefix
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If it already has a country code, add + prefix
  if (digits.length > 10) {
    return `+${digits}`
  }
  
  // Return original if we can't format it
  return phone
}

/**
 * Validate if a phone number is in proper format for SMS
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false
  
  const formatted = formatPhoneNumber(phone)
  
  // Check if it's in E.164 format and has reasonable length
  return /^\+[1-9]\d{1,14}$/.test(formatted)
} 