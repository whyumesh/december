import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateOTP } from '@/lib/utils'
import { sendOTP } from '@/lib/otp'
import { sendVoterOTP } from '@/lib/mail'
import { createRateLimitedRoute, rateLimitConfigs } from '@/lib/rate-limit'
import { logRequest } from '@/lib/logger'
import { buildPhoneWhereFilters, normalizePhone } from '@/lib/phone'
import { hasRegisteredEmail } from '@/lib/validation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function handler(request: NextRequest) {
  try {
    logRequest(request, 'OTP send attempt')
    
    console.log('=== Send OTP Handler Started ===')
    console.log('Request method:', request.method)
    console.log('Request URL:', request.url)
    
    let requestBody
    try {
      requestBody = await request.json()
      console.log('Request body parsed:', { phone: requestBody.phone ? '***' : 'missing' })
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const { phone, email } = requestBody

    console.log('Send OTP request received:', { 
      phone: phone ? '***' : 'missing',
      email: email ? '***' : 'missing'
    })

    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone number or email is required' }, { status: 400 })
    }

    // ============================================
    // SEPARATE FLOWS: PHONE OTP (Indian Voters) vs EMAIL OTP (Overseas Voters)
    // ============================================

    // EMAIL OTP FLOW - For Overseas Voters Only
    if (email) {
      console.log('=== EMAIL OTP FLOW (Overseas Voters) ===')
      
      // Check database connection before proceeding
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing')
        return NextResponse.json({ 
          error: 'Server configuration error',
          message: 'Database connection not configured. Please contact administrator.'
        }, { status: 503 })
      }
      
      // Find voter by email (user-provided email is used for lookup only)
      let voter
      try {
        voter = await prisma.voter.findFirst({
          where: {
            email: {
              equals: email,
              mode: 'insensitive'
            }
          }
        })
      } catch (dbError: any) {
        console.error('Database error during voter lookup:', dbError)
        if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('connection')) {
          return NextResponse.json({ 
            error: 'Database connection error',
            message: 'Unable to connect to database. Please try again later or contact administrator.'
          }, { status: 503 })
        }
        throw dbError // Re-throw if it's a different error
      }
      
      console.log('Voter lookup by email result:', { 
        found: !!voter, 
        voterId: voter?.voterId,
        hasEmail: hasRegisteredEmail(voter?.email),
        isActive: voter?.isActive 
      })

      if (!voter) {
        return NextResponse.json({ 
          error: 'Email address not found in voter list. Email OTP is only available for overseas voters with registered email addresses.' 
        }, { status: 404 })
      }

      if (!voter.isActive) {
        return NextResponse.json({ error: 'Your voter registration is inactive' }, { status: 403 })
      }

      // CRITICAL: Validate that voter has email in database (overseas voter check)
      if (!hasRegisteredEmail(voter.email)) {
        return NextResponse.json({ 
          error: 'Email OTP is only available for overseas voters. This voter does not have a registered email address. Please use phone number OTP instead.' 
        }, { status: 400 })
      }

      // Use the email from database (not user-provided email)
      const registeredEmail = voter.email!.trim().toLowerCase()
      console.log('Using registered email from database:', registeredEmail)

      // Generate OTP
      const otpCode = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Display OTP in terminal for development/testing
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📧 OTP GENERATED (EMAIL - Overseas Voter):`)
      console.log(`   Recipient: ${registeredEmail}`)
      console.log(`   OTP Code: ${otpCode}`)
      console.log(`   Expires at: ${expiresAt.toLocaleString()}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Store OTP in database (using email as identifier)
      try {
        await prisma.oTP.create({
          data: {
            phone: registeredEmail, // Store email as identifier for email OTPs
            code: otpCode,
            expiresAt
          }
        })
      } catch (dbError: any) {
        console.error('Database error storing OTP:', dbError)
        if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('connection')) {
          return NextResponse.json({ 
            error: 'Database connection error',
            message: 'Unable to store OTP. Please try again later or contact administrator.'
          }, { status: 503 })
        }
        throw dbError // Re-throw if it's a different error
      }

      // Send OTP via email to registered email address
      console.log('Sending OTP via email to registered address:', registeredEmail)
      const result = await sendVoterOTP(registeredEmail, otpCode, voter.name)
      
      if (!result.success) {
        return NextResponse.json({ 
          error: result.message || 'Failed to send OTP email. Please try again.'
        }, { status: 500 })
      }

      // Return success response
      const successResponse = NextResponse.json({ 
        message: result.message || 'OTP has been sent to your registered email address.',
        success: true,
        method: 'email'
      })
      
      console.log('=== Email OTP Handler Success ===')
      return successResponse
    }

    // PHONE OTP FLOW - For Indian Voters (EXISTING LOGIC - UNCHANGED)
    if (phone) {
      console.log('=== PHONE OTP FLOW (Indian Voters) ===')
      
      // Check database connection before proceeding
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing')
        return NextResponse.json({ 
          error: 'Server configuration error',
          message: 'Database connection not configured. Please contact administrator.'
        }, { status: 503 })
      }
      
      // Search by phone (existing logic - completely unchanged)
      const normalizedPhone = normalizePhone(phone)
      console.log('Normalized phone:', normalizedPhone)
      const phoneFilters = buildPhoneWhereFilters(phone)
      console.log('Phone filters:', phoneFilters.length)

      let voter
      try {
        voter = await prisma.voter.findFirst({
          where: phoneFilters.length ? { OR: phoneFilters } : { phone }
        })
      } catch (dbError: any) {
        console.error('Database error during voter lookup:', dbError)
        if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('connection')) {
          return NextResponse.json({ 
            error: 'Database connection error',
            message: 'Unable to connect to database. Please try again later or contact administrator.'
          }, { status: 503 })
        }
        throw dbError // Re-throw if it's a different error
      }
      
      console.log('Voter lookup by phone result:', { 
        found: !!voter, 
        voterId: voter?.voterId,
        isActive: voter?.isActive 
      })

      if (!voter) {
        return NextResponse.json({ error: 'Phone number not found in voter list' }, { status: 404 })
      }

      if (!voter.isActive) {
        return NextResponse.json({ error: 'Your voter registration is inactive' }, { status: 403 })
      }

      // Generate OTP
      const otpCode = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Display OTP in terminal for development/testing
      const smsTarget = voter.phone || phone
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📱 OTP GENERATED (SMS - Indian Voter):`)
      console.log(`   Recipient: ${smsTarget}`)
      console.log(`   OTP Code: ${otpCode}`)
      console.log(`   Expires at: ${expiresAt.toLocaleString()}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Store OTP identifier (phone for SMS)
      const otpIdentifier = normalizePhone((voter.phone || phone || '').toString())
      
      // Store OTP in database
      try {
        await prisma.oTP.create({
          data: {
            phone: otpIdentifier, // Store phone as identifier
            code: otpCode,
            expiresAt
          }
        })
      } catch (dbError: any) {
        console.error('Database error storing OTP:', dbError)
        if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('connection')) {
          return NextResponse.json({ 
            error: 'Database connection error',
            message: 'Unable to store OTP. Please try again later or contact administrator.'
          }, { status: 503 })
        }
        throw dbError // Re-throw if it's a different error
      }

      // Send OTP via SMS service (existing logic - unchanged)
      if (!smsTarget) {
        return NextResponse.json({ 
          error: 'Phone number is required for SMS delivery' 
        }, { status: 400 })
      }
      
      console.log('Sending OTP via SMS to:', smsTarget)
      const result = await sendOTP(smsTarget, otpCode)
      const message = result.message || 'OTP has been sent to your registered phone number.'

      // If sending failed, return error
      if (!result.success) {
        return NextResponse.json({ 
          error: result.message || 'Failed to send OTP. Please try again.'
        }, { status: 500 })
      }

      // Return success response
      const successResponse = NextResponse.json({ 
        message: message,
        success: true,
        method: 'sms'
      })
      
      console.log('=== Phone OTP Handler Success ===')
      return successResponse
    }

    // This should never be reached, but added as safety
    return NextResponse.json({ 
      error: 'Invalid request. Please provide either phone number or email address.' 
    }, { status: 400 })

  } catch (error) {
    console.error('=== Send OTP Handler Error ===')
    console.error('Error sending OTP:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { 
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    // Always return a proper error response - never return empty
    try {
      const errorResponse = NextResponse.json({ 
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }, { status: 500 })
      
      console.log('=== Send OTP Handler Error Response ===')
      return errorResponse
    } catch (responseError) {
      // If even creating the error response fails, log and return minimal response
      console.error('Failed to create error response:', responseError)
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error', message: errorMessage }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

export const POST = createRateLimitedRoute(handler, rateLimitConfigs.otp)
