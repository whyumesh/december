// Login link token generation and verification
// Generates secure, time-limited login tokens for direct login links

import { prisma } from './db'
import { signToken } from './jwt'
import { logger } from './logger'
import crypto from 'crypto'

const LOGIN_LINK_EXPIRY_MINUTES = 10 // Login links expire in 10 minutes
const LOGIN_LINK_SECRET = process.env.LOGIN_LINK_SECRET || process.env.JWT_SECRET || 'login-link-secret'

/**
 * Generate a secure login token for a voter
 */
export async function generateLoginToken(
  voterId: string,
  phone?: string,
  email?: string
): Promise<{ token: string; loginLink: string; expiresAt: Date }> {
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + LOGIN_LINK_EXPIRY_MINUTES)

  // Generate a unique token ID
  const tokenId = crypto.randomBytes(32).toString('hex')
  
  // Create JWT token with voter info
  const token = signToken(
    {
      userId: voterId,
      tokenId,
      phone,
      email,
      type: 'login_link',
      expiresAt: expiresAt.toISOString(),
    },
    `${LOGIN_LINK_EXPIRY_MINUTES}m`
  )

  // Store token in database for verification
  await prisma.oTP.create({
    data: {
      phone: phone || email || voterId, // Use phone/email as identifier
      code: tokenId, // Store token ID as code
      expiresAt,
      isUsed: false,
    },
  })

  // Generate login link
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const loginLink = `${baseUrl}/api/voter/login-link/${token}`

  logger.info('Login token generated', {
    voterId,
    expiresAt: expiresAt.toISOString(),
  })

  return {
    token,
    loginLink,
    expiresAt,
  }
}

/**
 * Verify and consume a login token
 */
export async function verifyLoginToken(
  token: string
): Promise<{ success: boolean; voterId?: string; phone?: string; email?: string; error?: string }> {
  try {
    // Verify JWT token first
    const { verifyToken } = require('./jwt')
    let decoded: any
    
    try {
      decoded = verifyToken(token)
    } catch (jwtError: any) {
      return { success: false, error: 'Invalid or expired token' }
    }

    // Check if it's a login link token
    if (decoded.type !== 'login_link') {
      return { success: false, error: 'Invalid token type' }
    }

    const tokenId = decoded.tokenId
    if (!tokenId) {
      return { success: false, error: 'Invalid token format' }
    }

    // Find token in database
    const tokenRecord = await prisma.oTP.findFirst({
      where: {
        code: tokenId,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!tokenRecord) {
      return { success: false, error: 'Token not found or already used' }
    }

    // Check if expired
    if (new Date() > tokenRecord.expiresAt) {
      // Mark as used
      await prisma.oTP.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      })
      return { success: false, error: 'Token has expired' }
    }

    // Mark token as used
    await prisma.oTP.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true },
    })

    return {
      success: true,
      voterId: decoded.userId,
      phone: decoded.phone,
      email: decoded.email,
    }
  } catch (error: any) {
    logger.error('Login token verification failed', { error: error.message })
    return { success: false, error: 'Invalid or expired token' }
  }
}

