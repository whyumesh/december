// SMS login link sending utility
import { sendOTP as sendSMSOTP } from './otp'

/**
 * Send login link via SMS
 */
export async function sendSMSLoginLink(
  phone: string,
  loginLink: string
): Promise<{ success: boolean; message: string }> {
  const messageBody = `Click this link to login to KMS Election: ${loginLink}\n\nValid for 10 minutes. Do not share this link.`
  
  // Use the existing SMS sending function but with login link message
  // We'll create a dummy OTP code for tracking, but send the actual link
  const dummyOTP = 'LINK' // Placeholder for compatibility
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📱 SMS Login Link BEING SENT:')
  console.log(`   Phone: ${phone}`)
  console.log(`   Login Link: ${loginLink}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // For SMS, we need to modify the message sent
  // Since sendOTP sends a fixed message format, we'll need to create a custom SMS sender
  // For now, let's use a workaround by modifying the message in the OTP function
  // Or better: create a direct SMS sending function
  
  // TODO: Create a direct SMS sending function that accepts custom messages
  // For now, we'll use the existing infrastructure
  
  try {
    // Import Twilio client directly to send custom message
    const twilio = require('twilio')
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return {
        success: false,
        message: 'SMS service not configured. Please contact administrator.'
      }
    }

    // Format phone number
    const formatPhone = (phone: string): string => {
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length === 10) return `+91${digitsOnly}`
      if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
        return `+91${digitsOnly.substring(1)}`
      }
      if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        return `+${digitsOnly}`
      }
      return phone.startsWith('+') ? phone : `+${digitsOnly}`
    }

    const client = twilio(accountSid, authToken)
    const formattedPhone = formatPhone(phone)

    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: formattedPhone,
    })

    console.log('✅ SMS Login Link sent successfully:', {
      messageSid: message.sid,
      status: message.status
    })

    return {
      success: true,
      message: 'Login link has been sent via SMS.'
    }
  } catch (error: any) {
    console.error('❌ SMS login link send failed:', error)
    return {
      success: false,
      message: `Failed to send login link via SMS: ${error.message || 'Unknown error'}`
    }
  }
}

