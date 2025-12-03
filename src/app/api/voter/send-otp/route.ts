import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateOTP } from '@/lib/utils'
import { sendOTP } from '@/lib/otp'
import { sendVoterOTP } from '@/lib/mail'
import { createRateLimitedRoute, rateLimitConfigs } from '@/lib/rate-limit'
import { logRequest } from '@/lib/logger'
import { buildPhoneWhereFilters, normalizePhone } from '@/lib/phone'

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

    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Determine OTP delivery method
    // If email is provided in request, use email; otherwise use SMS (phone)
    const useEmail = !!email
    const targetEmail = email || null
    
    // Display OTP in terminal for development/testing
    const recipient = useEmail ? targetEmail : (voter.phone || phone)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📱 OTP GENERATED (${useEmail ? 'EMAIL' : 'SMS'}):`)
    console.log(`   Recipient: ${recipient}`)
    console.log(`   OTP Code: ${otpCode}`)
    console.log(`   Expires at: ${expiresAt.toLocaleString()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Store OTP identifier (phone for SMS, email for email OTPs)
    // Note: OTP table uses 'phone' field but we can store email there for email-based OTPs
    const otpIdentifier = useEmail && targetEmail 
      ? targetEmail.toLowerCase().trim() // Store email for email OTPs
      : normalizePhone((voter.phone || phone || '').toString())
    
    // Store OTP in database
    await prisma.oTP.create({
      data: {
        phone: otpIdentifier, // Store phone or email as identifier
        code: otpCode,
        expiresAt
      }
    })

    let result
    let message

    if (useEmail && targetEmail) {
      // Send OTP via email
      console.log('Sending OTP via email to:', targetEmail)
      result = await sendVoterOTP(targetEmail, otpCode, voter.name)
      message = result.message || 'OTP has been sent to your registered email address.'
    } else {
      // Send OTP via SMS service
      const smsTarget = voter.phone || phone
      if (!smsTarget) {
        return NextResponse.json({ 
          error: 'Phone number is required for SMS delivery' 
        }, { status: 400 })
      }
      console.log('Sending OTP via SMS to:', smsTarget)
      result = await sendOTP(smsTarget, otpCode)
      message = result.message || 'OTP has been sent to your registered phone number.'
    }

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
    console.error('Error details:', { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    const errorResponse = NextResponse.json({ 
      error: error instanceof Error ? `Internal server error: ${errorMessage}` : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
    
    console.log('=== Send OTP Handler Error Response ===')
    return errorResponse
  }
}

export const POST = createRateLimitedRoute(handler, rateLimitConfigs.otp)
