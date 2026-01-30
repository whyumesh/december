/**
 * Validate that a voter is successfully added to Yuva Pankh Kutch zone.
 * Usage: npx tsx scripts/validate-yuva-pankh-kutch-voter.ts [phone]
 * Default phone: 9601010208 (Bhavesh Harilal Mandan)
 */

import { prisma } from '../src/lib/db'
import * as fs from 'fs'

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) process.env[key.trim()] = value
      }
    })
  }
}

loadEnvFile('.env.local')

const PHONE = process.argv[2] || '9601010208'

async function main() {
  console.log('\n🔍 Validating Yuva Pankh Kutch zone assignment\n')
  console.log(`   Phone: ${PHONE}\n`)

  const kutchZone = await prisma.zone.findFirst({
    where: { code: 'KUTCH', electionType: 'YUVA_PANK' },
  })

  if (!kutchZone) {
    console.log('   ❌ FAIL: KUTCH YUVA_PANK zone not found in database.\n')
    process.exit(1)
  }

  const voter = await prisma.voter.findFirst({
    where: {
      OR: [
        { phone: PHONE },
        { phone: PHONE.replace(/\D/g, '') },
        { phone: { contains: PHONE.slice(-10) } },
      ],
    },
    include: {
      yuvaPankZone: true,
    },
  })

  if (!voter) {
    console.log('   ❌ FAIL: No voter found with this phone number.\n')
    process.exit(1)
  }

  const isKutchYuvaPank = voter.yuvaPankZoneId === kutchZone.id

  if (!isKutchYuvaPank) {
    console.log('   ❌ FAIL: Voter exists but is NOT in Yuva Pankh Kutch zone.\n')
    console.log(`   Voter ID: ${voter.voterId}`)
    console.log(`   Name: ${voter.name}`)
    console.log(`   Yuva Pank Zone: ${voter.yuvaPankZone?.name ?? 'Not assigned'}\n`)
    process.exit(1)
  }

  console.log('   ✅ PASS: Voter is in Yuva Pankh Kutch zone.\n')
  console.log(`   Voter ID: ${voter.voterId}`)
  console.log(`   Name: ${voter.name}`)
  console.log(`   Phone: ${voter.phone}`)
  console.log(`   DOB: ${voter.dob ?? 'N/A'}`)
  console.log(`   Yuva Pank Zone: ${voter.yuvaPankZone?.name} (${voter.yuvaPankZone?.code})`)
  console.log(`   Is Active: ${voter.isActive ? 'Yes' : 'No'}\n`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
