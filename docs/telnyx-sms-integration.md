# Telnyx SMS Integration for RivoHome

This document outlines the SMS notification system integrated into RivoHome using Telnyx's messaging platform.

## Overview

The Telnyx SMS integration provides automated text message notifications for the entire booking lifecycle, including confirmations, approvals, cancellations, and reminders. It also supports two-way communication between homeowners and service providers.

## Features

### 📱 Automated SMS Notifications

- **Booking Creation**: Instant SMS to both homeowner and provider when appointment is requested
- **Booking Approval**: SMS to homeowner when provider confirms the appointment
- **Cancellations**: Bi-directional cancellation notifications with reasons
- **24-Hour Reminders**: Automated reminders sent to both parties before appointments
- **Completion Notifications**: SMS when service is marked as complete

### 🔄 Two-Way Communication

- **Command Processing**: Handles SMS replies like "CANCEL", "CONFIRM", "RESCHEDULE", "HELP"
- **Message Forwarding**: Routes messages between homeowner and provider
- **Smart Responses**: Automatic replies for common questions and requests

### 🛡️ Security & Reliability

- **Phone Number Validation**: E.164 format validation and automatic formatting
- **Error Handling**: Graceful failure handling that doesn't break booking operations
- **Webhook Security**: Protected endpoints with proper authentication
- **Cron Job Authentication**: Secure background job processing

## Setup Instructions

### 1. Telnyx Account Setup

1. Sign up at [telnyx.com](https://telnyx.com)
2. Purchase an SMS-capable phone number
3. Generate an API key from the Telnyx Portal
4. Configure messaging profile and webhook endpoints

### 2. Environment Variables

Add these variables to your `.env` file:

```bash
# Telnyx Configuration
TELNYX_API_KEY=your_telnyx_api_key_here
TELNYX_NUMBER=+1XXXYYYZZZZ

# Cron job authentication
CRON_SECRET=your_secure_cron_secret_here
```

### 3. Webhook Configuration

Configure your Telnyx messaging profile to send webhooks to:
- **URL**: `https://yourdomain.com/api/telnyx/webhook`
- **Events**: `message.received`, `message.status`

## API Endpoints

### SMS Sending Functions

Located in `lib/telnyx.ts`:

- `sendBookingConfirmation()` - Homeowner booking confirmation
- `sendProviderBookingNotification()` - Provider new booking alert
- `sendBookingApproval()` - Homeowner approval notification
- `sendProviderCancellation()` - Provider cancellation notice
- `sendHomeownerCancellation()` - Homeowner cancellation notice
- `sendBookingReminder()` - 24-hour appointment reminders
- `sendBookingCompletion()` - Service completion notification

### Webhook Endpoints

- `POST /api/telnyx/webhook` - Handles incoming SMS messages and delivery status
- `POST /api/notifications/send-reminders` - Automated reminder job (cron)
- `GET /api/notifications/send-reminders` - Test endpoint for upcoming bookings

## Integration Points

### Booking Creation
```typescript
// app/api/provider-schedule/book/route.ts
await sendBookingConfirmation(homeowner, provider, booking)
await sendProviderBookingNotification(provider, homeowner, booking)
```

### Status Updates
```typescript
// app/api/provider/bookings/[id]/route.ts
if (status === 'confirmed') {
  await sendBookingApproval(homeowner, provider, booking)
}
```

### Cancellations
```typescript
// app/api/homeowner/bookings/[id]/route.ts
await sendHomeownerCancellation(provider, homeowner, booking, reason)
```

## Testing

### Test Script
Run the test script to verify configuration:

```bash
node scripts/test-sms.js
```

### Manual Testing
1. Create a test booking with valid phone numbers
2. Confirm the booking to trigger approval SMS
3. Cancel the booking to test cancellation SMS
4. Check webhook logs for incoming SMS processing

## Scheduled Jobs

### Reminder Cron Job
- **Schedule**: Every 6 hours (`0 */6 * * *`)
- **Function**: Checks for bookings 24 hours in advance and sends reminders
- **Endpoint**: `/api/notifications/send-reminders`
- **Authentication**: Requires `CRON_SECRET` in Authorization header

## Phone Number Formatting

All phone numbers are automatically formatted to E.164 standard:
- Input: `555-123-4567` → Output: `+15551234567`
- Input: `5551234567` → Output: `+15551234567`
- Input: `+15551234567` → Output: `+15551234567`

## Error Handling

- SMS failures don't break booking operations
- Invalid phone numbers are logged and skipped
- Webhook errors are logged for monitoring
- Graceful fallbacks for missing contact information

## Monitoring

### Logs to Monitor
- SMS delivery success/failure rates
- Webhook processing errors
- Invalid phone number attempts
- Reminder job execution status

### Key Metrics
- SMS delivery rates
- Response times for two-way communication
- No-show reduction after reminder implementation
- User engagement with SMS features

## Troubleshooting

### Common Issues

1. **SMS not sending**
   - Check TELNYX_API_KEY and TELNYX_NUMBER environment variables
   - Verify phone numbers are in valid E.164 format
   - Check Telnyx account balance and number status

2. **Webhooks not working**
   - Verify webhook URL configuration in Telnyx portal
   - Check webhook endpoint logs for errors
   - Ensure proper request body parsing

3. **Reminders not sending**
   - Verify cron job is configured correctly
   - Check CRON_SECRET environment variable
   - Review reminder job logs

### Debug Mode

Enable detailed logging by setting debug mode in SMS functions:

```typescript
console.log('SMS sent successfully:', {
  to: formattedTo,
  messageId: response.data.id,
  status: response.data.status
})
```

## Cost Optimization

- SMS are only sent to validated phone numbers
- Duplicate notifications are prevented
- Failed sends are logged and not retried automatically
- Reminders have a 2-hour window to prevent spam

## Future Enhancements

- Voice call notifications for critical updates
- SMS templates for better message consistency
- Multi-language SMS support
- SMS analytics dashboard
- Custom reminder timing preferences 