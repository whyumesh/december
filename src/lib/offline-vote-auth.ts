import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './db'

/**
 * Check if the current admin session can enter offline votes
 * Returns the admin record if authorized, null otherwise
 */
export async function canEnterOfflineVotes(): Promise<{ id: string; adminId: string; userId: string } | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return null
    }

    const userId = session.user.id
    
    // Check if user has admin profile with offline vote admin flag
    const admin = await prisma.admin.findFirst({
      where: {
        userId: userId,
        isOfflineVoteAdmin: true
      },
      select: {
        id: true,
        adminId: true,
        userId: true
      }
    })

    // Also check for hardcoded admin (for development)
    if (!admin && userId === 'admin-hardcoded-id') {
      // For hardcoded admin, check if they have an admin record
      const hardcodedAdmin = await prisma.admin.findFirst({
        where: {
          adminId: 'ADMIN001'
        },
        select: {
          id: true,
          adminId: true,
          userId: true
        }
      })
      return hardcodedAdmin || null
    }

    return admin || null
  } catch (error) {
    console.error('Error checking offline vote admin authorization:', error)
    return null
  }
}

/**
 * Check if the current admin session can merge offline votes
 * Only main admin (not offline vote admins) can merge
 */
export async function canMergeOfflineVotes(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return false
    }

    const userId = session.user.id
    
    // Hardcoded admin can always merge
    if (userId === 'admin-hardcoded-id') {
      return true
    }

    // Check if user is admin but NOT an offline vote admin
    const admin = await prisma.admin.findFirst({
      where: {
        userId: userId
      },
      select: {
        isOfflineVoteAdmin: true
      }
    })

    // Can merge if admin exists and is NOT an offline vote admin
    return admin !== null && admin.isOfflineVoteAdmin === false
  } catch (error) {
    console.error('Error checking merge authorization:', error)
    return false
  }
}

/**
 * Get admin info for the current session
 */
export async function getCurrentAdmin(): Promise<{ id: string; adminId: string; userId: string; isOfflineVoteAdmin: boolean } | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return null
    }

    const userId = session.user.id
    
    const admin = await prisma.admin.findFirst({
      where: {
        userId: userId
      },
      select: {
        id: true,
        adminId: true,
        userId: true,
        isOfflineVoteAdmin: true
      }
    })

    return admin || null
  } catch (error) {
    console.error('Error getting current admin:', error)
    return null
  }
}
