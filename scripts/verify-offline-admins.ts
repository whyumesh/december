/**
 * Verify offline vote admin accounts exist and are configured correctly.
 * Run: npx tsx scripts/verify-offline-admins.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local or .env
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
  console.log('Verifying offline vote admin accounts...\n')

  const emails = Array.from({ length: 15 }, (_, i) => `offline-admin-${i + 1}@kms-election.com`)

  let found = 0
  let missing = 0
  let issues: string[] = []

  for (const email of emails) {
    const userEmail = email.toLowerCase()
    
    try {
      const user = await prisma.user.findFirst({
        where: { email: userEmail },
        include: {
          adminProfile: true
        }
      })

      if (!user) {
        console.log(`❌ ${email}: User not found`)
        missing++
        continue
      }

      if (!user.password) {
        console.log(`⚠️  ${email}: User exists but has no password`)
        issues.push(`${email}: No password`)
        continue
      }

      if (!user.adminProfile) {
        console.log(`⚠️  ${email}: User exists but has no Admin profile`)
        issues.push(`${email}: No Admin profile`)
        continue
      }

      if (!user.adminProfile.isOfflineVoteAdmin) {
        console.log(`⚠️  ${email}: Admin profile exists but isOfflineVoteAdmin is false`)
        issues.push(`${email}: isOfflineVoteAdmin = false`)
        continue
      }

      if (user.role !== 'ADMIN') {
        console.log(`⚠️  ${email}: User role is "${user.role}" instead of "ADMIN"`)
        issues.push(`${email}: Role is "${user.role}"`)
        continue
      }

      console.log(`✅ ${email}: OK (Admin ID: ${user.adminProfile.adminId})`)
      found++
    } catch (error) {
      console.error(`❌ Error checking ${email}:`, error)
      issues.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Found and configured correctly: ${found}/15`)
  console.log(`❌ Missing: ${missing}/15`)
  console.log(`⚠️  Issues: ${issues.length}`)
  
  if (issues.length > 0) {
    console.log('\nIssues found:')
    issues.forEach(issue => console.log(`  - ${issue}`))
  }

  if (found === 15) {
    console.log('\n✅ All 15 offline vote admin accounts are configured correctly!')
  } else {
    console.log('\n⚠️  Some accounts need to be fixed. Re-run create-offline-vote-admins.ts')
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
