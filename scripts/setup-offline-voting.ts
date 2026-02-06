/**
 * Complete setup for offline trustee voting:
 * 1. Loads .env / .env.local
 * 2. Runs: prisma migrate deploy (creates offline_votes table + isOfflineVoteAdmin column)
 * 3. Runs: prisma generate
 * 4. Creates 15 offline vote admin accounts (User + Admin) with fixed passwords
 *
 * Run from project root: npx tsx scripts/setup-offline-voting.ts
 *
 * Login at: /admin/login
 * Emails: offline-admin-1@kms-election.com ... offline-admin-15@kms-election.com
 * Passwords: OfflineVote1! ... OfflineVote15!
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
      console.log(`Loaded env from ${file}`)
      return
    }
  }
  console.warn('No .env or .env.local found - DATABASE_URL must be set in environment')
}

const PASSWORDS = [
  'OfflineVote1!', 'OfflineVote2!', 'OfflineVote3!', 'OfflineVote4!', 'OfflineVote5!',
  'OfflineVote6!', 'OfflineVote7!', 'OfflineVote8!', 'OfflineVote9!', 'OfflineVote10!',
  'OfflineVote11!', 'OfflineVote12!', 'OfflineVote13!', 'OfflineVote14!', 'OfflineVote15!'
]

async function main() {
  console.log('=== Offline Voting Setup ===\n')

  loadEnv()

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set. Add it to .env or .env.local and run again.')
    process.exit(1)
  }

  // Step 1: Generate Prisma client (skip if file locked, e.g. dev server running)
  console.log('Step 1: Generating Prisma client...')
  let generateOk = false
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd()
    })
    console.log('Prisma client generated.\n')
    generateOk = true
  } catch (e: any) {
    const msg = String(e?.message ?? e?.stack ?? e ?? '')
    console.warn('Prisma generate failed:', msg.slice(0, 120) + (msg.length > 120 ? '...' : ''))
    console.warn('Continuing with schema + admin creation. If Step 2/3 fail, stop the dev server and run again.\n')
  }

  // Step 2: Apply schema changes (works on existing DB without migrate history)
  console.log('Step 2: Applying offline voting schema to database...')
  const prisma = new PrismaClient()
  try {
    // Add column to admins if not exists (PostgreSQL 9.5+)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "isOfflineVoteAdmin" BOOLEAN NOT NULL DEFAULT false;
    `)
    // Create index if not exists
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "admins_isOfflineVoteAdmin_idx" ON "admins"("isOfflineVoteAdmin");
    `)
    // Create offline_votes table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "offline_votes" (
        "id" TEXT NOT NULL,
        "voterId" TEXT NOT NULL,
        "trusteeCandidateId" TEXT,
        "electionId" TEXT NOT NULL,
        "adminId" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        "isMerged" BOOLEAN NOT NULL DEFAULT false,
        "mergedAt" TIMESTAMP(3),
        CONSTRAINT "offline_votes_pkey" PRIMARY KEY ("id")
      );
    `)
    // Create indexes (ignore errors if exist)
    for (const index of [
      'CREATE INDEX IF NOT EXISTS "offline_votes_voterId_idx" ON "offline_votes"("voterId")',
      'CREATE INDEX IF NOT EXISTS "offline_votes_electionId_idx" ON "offline_votes"("electionId")',
      'CREATE INDEX IF NOT EXISTS "offline_votes_adminId_idx" ON "offline_votes"("adminId")',
      'CREATE INDEX IF NOT EXISTS "offline_votes_isMerged_idx" ON "offline_votes"("isMerged")',
      'CREATE INDEX IF NOT EXISTS "offline_votes_trusteeCandidateId_idx" ON "offline_votes"("trusteeCandidateId")',
      'CREATE INDEX IF NOT EXISTS "offline_votes_timestamp_idx" ON "offline_votes"("timestamp")'
    ]) {
      await prisma.$executeRawUnsafe(index).catch(() => {})
    }
    // Add FKs if not exist (PostgreSQL: ignore duplicate_object)
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "offline_votes" ADD CONSTRAINT "offline_votes_electionId_fkey"
        FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `).catch(() => {})
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "offline_votes" ADD CONSTRAINT "offline_votes_trusteeCandidateId_fkey"
        FOREIGN KEY ("trusteeCandidateId") REFERENCES "trustee_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `).catch(() => {})
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "offline_votes" ADD CONSTRAINT "offline_votes_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `).catch(() => {})
    console.log('Schema applied.\n')
  } catch (e: any) {
    console.error('Schema step failed:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  }

  // Step 3: Create 15 admin accounts
  console.log('Step 3: Creating 15 offline vote admin accounts...')

  const adminAccounts: Array<{ email: string; name: string; adminId: string; password: string }> = []

  for (let i = 1; i <= 15; i++) {
    const email = `offline-admin-${i}@kms-election.com`
    const name = `Offline Vote Admin ${i}`
    const adminId = `OFFLINE_ADMIN_${String(i).padStart(3, '0')}`
    const password = PASSWORDS[i - 1]
    const hashedPassword = await bcrypt.hash(password, 12)

    try {
      let user = await prisma.user.findFirst({ where: { email } })

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword, role: 'ADMIN', name }
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

      await prisma.admin.upsert({
        where: { userId: user.id },
        update: { isOfflineVoteAdmin: true },
        create: {
          userId: user.id,
          adminId,
          isOfflineVoteAdmin: true
        }
      })

      adminAccounts.push({ email, name, adminId, password })
      console.log(`  ✓ ${i}/15: ${email}`)
    } catch (err: any) {
      console.error(`  ✗ ${email}:`, err.message)
    }
  }

  await prisma.$disconnect()

  // Save credentials
  const outputPath = path.join(process.cwd(), 'offline-vote-admins-credentials.json')
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ loginUrl: '/admin/login', accounts: adminAccounts }, null, 2)
  )

  console.log('\n' + '='.repeat(60))
  console.log('SETUP COMPLETE')
  console.log('='.repeat(60))
  console.log('\nLogin at: <your-site>/admin/login')
  console.log('\nCredentials (use these exactly):')
  adminAccounts.forEach((a, i) => {
    console.log(`  ${i + 1}. Email: ${a.email}  Password: ${a.password}`)
  })
  console.log('\nCredentials also saved to: offline-vote-admins-credentials.json')
  console.log('\nYou can now enter offline votes from the admin dashboard.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
