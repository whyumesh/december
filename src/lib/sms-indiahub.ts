// SMSINDIAHUB SMS service integration
// Handles SMS sending via SMSINDIAHUB API

import { logger } from './logger'

export interface SMSIndiaHubConfig {
  apiKey?: string
  username?: string
  password?: string
  senderId: string
  channel?: 'Promo' | 'Trans' // Promo for promotional, Trans for transactional (OTP)
  dcs?: string // Data Coding Scheme: 0 for normal, 8 for Unicode
  flashSms?: boolean
  route?: string
}

export interface SMSIndiaHubResult {
  success: boolean
  message: string
  messageId?: string
  error?: string
}

/**
 * Format phone number for SMSINDIAHUB
 * Expects format: country code + number (e.g., 919109992290)
 */
function formatPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '')
  
  // If 10 digits, assume Indian number and add 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`
  }
  
  // If 11 digits starting with 0, remove 0 and add 91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.substring(1)}`
  }
  
  // If already has country code, return as is
  if (digitsOnly.length >= 11) {
    return digitsOnly
  }
  
  // Default: assume Indian number
  return `91${digitsOnly}`
}

/**
 * Send SMS via SMSINDIAHUB
 */
export async function sendSMSIndiaHub(
  phone: string,
  message: string,
  config?: Partial<SMSIndiaHubConfig>
): Promise<SMSIndiaHubResult> {
  try {
    // Get configuration from environment or provided config
    const apiKey = config?.apiKey || process.env.SMSINDIAHUB_API_KEY
    const username = config?.username || process.env.SMSINDIAHUB_USERNAME
    const password = config?.password || process.env.SMSINDIAHUB_PASSWORD
    const senderId = config?.senderId || process.env.SMSINDIAHUB_SENDER_ID || 'SMSHUB'
    const channel = config?.channel || (process.env.SMSINDIAHUB_CHANNEL as 'Promo' | 'Trans') || 'Trans'
    const dcs = config?.dcs || process.env.SMSINDIAHUB_DCS || '0'
    const flashSms = config?.flashSms !== undefined 
      ? (config.flashSms ? '1' : '0')
      : (process.env.SMSINDIAHUB_FLASH_SMS || '0')
    const route = config?.route || process.env.SMSINDIAHUB_ROUTE || ''

    // Either API key OR username/password is required
    if (!apiKey && (!username || !password)) {
      logger.error('SMSINDIAHUB credentials not configured')
      return {
        success: false,
        message: 'SMS service not configured',
        error: 'SMSINDIAHUB API key or username/password is missing'
      }
    }

    const formattedPhone = formatPhone(phone)
    
    // Build query parameters according to official API documentation
    const params = new URLSearchParams()
    
    // Use API key if available, otherwise use username/password
    if (apiKey) {
      params.append('APIKey', apiKey)
    } else {
      params.append('user', username!)
      params.append('password', password!)
    }
    
    params.append('senderid', senderId)
    params.append('channel', channel)
    params.append('DCS', dcs)
    params.append('flashsms', flashSms)
    params.append('number', formattedPhone)
    // Clean message: remove special characters that might cause template issues
    // URLSearchParams will handle URL encoding automatically
    const cleanMessage = message
      .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
    params.append('text', cleanMessage)
    
    // Add route if specified
    if (route) {
      params.append('route', route)
    }

    const queryString = params.toString()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📱 SMSINDIAHUB SMS BEING SENT:')
    console.log(`   Phone: ${formattedPhone}`)
    console.log(`   Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`)
    console.log(`   Sender ID: ${senderId}`)
    console.log(`   Channel: ${channel}`)
    console.log(`   DCS: ${dcs}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    // Try HTTPS first, fallback to HTTP if HTTPS fails
    const trySendSMS = async (useHttps: boolean): Promise<Response> => {
      const protocol = useHttps ? 'https' : 'http'
      const baseUrl = `${protocol}://cloud.smsindiahub.in/api/mt/SendSMS`
      const apiUrl = `${baseUrl}?${queryString}`
      
      const debugUrl = apiUrl.replace(/APIKey=[^&]+/, 'APIKey=***').replace(/password=[^&]+/, 'password=***')
      console.log(`SMSINDIAHUB API Request (${protocol.toUpperCase()}):`, debugUrl)
      
      return await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'KMS-Election-System/1.0',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
    }

    let response: Response
    let lastError: any
    try {
      // Try HTTPS first
      try {
        response = await trySendSMS(true)
        clearTimeout(timeoutId)
      } catch (httpsError: any) {
        // If HTTPS fails, try HTTP as fallback
        console.log('⚠️ HTTPS failed, trying HTTP fallback...')
        logger.warn('SMSINDIAHUB HTTPS failed, trying HTTP', {
          error: httpsError.message,
          code: httpsError.code,
        })
        try {
          response = await trySendSMS(false)
          clearTimeout(timeoutId)
        } catch (httpError: any) {
          // Both failed
          lastError = httpError
          throw httpError
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Handle specific fetch errors
      if (fetchError.name === 'AbortError') {
        logger.error('SMSINDIAHUB request timeout', {
          phone: formattedPhone.slice(-4) + '***',
        })
        return {
          success: false,
          message: 'SMS service timeout. Please try again.',
          error: 'Request timeout after 30 seconds',
        }
      }
      
      // Handle network errors
      if (fetchError.message?.includes('fetch failed') || 
          fetchError.code === 'ENOTFOUND' || 
          fetchError.code === 'ECONNREFUSED' ||
          fetchError.code === 'ECONNRESET' ||
          fetchError.code === 'ETIMEDOUT' ||
          fetchError.message?.includes('network') ||
          fetchError.message?.includes('ECONNREFUSED') ||
          fetchError.message?.includes('getaddrinfo')) {
        logger.error('SMSINDIAHUB network error', {
          phone: formattedPhone.slice(-4) + '***',
          error: fetchError.message,
          code: fetchError.code,
          stack: process.env.NODE_ENV === 'development' ? fetchError.stack : undefined,
        })
        return {
          success: false,
          message: 'Network error connecting to SMS service. Please check your internet connection and try again.',
          error: `Network error: ${fetchError.message || fetchError.code || 'Connection failed'}`,
        }
      }
      
      // Re-throw other errors
      throw fetchError
    }

    let responseText: string
    try {
      responseText = await response.text()
      console.log('SMSINDIAHUB API Response:', responseText.substring(0, 500)) // Limit log length
    } catch (textError: any) {
      logger.error('SMSINDIAHUB failed to read response', {
        phone: formattedPhone.slice(-4) + '***',
        error: textError.message,
        status: response.status,
      })
      return {
        success: false,
        message: 'Failed to read SMS service response',
        error: textError.message,
      }
    }

    // Parse response (SMSINDIAHUB returns JSON according to API docs)
    let responseData: any
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      logger.error('SMSINDIAHUB failed to parse JSON response', {
        phone: formattedPhone.slice(-4) + '***',
        responseText: responseText.substring(0, 200),
      })
      return {
        success: false,
        message: 'Invalid response from SMS service',
        error: 'Failed to parse API response',
      }
    }

    // Check for success (ErrorCode should be empty or "000" for success)
    const errorCode = responseData.ErrorCode
    const isSuccess = response.ok && (!errorCode || errorCode === '000' || errorCode === '')

    if (isSuccess) {
      // Extract message ID from response
      const messageId = responseData.JobId || 
                       responseData.MessageId || 
                       (responseData.MessageData && responseData.MessageData[0]?.MessageId) ||
                       'unknown'

      logger.info('SMSINDIAHUB SMS sent successfully', {
        phone: formattedPhone.slice(-4) + '***',
        senderId,
        channel,
        messageId,
      })

      return {
        success: true,
        message: 'SMS sent successfully via SMSINDIAHUB',
        messageId: messageId,
      }
    }

    // Handle error response
    const errorMessage = responseData.ErrorMessage || 
                        responseData.message || 
                        'Failed to send SMS'

    logger.error('SMSINDIAHUB SMS send failed', {
      phone: formattedPhone.slice(-4) + '***',
      error: errorMessage,
    })

    return {
      success: false,
      message: `Failed to send SMS: ${errorMessage}`,
      error: errorMessage,
    }
  } catch (error: any) {
    logger.error('SMSINDIAHUB SMS send error', {
      error: error.message,
      phone: phone.slice(-4) + '***',
    })

    return {
      success: false,
      message: `SMS send error: ${error.message || 'Unknown error'}`,
      error: error.message,
    }
  }
}

/**
 * Send OTP via SMSINDIAHUB
 * Uses Transactional channel (Trans) for OTP messages
 * Uses SMSINDIAHUB template format: Welcome to the ##var## powered by SMSINDIAHUB. Your OTP for registration is ##var##
 */
export async function sendOTPViaSMSIndiaHub(
  phone: string,
  otp: string,
  config?: Partial<SMSIndiaHubConfig>
): Promise<SMSIndiaHubResult> {
  // Use SMSINDIAHUB template format with ##var## placeholders
  // Template: "Welcome to the ##var## powered by SMSINDIAHUB. Your OTP for registration is ##var##"
  const appName = process.env.APP_NAME || 'KMS Election'
  const message = `Welcome to the ${appName} powered by SMSINDIAHUB. Your OTP for registration is ${otp}`
  
  // Force Transactional channel for OTP messages
  return sendSMSIndiaHub(phone, message, {
    ...config,
    channel: 'Trans', // Transactional channel for OTP
  })
}

