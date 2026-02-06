import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canMergeOfflineVotes } from '@/lib/offline-vote-auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PASSWORDS = [
  'OfflineVote1!', 'OfflineVote2!', 'OfflineVote3!', 'OfflineVote4!', 'OfflineVote5!',
  'OfflineVote6!', 'OfflineVote7!', 'OfflineVote8!', 'OfflineVote9!', 'OfflineVote10!',
  'OfflineVote11!', 'OfflineVote12!', 'OfflineVote13!', 'OfflineVote14!', 'OfflineVote15!'
]

export async function POST(request: NextRequest) {
  try {
    // Check authorization - only main admin can create offline vote admins
    const canMerge = await canMergeOfflineVotes()
    if (!canMerge) {
      return NextResponse.json(
        { error: 'Unauthorized. Only main admin can create offline vote admins.' },
        { status: 403 }
      )
    }

    const adminAccounts: Array<{ email: string; name: string; adminId: string; password: string }> = []

    for (let i = 1; i <= 15; i++) {
      const email = `offline-admin-${i}@kms-election.com`
      const name = `Offline Vote Admin ${i}`
      const adminId = `OFFLINE_ADMIN_${String(i).padStart(3, '0')}`
      const password = PASSWORDS[i - 1]
      
      const hashedPassword = await bcrypt.hash(password, 12)

      try {
        // Check if user already exists
        let user = await prisma.user.findFirst({
          where: { email }
        })

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              password: hashedPassword,
              role: 'ADMIN',
              name
            }
          })
        } else {
          user = await prisma.user.create({
            data: {
              email,
              name,
              password: hashedPassword,
              role: 'ADMIN',
              phone: `+1000000000${i}`
            }
          })
        }

        // Create or update Admin record
        await prisma.admin.upsert({
          where: { userId: user.id },
          update: {
            isOfflineVoteAdmin: true
          },
          create: {
            userId: user.id,
            adminId,
            isOfflineVoteAdmin: true
          }
        })

        adminAccounts.push({
          email,
          name,
          adminId,
          password
        })
      } catch (error) {
        console.error(`Error creating admin ${i}:`, error)
        return NextResponse.json(
          { error: `Failed to create admin ${i}: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: '15 offline vote admin accounts created successfully',
      accountsCreated: adminAccounts.length,
      accounts: adminAccounts.map(a => ({
        email: a.email,
        adminId: a.adminId,
        name: a.name
        // Don't return password in response
      }))
    })
  } catch (error) {
    console.error('Error creating offline vote admins:', error)
    return NextResponse.json(
      { error: 'Failed to create offline vote admins', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
