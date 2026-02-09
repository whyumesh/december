/**
 * Test offline admin login by verifying password hash.
 * Run: npx tsx scripts/test-offline-admin-login.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(process.cwd(), file)
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const t = line.trim()
        if (t && !t.startsWith('#') && t.includes('=')) {
          const [key, ...v] = t.split('=')
          const val = v.join('=').trim().replace(/^["']|["']$/g, '')
          if (key?.trim()) process.env[key.trim()] = val
        }
      }
      return
    }
  }
}

loadEnv()

const prisma = new PrismaClient()

async function main() {
  console.log('Testing offline admin login...\n')

  const testEmail = 'offline-admin-1@kms-election.com'
  const testPassword = 'OfflineVote1!'

  try {
    const userEmail = testEmail.toLowerCase()
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      include: { adminProfile: true }
    })

    if (!user) {
      console.log(`❌ User not found: ${testEmail}`)
      return
    }

    console.log(`✅ User found: ${user.email}`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Has password: ${!!user.password}`)
    console.log(`   Has adminProfile: ${!!user.adminProfile}`)
    
    if (user.adminProfile) {
      console.log(`   Admin ID: ${user.adminProfile.adminId}`)
      console.log(`   isOfflineVoteAdmin: ${user.adminProfile.isOfflineVoteAdmin}`)
    }

    if (!user.password) {
      console.log(`❌ User has no password hash`)
      return
    }

    console.log(`\nTesting password verification...`)
    console.log(`   Input password: ${testPassword}`)
    console.log(`   Stored hash: ${user.password.substring(0, 20)}...`)

    const isValid = await bcrypt.compare(testPassword, user.password)
    
    if (isValid) {
      console.log(`\n✅ Password verification SUCCESSFUL!`)
      console.log(`\nThe account should work for login.`)
      console.log(`If login still fails, check:`)
      console.log(`  1. Production DATABASE_URL matches your .env.local`)
      console.log(`  2. Production environment has DATABASE_URL set`)
      console.log(`  3. Check production logs for authentication errors`)
    } else {
      console.log(`\n❌ Password verification FAILED!`)
      console.log(`The password hash doesn't match.`)
      console.log(`Re-run: npx tsx scripts/create-offline-vote-admins.ts`)
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
