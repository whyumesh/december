import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@/lib/utils'
import { sendOTP } from '@/lib/otp'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Authorized phone numbers for results declaration
const AUTHORIZED_PHONES = ['9448118832', '9930021208']

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

    // Send OTP via SMS
    const sendResult = await sendOTP(normalizedPhone, otpCode)

    if (!sendResult.success) {
      return NextResponse.json({ 
        error: 'Failed to send OTP',
        message: sendResult.message 
      }, { status: 500 })
    }

    console.log(`✅ Admin Results OTP sent to ${normalizedPhone.slice(0, 2)}****${normalizedPhone.slice(-2)}`)

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

