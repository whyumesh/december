import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const AUTHORIZED_PHONES = ['9821520010', '9930021208']

function getResultsPassword(): string {
  return process.env.ELECTION_RESULTS_PASSWORD || 'Maheshwari@11'
}

const JWT_EXPIRY = '2h' // token valid for 2 hours

/**
 * POST: Issue a declaration token only after password + both OTPs are verified.
 * Body: { resultsPassword: string }
 * Returns: { token: string } for use in declare/revoke requests.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const resultsPassword = body.resultsPassword as string | undefined

    if (typeof resultsPassword !== 'string' || resultsPassword.length === 0) {
      return NextResponse.json(
        { error: 'Results password is required.' },
        { status: 400 }
      )
    }

    if (resultsPassword !== getResultsPassword()) {
      return NextResponse.json(
        { error: 'Incorrect password.' },
        { status: 401 }
      )
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const usedOtps = await prisma.oTP.findMany({
      where: {
        phone: { in: AUTHORIZED_PHONES },
        isUsed: true,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' },
      select: { phone: true }
    })

    const phonesVerified = new Set(usedOtps.map((o) => o.phone))
    const bothPhonesVerified = AUTHORIZED_PHONES.every((p) => phonesVerified.has(p))

    if (!bothPhonesVerified) {
      return NextResponse.json(
        {
          error: 'Complete OTP verification for both authorized phones first, then request the token again.'
        },
        { status: 403 }
      )
    }

    const secret = getResultsPassword()
    const token = jwt.sign(
      {
        purpose: 'results-declaration',
        iat: Math.floor(Date.now() / 1000)
      },
      secret,
      { expiresIn: JWT_EXPIRY }
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Results declaration token error:', error)
    return NextResponse.json(
      { error: 'Failed to issue declaration token.' },
      { status: 500 }
    )
  }
}
