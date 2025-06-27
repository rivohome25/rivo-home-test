/**
 * Test script for Telnyx SMS integration
 * Run with: node scripts/test-sms.js
 */

require('dotenv').config()

async function testSMSFunctionality() {
  console.log('🧪 Testing Telnyx SMS Integration for RivoHome\n')

  // Check environment variables
  console.log('📋 Environment Check:')
  console.log('- TELNYX_API_KEY:', process.env.TELNYX_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('- TELNYX_NUMBER:', process.env.TELNYX_NUMBER ? '✅ Set' : '❌ Missing')

  if (!process.env.TELNYX_API_KEY || !process.env.TELNYX_NUMBER) {
    console.log('\n❌ Missing required environment variables. Please set TELNYX_API_KEY and TELNYX_NUMBER')
    process.exit(1)
  }

  // Test phone number formatting
  console.log('\n📱 Testing phone number formatting:')
  const testNumbers = [
    '555-123-4567',
    '5551234567', 
    '+15551234567',
    '1-555-123-4567'
  ]

  // Import the functions (need to use dynamic import for ES modules)
  const { formatPhoneNumber, isValidPhoneNumber } = await import('../lib/telnyx.js')
  
  testNumbers.forEach(number => {
    const formatted = formatPhoneNumber(number)
    const isValid = isValidPhoneNumber(number)
    console.log(`- ${number} → ${formatted} (${isValid ? 'Valid' : 'Invalid'})`)
  })

  // Test SMS sending (commented out to avoid charges during testing)
  /*
  console.log('\n📤 Testing SMS sending:')
  const testPhone = '+15551234567' // Replace with your test phone number
  const testMessage = 'Test message from RivoHome SMS integration - please ignore'
  
  try {
    const { sendSms } = await import('../lib/telnyx.js')
    const result = await sendSms(testPhone, testMessage)
    console.log('✅ SMS sent successfully:', result.id)
  } catch (error) {
    console.log('❌ SMS failed:', error.message)
  }
  */

  console.log('\n✅ SMS integration test completed!')
  console.log('\n💡 To test SMS sending:')
  console.log('1. Uncomment the SMS sending section')
  console.log('2. Replace testPhone with your actual phone number')
  console.log('3. Run the script again')
}

// Run the test
testSMSFunctionality().catch(console.error) 