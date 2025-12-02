import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizePhone } from '@/lib/phone'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { phone, email, otp } = await request.json()

    if ((!phone && !email) || !otp) {
      return NextResponse.json({ error: 'Phone number or email and OTP are required' }, { status: 400 })
    }

    // For email OTPs, we stored the email in the phone field
    // For phone OTPs, use normalized phone
    const otpIdentifier = email 
      ? email.toLowerCase().trim() // Use email for email OTPs
      : normalizePhone(phone)

    // Find the OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: otpIdentifier,
        code: otp,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent OTP
      }
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    })

    return NextResponse.json({ message: 'OTP verified successfully' })

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
