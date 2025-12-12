import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/otp-utils'
import { normalizePhone } from '@/lib/phone'
import { createRateLimitedRoute, rateLimitConfigs } from '@/lib/rate-limit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function handler(request: NextRequest) {
  try {
    const { phone, email, otp } = await request.json()

    // Validate input
    if ((!phone && !email) || !otp) {
      return NextResponse.json({ 
        error: 'Phone number or email and OTP are required' 
      }, { status: 400 })
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ 
        error: 'Invalid OTP format. OTP must be 6 digits.' 
      }, { status: 400 })
    }

    // Determine identifier (email or phone)
    const otpIdentifier = email 
      ? email.toLowerCase().trim()
      : normalizePhone(phone)

    console.log('🔍 Verifying OTP:', {
      identifier: otpIdentifier.slice(0, 3) + '***',
      otpLength: otp.length,
    })

    // Verify OTP using utility function
    const verificationResult = await verifyOTP(otpIdentifier, otp)

    if (!verificationResult.success) {
      return NextResponse.json({ 
        error: verificationResult.message || 'Invalid or expired OTP' 
      }, { status: 400 })
    }

    console.log('✅ OTP verified successfully')

    return NextResponse.json({ 
      message: 'OTP verified successfully',
      success: true
    })

  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error?.message || 'Failed to verify OTP'
    }, { status: 500 })
  }
}

export const POST = createRateLimitedRoute(handler, rateLimitConfigs.otp)
