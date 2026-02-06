/**
 * Creates 15 offline vote admin accounts.
 * Run: npx tsx scripts/create-offline-vote-admins.ts
 * Requires: DATABASE_URL in .env or .env.local (set to production DB URL)
 *
 * Login: https://your-app-url/admin/offline-votes/trustees/login
 * Emails: offline-admin-1@kms-election.com ... offline-admin-15@kms-election.com
 * Passwords: OfflineVote1! ... OfflineVote15!
 * 
 * IMPORTANT: Run this script locally with production DATABASE_URL to create accounts in production.
 * After running, offline admins can login on the deployed site.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local or .env so DATABASE_URL is set when running: npx tsx scripts/create-offline-vote-admins.ts
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

// Fixed passwords for easy reference and login (OfflineVote1! through OfflineVote15!)
const PASSWORDS = [
  'OfflineVote1!', 'OfflineVote2!', 'OfflineVote3!', 'OfflineVote4!', 'OfflineVote5!',
  'OfflineVote6!', 'OfflineVote7!', 'OfflineVote8!', 'OfflineVote9!', 'OfflineVote10!',
  'OfflineVote11!', 'OfflineVote12!', 'OfflineVote13!', 'OfflineVote14!', 'OfflineVote15!'
]

async function main() {
  console.log('Creating 15 offline vote admin accounts...\n')

  const adminAccounts: Array<{ email: string; name: string; adminId: string; userId: string; adminRecordId: string; password: string }> = []

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
        console.log(`User ${email} already exists, updating...`)
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
      const admin = await prisma.admin.upsert({
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
        userId: user.id,
        adminRecordId: admin.id,
        password
      })

      console.log(`✓ Created admin ${i}/15: ${email} (${adminId})`)
    } catch (error) {
      console.error(`✗ Error creating admin ${i}:`, error)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('OFFLINE VOTE ADMIN ACCOUNTS CREATED SUCCESSFULLY')
  console.log('='.repeat(80) + '\n')

  console.log('Account Details:\n')
  adminAccounts.forEach((account, index) => {
    console.log(`${index + 1}. Email: ${account.email}`)
    console.log(`   Password: ${account.password}`)
    console.log(`   Admin ID: ${account.adminId}`)
    console.log(`   Name: ${account.name}`)
    console.log('')
  })

  console.log('\n' + '='.repeat(80))
  console.log('IMPORTANT: Save these credentials securely!')
  console.log('='.repeat(80) + '\n')

  // Save credentials to project root for reference
  const outputPath = path.join(process.cwd(), 'offline-vote-admins-credentials.json')
  const output = {
    createdAt: new Date().toISOString(),
    loginUrl: '/admin/offline-votes/trustees/login',
    accounts: adminAccounts
  }
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log('Credentials saved to: offline-vote-admins-credentials.json\n')
  console.log('LOGIN: Use the Email and Password above at: <your-site>/admin/offline-votes/trustees/login\n')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
