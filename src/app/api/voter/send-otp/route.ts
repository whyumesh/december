import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendOTP as sendEmailOTP } from '@/lib/email'
// import { sendOTP as sendSMSOTP } from '@/lib/otp' // Twilio - Inactive for now, kept for future use
import { sendOTPViaSMSIndiaHub } from '@/lib/sms-indiahub'
import { 
  generateOTP, 
  createOTPExpiry, 
  saveOTP, 
  canResendOTP, 
  incrementResendCount 
} from '@/lib/otp-utils'
import { createRateLimitedRoute, rateLimitConfigs } from '@/lib/rate-limit'
import { logRequest } from '@/lib/logger'
import { buildPhoneWhereFilters, normalizePhone } from '@/lib/phone'
import { hasCompletedAllEligibleVotes } from '@/lib/voter-eligibility'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function handler(request: NextRequest) {
  try {
    // Check critical environment variables first
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is missing')
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'Database connection not configured'
      }, { status: 500 })
    }

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

    // Find voter by phone or email
    let voter
    if (email) {
      // Search by email
      voter = await prisma.voter.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive'
          }
        }
      })
      console.log('Voter lookup by email result:', { 
        found: !!voter, 
        voterId: voter?.voterId,
        isActive: voter?.isActive 
      })
    } else if (phone) {
      // Search by phone (existing logic)
      const normalizedPhone = normalizePhone(phone)
      console.log('Normalized phone:', normalizedPhone)
      const phoneFilters = buildPhoneWhereFilters(phone)
      console.log('Phone filters:', phoneFilters.length)

      voter = await prisma.voter.findFirst({
        where: phoneFilters.length ? { OR: phoneFilters } : { phone }
      })
      console.log('Voter lookup by phone result:', { 
        found: !!voter, 
        voterId: voter?.voterId,
        isActive: voter?.isActive 
      })
    }

    console.log('Voter lookup result:', { 
      found: !!voter, 
      voterId: voter?.voterId,
      isActive: voter?.isActive 
    })

    if (!voter) {
      const errorMessage = email 
        ? 'Email address not found in voter list' 
        : 'Phone number not found in voter list'
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }

    if (!voter.isActive) {
      return NextResponse.json({ error: 'Your voter registration is inactive' }, { status: 403 })
    }

    // Check if voter is from Kutch zone (restrict access to Kutch zone only)
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })

    if (!kutchZone) {
      console.error('Kutch zone not found in database')
      return NextResponse.json({ 
        error: 'System configuration error. Please contact administrator.' 
      }, { status: 500 })
    }

    if (voter.yuvaPankZoneId !== kutchZone.id) {
      console.log('OTP request blocked - voter not from Kutch zone:', {
        voterId: voter.voterId,
        voterZoneId: voter.yuvaPankZoneId,
        kutchZoneId: kutchZone.id,
        voterZone: voter.yuvaPankZoneId ? 'Other zone' : 'No zone assigned'
      })
      return NextResponse.json({ 
        error: 'Access restricted to Kutch zone voters only.' 
      }, { status: 403 })
    }

    // Check if voter has completed all eligible votes
    const completionStatus = await hasCompletedAllEligibleVotes(voter.id)
    if (completionStatus.completed) {
      console.log('OTP request blocked - voter has completed all eligible votes:', {
        voterId: voter.voterId,
        completedElections: completionStatus.completedElections,
      })
      return NextResponse.json({ 
        error: completionStatus.message || 
        'You have completed voting in all eligible elections. Login is no longer available.' 
      }, { status: 403 })
    }

    // Determine OTP delivery method
    const useEmail = !!email
    const targetEmail = email || null
    const otpIdentifier = useEmail && targetEmail 
      ? targetEmail.toLowerCase().trim()
      : normalizePhone((voter.phone || phone || '').toString())

    // Check resend limit
    const resendCheck = canResendOTP(otpIdentifier)
    if (!resendCheck.allowed) {
      return NextResponse.json({ 
        error: resendCheck.message || 'Resend limit exceeded. Please wait before requesting again.' 
      }, { status: 429 })
    }

    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = createOTPExpiry(5) // 5 minutes expiry

    // Display OTP in terminal for development/testing
    const recipient = useEmail ? targetEmail : (voter.phone || phone)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📱 OTP GENERATED (${useEmail ? 'EMAIL' : 'SMS'}):`)
    console.log(`   Recipient: ${recipient}`)
    console.log(`   OTP Code: ${otpCode}`)
    console.log(`   Expires at: ${expiresAt.toLocaleString()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Save OTP to database
    await saveOTP(otpIdentifier, otpCode, expiresAt)

    let result
    let message

    if (useEmail && targetEmail) {
      // Send OTP via email
      console.log('📧 Sending OTP via email to:', targetEmail)
      try {
        result = await sendEmailOTP(targetEmail, otpCode, {
          recipientName: voter.name,
          expiryMinutes: 5,
        })
        message = result.message || 'OTP has been sent to your registered email address.'
        console.log('📧 Email send result:', { success: result.success, message: result.message })
      } catch (emailError: any) {
        console.error('❌ Email sending error caught in API route:', emailError)
        return NextResponse.json({ 
          error: 'Failed to send OTP email',
          message: emailError?.message || 'Email service error. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? emailError?.stack : undefined
        }, { status: 500 })
      }
    } else {
        // Send OTP via SMS (SMSINDIAHUB preferred, Twilio as fallback)
        const smsTarget = voter.phone || phone
        if (!smsTarget) {
          return NextResponse.json({ 
            error: 'Phone number is required for SMS delivery' 
          }, { status: 400 })
        }
        
        // Send OTP via SMSINDIAHUB (only active SMS provider)
        console.log('📱 Sending OTP via SMSINDIAHUB to:', smsTarget)
        result = await sendOTPViaSMSIndiaHub(smsTarget, otpCode)
        
        if (result.success) {
          message = result.message || 'OTP has been sent to your registered phone number via SMS.'
          console.log('✅ SMSINDIAHUB SMS sent successfully')
        } else {
          // SMSINDIAHUB failed - return error
          console.error('❌ SMSINDIAHUB failed:', result.error || result.message)
          message = result.message || 'Failed to send OTP via SMS. Please try again or contact support.'
        }
    }

    // Increment resend count if this is a resend
    incrementResendCount(otpIdentifier)

    // If sending failed, return error (OTP is still stored in DB for retry scenarios)
    if (!result.success) {
      return NextResponse.json({ 
        error: result.message || 'Failed to send OTP. Please try again.'
      }, { status: 500 })
    }

    // Return success response without exposing OTP
    const successResponse = NextResponse.json({ 
      message: message,
      success: true,
      method: useEmail ? 'email' : 'sms'
    })
    
    console.log('=== Send OTP Handler Success ===')
    console.log('Response status:', 200)
    return successResponse

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
