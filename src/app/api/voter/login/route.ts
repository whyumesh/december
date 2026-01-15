import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createRateLimitedRoute, rateLimitConfigs } from '@/lib/rate-limit'
import { handleError, ValidationError, AuthenticationError, NotFoundError } from '@/lib/error-handler'
import { logger, logAuth, logRequest } from '@/lib/logger'
import { sessionManager } from '@/lib/session'
import { buildPhoneWhereFilters, normalizePhone } from '@/lib/phone'
import { hasCompletedAllEligibleVotes } from '@/lib/voter-eligibility'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function handler(request: NextRequest) {
  try {
    logRequest(request, 'Voter login attempt')
    
    const { phone, email, otp, location } = await request.json()

    console.log('Login request received:', { 
      phone: phone ? '***' : 'missing',
      email: email ? '***' : 'missing',
      otp: otp ? '***' : 'missing', 
      location: location ? 'present' : 'missing' 
    })

    if ((!phone && !email) || !otp || !location) {
      throw new ValidationError('Phone or email, OTP, and location are required')
    }

    // For email OTPs, we stored the email in the phone field
    // For phone OTPs, use normalized phone
    const otpIdentifier = email 
      ? email.toLowerCase().trim() // Use email for email OTPs
      : normalizePhone(phone)
    console.log('OTP identifier:', otpIdentifier ? '***' : 'missing')

    // Verify OTP - look for recently used OTP
    // Since verify-otp marks it as used, we just need to check it's used and not expired
    const now = new Date()
    // Give a 2-minute grace period after expiration for login completion
    const gracePeriod = new Date(now.getTime() - 2 * 60 * 1000)
    
    console.log('Checking OTP:', { 
      otpIdentifier: otpIdentifier ? '***' : 'missing',
      otp: otp ? '***' : 'missing',
      now: now.toISOString(),
      gracePeriod: gracePeriod.toISOString()
    })
    
    // Look for OTP that was verified (marked as used) and hasn't expired (with grace period)
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: otpIdentifier,
        code: otp,
        isUsed: true,
        expiresAt: {
          gt: gracePeriod // Allow 2 minutes after expiration for login
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('OTP lookup result:', { 
      found: !!otpRecord,
      otpRecord: otpRecord ? { 
        id: otpRecord.id, 
        createdAt: otpRecord.createdAt.toISOString(),
        expiresAt: otpRecord.expiresAt.toISOString(),
        isUsed: otpRecord.isUsed
      } : null
    })

    if (!otpRecord) {
      // Check if there are any OTPs to help debug
      const allOtps = await prisma.oTP.findMany({
        where: { phone: otpIdentifier },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      console.log('Recent OTPs:', allOtps.map(otp => ({
        code: otp.code,
        isUsed: otp.isUsed,
        createdAt: otp.createdAt.toISOString(),
        expiresAt: otp.expiresAt.toISOString()
      })))
      
      throw new AuthenticationError('Invalid or expired OTP. Please verify OTP first.')
    }

    // Find voter by phone or email
    let voter
    if (email) {
      voter = await prisma.voter.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive'
          }
        }
      })
    } else {
      const phoneFilters = buildPhoneWhereFilters(phone)
      voter = await prisma.voter.findFirst({
        where: phoneFilters.length ? { OR: phoneFilters } : { phone }
      })
    }

    console.log('Voter lookup result:', { phone, voter: voter ? { id: voter.id, name: voter.name, voterId: voter.voterId } : null })

    if (!voter) {
      throw new NotFoundError('Voter not found. Please contact administrator.')
    }

    // Check if voter is from Kutch zone (restrict login to Kutch zone only)
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })

    if (!kutchZone) {
      console.error('Kutch zone not found in database')
      throw new AuthenticationError('System configuration error. Please contact administrator.')
    }

    if (voter.yuvaPankZoneId !== kutchZone.id) {
      console.log('Login blocked - voter not from Kutch zone:', {
        voterId: voter.voterId,
        voterZoneId: voter.yuvaPankZoneId,
        kutchZoneId: kutchZone.id,
        voterZone: voter.yuvaPankZoneId ? 'Other zone' : 'No zone assigned'
      })
      throw new AuthenticationError(
        'Voting is currently open only for Kutch zone voters. If you are a Kutch zone voter and facing issues, please contact the election commission.'
      )
    }

    // Check if voter has completed all eligible votes
    const completionStatus = await hasCompletedAllEligibleVotes(voter.id)
    if (completionStatus.completed) {
      console.log('Login blocked - voter has completed all eligible votes:', {
        voterId: voter.voterId,
        completedElections: completionStatus.completedElections,
      })
      throw new AuthenticationError(
        completionStatus.message || 
        'You have completed voting in all eligible elections. Login is no longer available.'
      )
    }

    // Update voter's last login
    await prisma.voter.updateMany({
      where: { id: voter.id },
      data: { 
        lastLoginAt: new Date()
      }
    })

    // Create session
    console.log('Creating session for voter:', { id: voter.id, voterId: voter.voterId, phone: voter.phone })
    const token = sessionManager.createSession({
      userId: voter.id, // Use voter.id as userId for session
      voterId: voter.voterId,
      phone: voter.phone,
      role: 'VOTER'
    })
    console.log('Session token created:', token ? `${token.substring(0, 20)}...` : 'null')

    // Log successful authentication
    logAuth(voter.id, 'voter_login', true, { voterId: voter.voterId, phone })

    // Create session response with the token
    const response = NextResponse.json({ 
      message: 'Login successful',
      user: {
        id: voter.id,
        name: voter.name,
        phone: voter.phone,
        voterId: voter.voterId
      }
    })

    // Set the voter token cookie
    response.cookies.set('voter-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/' // Ensure cookie is available for all paths
    })
    
    console.log('Cookie set in response:', {
      name: 'voter-token',
      hasToken: !!token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    // Log failed authentication
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      logAuth('unknown', 'voter_login', false, { error: (error as Error).message })
    }
    
    return handleError(error, { 
      endpoint: request.nextUrl.pathname,
      method: request.method 
    })
  }
}

export const POST = createRateLimitedRoute(handler, rateLimitConfigs.auth)
