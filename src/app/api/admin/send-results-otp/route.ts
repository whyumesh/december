import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@/lib/utils'
import { sendOTPViaSMSIndiaHub } from '@/lib/sms-indiahub'
import { sendOTP as sendOTPViaTwilio } from '@/lib/otp'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Authorized phone numbers for results declaration
const AUTHORIZED_PHONES = ['9821520010', '9930021208']

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Normalize phone number (remove any formatting)
    const normalizedPhone = phone.replace(/\D/g, '')

    // Check if phone is authorized
    if (!AUTHORIZED_PHONES.includes(normalizedPhone)) {
      return NextResponse.json({ 
        error: 'Unauthorized phone number for results declaration' 
      }, { status: 403 })
    }

    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    await prisma.oTP.create({
      data: {
        phone: normalizedPhone,
        code: otpCode,
        expiresAt,
        isUsed: false
      }
    })

    // Show OTP on terminal (always, so admin can use it if SMS is delayed or fails)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔐 RESULT DECLARATION OTP (see terminal):')
    console.log(`   Phone: ${normalizedPhone.slice(0, 2)}****${normalizedPhone.slice(-2)}`)
    console.log(`   OTP Code: ${otpCode}`)
    console.log(`   Valid for: 10 minutes`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Send OTP: prefer SMS India Hub (same as voter OTP), fallback to Twilio
    let sendResult: { success: boolean; message: string }
    const indiaHubResult = await sendOTPViaSMSIndiaHub(normalizedPhone, otpCode)
    if (indiaHubResult.success) {
      sendResult = { success: true, message: indiaHubResult.message }
    } else {
      const twilioResult = await sendOTPViaTwilio(normalizedPhone, otpCode)
      sendResult = { success: twilioResult.success, message: twilioResult.message || indiaHubResult.message }
    }

    if (!sendResult.success) {
      return NextResponse.json({ 
        error: 'Failed to send OTP',
        message: sendResult.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `OTP sent to ${normalizedPhone.slice(0, 2)}****${normalizedPhone.slice(-2)}`
    })
  } catch (error) {
    console.error('Error sending admin results OTP:', error)
    return NextResponse.json({ 
      error: 'Failed to send OTP',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

