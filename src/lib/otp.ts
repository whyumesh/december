// Twilio SMS OTP service implementation
// Scalable design for handling 100s of concurrent users

import twilio from 'twilio'
import { logger } from './logger'

// Singleton Twilio client instance (reused across requests for better performance)
let twilioClient: twilio.Twilio | null = null

/**
 * Get or create Twilio client instance (singleton pattern for scalability)
 */
function getTwilioClient(): twilio.Twilio | null {
  if (twilioClient) {
    return twilioClient
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  // If Twilio credentials are not configured, return null (fallback to console logging)
  if (!accountSid || !authToken) {
    logger.warn('Twilio credentials not configured. OTP will be logged to console only.')
    return null
  }

  try {
    twilioClient = twilio(accountSid, authToken, {
      timeout: 30000, // 30 second timeout
      autoRetry: true, // Enable automatic retries
      maxRetries: 3, // Maximum 3 retries
    })
    return twilioClient
  } catch (error) {
    logger.error('Failed to initialize Twilio client', { error })
    return null
  }
}

/**
 * Format phone number to international format
 * Assumes Indian numbers (10 digits) and adds +91 country code
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // If already has country code (starts with + or has 11+ digits), return as is
  if (phone.startsWith('+')) {
    return phone.replace(/\s/g, '')
  }
  
  // If 10 digits, assume Indian number and add +91
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`
  }
  
  // If 11 digits and starts with 0, remove 0 and add +91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.substring(1)}`
  }
  
  // If 12 digits and starts with 91, add +
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`
  }
  
  // Return as is if already formatted or unknown format
  return phone.startsWith('+') ? phone : `+${digitsOnly}`
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors (authentication, invalid phone, etc.)
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes('authentication') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('forbidden')
        ) {
          throw error
        }
      }
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000 // Add jitter
        await new Promise(resolve => setTimeout(resolve, delay))
        logger.warn(`SMS send attempt ${attempt + 1} failed, retrying...`, { 
          attempt: attempt + 1,
          maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

/**
 * Send OTP via SMS using Twilio
 * Designed for scalability: async, retry logic, proper error handling
 */
export async function sendOTP(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now()
  const phoneHash = phone.slice(-4) // Last 4 digits for logging (privacy)
  
  // Display OTP in terminal
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📱 SMS OTP BEING SENT:')
  console.log(`   Phone: ${phone}`)
  console.log(`   OTP Code: ${otp}`)
  console.log(`   Generated at: ${new Date().toLocaleString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(phone)
    
    // Get Twilio client
    const client = getTwilioClient()
    
    // If Twilio is not configured, fallback to console logging (for development)
    if (!client) {
      const fallbackMessage = `OTP for ${phoneHash}***: ${otp} (Twilio not configured - check console)`
      console.log('\n' + '='.repeat(60))
      console.log('🔐 VOTER LOGIN OTP GENERATED (FALLBACK MODE)')
      console.log('='.repeat(60))
      console.log(`📱 Phone Number: ${phoneHash}***`)
      console.log(`🔑 OTP Code: ${otp}`)
      console.log(`⏰ Valid for: 10 minutes`)
      console.log(`🕐 Generated at: ${new Date().toLocaleString()}`)
      console.log('='.repeat(60))
      console.log('⚠️  Twilio not configured. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER')
      console.log('='.repeat(60) + '\n')
      
      logger.warn('OTP sent in fallback mode (console only)', { phoneHash })
      
      return {
        success: true,
        message: 'OTP generated. Please check server logs (Twilio not configured).'
      }
    }
    
    // Get Twilio phone number from environment
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is not set')
    }
    
    // SMS message content
    const messageBody = `Your KMS Election OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`
    
    // Send SMS with retry logic
    const message = await retryWithBackoff(async () => {
      return await client.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: formattedPhone,
      })
    })
    
    const duration = Date.now() - startTime
    
    // Log success (without exposing full phone number)
    logger.info('SMS OTP sent successfully', {
      phoneHash,
      messageSid: message.sid,
      status: message.status,
      duration: `${duration}ms`
    })
    
    // Also log to console for development/debugging (with full OTP displayed)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ SMS OTP SENT SUCCESSFULLY:')
    console.log(`   Phone: ${phone}`)
    console.log(`   OTP Code: ${otp}`)
    console.log(`   Twilio SID: ${message.sid}`)
    console.log(`   Status: ${message.status}`)
    console.log(`   Duration: ${duration}ms`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return {
      success: true,
      message: 'OTP has been sent to your registered phone number.'
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    // Handle specific Twilio errors
    let errorMessage = 'Failed to send OTP. Please try again.'
    let shouldLogError = true
    
    if (error?.code) {
      switch (error.code) {
        case 21211: // Invalid 'To' phone number
          errorMessage = 'Invalid phone number. Please check and try again.'
          break
        case 21608: // Unsubscribed recipient
          errorMessage = 'This phone number is not subscribed to receive SMS.'
          break
        case 21614: // Invalid 'From' phone number
          errorMessage = 'SMS service configuration error. Please contact administrator.'
          logger.error('Twilio configuration error', { error: error.message, code: error.code })
          break
        case 30003: // Unreachable destination
          errorMessage = 'Unable to reach this phone number. Please verify the number and try again.'
          break
        case 30005: // Unknown destination
          errorMessage = 'Invalid phone number format. Please check and try again.'
          break
        case 30008: // Unknown error
          errorMessage = 'SMS service temporarily unavailable. Please try again in a moment.'
          break
        default:
          if (error.code >= 20000 && error.code < 30000) {
            errorMessage = 'SMS service error. Please try again later.'
          }
      }
    }
    
    // Log error with context (without exposing sensitive data)
    logger.error('Failed to send SMS OTP', {
      phoneHash,
      errorCode: error?.code,
      errorMessage: error?.message,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })
    
    // Fallback: Log to console for development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ SMS send failed for ${phoneHash}***:`, error?.message || error)
      console.log(`📱 Fallback OTP for ${phoneHash}***: ${otp}`)
    }
    
    return {
      success: false,
      message: errorMessage
    }
  }
}

// Export helper function for testing/development
export function formatPhoneNumberForTesting(phone: string): string {
  return formatPhoneNumber(phone)
}
