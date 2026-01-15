import { NextRequest, NextResponse } from 'next/server'
import { verifyLoginToken } from '@/lib/login-link'
import { prisma } from '@/lib/db'
import { sessionManager } from '@/lib/session'
import { buildPhoneWhereFilters, normalizePhone } from '@/lib/phone'
import { hasCompletedAllEligibleVotes } from '@/lib/voter-eligibility'
import { logAuth } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.redirect(new URL('/voter/login?error=Invalid+login+link', request.url))
    }

    console.log('🔗 Verifying login link token...')

    // Verify the login token
    const verification = await verifyLoginToken(token)

    if (!verification.success) {
      console.error('❌ Login link verification failed:', verification.error)
      return NextResponse.redirect(
        new URL(`/voter/login?error=${encodeURIComponent(verification.error || 'Invalid or expired login link')}`, request.url)
      )
    }

    const { voterId, phone, email } = verification

    if (!voterId) {
      return NextResponse.redirect(
        new URL('/voter/login?error=Invalid+login+link', request.url)
      )
    }

    // Find voter
    let voter
    if (email) {
      voter = await prisma.voter.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      })
    } else if (phone) {
      const phoneFilters = buildPhoneWhereFilters(phone)
      voter = await prisma.voter.findFirst({
        where: phoneFilters.length ? { OR: phoneFilters } : { phone },
      })
    } else {
      // Fallback: find by voterId if available
      voter = await prisma.voter.findFirst({
        where: { id: voterId },
      })
    }

    if (!voter) {
      console.error('❌ Voter not found for login link')
      return NextResponse.redirect(
        new URL('/voter/login?error=Voter+not+found', request.url)
      )
    }

    // Check if voter is from Kutch zone (restrict login to Kutch zone only)
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })

    if (!kutchZone) {
      console.error('Kutch zone not found in database')
      return NextResponse.redirect(
        new URL('/voter/login?error=System+configuration+error', request.url)
      )
    }

    if (voter.yuvaPankZoneId !== kutchZone.id) {
      console.log('Login blocked - voter not from Kutch zone:', {
        voterId: voter.voterId,
        voterZoneId: voter.yuvaPankZoneId,
        kutchZoneId: kutchZone.id
      })
      return NextResponse.redirect(
        new URL('/voter/login?error=' + encodeURIComponent('Access restricted to Kutch zone voters only.'), request.url)
      )
    }

    // Check if voter has completed all eligible votes
    const completionStatus = await hasCompletedAllEligibleVotes(voter.id)
    if (completionStatus.completed) {
      console.log('Login blocked - voter has completed all eligible votes')
      return NextResponse.redirect(
        new URL(`/voter/login?error=${encodeURIComponent(completionStatus.message || 'Login no longer available')}`, request.url)
      )
    }

    // Update voter's last login
    await prisma.voter.updateMany({
      where: { id: voter.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    // Create session
    console.log('✅ Creating session for voter:', { id: voter.id, voterId: voter.voterId })
    const sessionToken = sessionManager.createSession({
      userId: voter.id,
      voterId: voter.voterId,
      phone: voter.phone,
      role: 'VOTER',
    })

    // Log successful authentication
    logAuth(voter.id, 'voter_login_link', true, { voterId: voter.voterId, phone: voter.phone })

    // Create response that redirects to dashboard
    const response = NextResponse.redirect(new URL('/voter/dashboard', request.url))

    // Set the voter token cookie
    response.cookies.set('voter-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    console.log('✅ Login link successful, redirecting to dashboard')

    return response
  } catch (error: any) {
    console.error('❌ Login link error:', error)
    return NextResponse.redirect(
      new URL(`/voter/login?error=${encodeURIComponent(error.message || 'Login failed')}`, request.url)
    )
  }
}

