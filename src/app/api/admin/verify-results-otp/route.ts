import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Authorized phone numbers for results declaration
const AUTHORIZED_PHONES = ['9821520010', '9930021208']

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || (otp !== undefined && otp !== null && String(otp).trim() === '')) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 })
    }

    // Normalize phone number and OTP (string comparison in DB)
    const normalizedPhone = String(phone).replace(/\D/g, '')
    const otpStr = String(otp).trim()

    // Check if phone is authorized
    if (!AUTHORIZED_PHONES.includes(normalizedPhone)) {
      return NextResponse.json({ 
        error: 'Unauthorized phone number for results declaration' 
      }, { status: 403 })
    }

    // Find the most recent unused OTP for this phone
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
        code: otpStr,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!otpRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired OTP' 
      }, { status: 400 })
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    })

    console.log(`✅ Admin Results OTP verified for ${normalizedPhone.slice(0, 2)}****${normalizedPhone.slice(-2)}`)

    return NextResponse.json({ 
      success: true,
      message: 'OTP verified successfully'
    })
  } catch (error) {
    console.error('Error verifying admin results OTP:', error)
    return NextResponse.json({ 
      error: 'Failed to verify OTP',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

