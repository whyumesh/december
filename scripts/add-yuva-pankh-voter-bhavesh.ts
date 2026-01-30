/**
 * Add Bhavesh Harilal Mandan (9601010208, DOB 23/4/1992) as YUVA PANKH Kutch zone voter.
 * If the voter already exists (e.g. voted in trustee), only assigns YUVA PANKH Kutch zone
 * without changing trustee zone or any existing votes.
 * Run with: npx tsx scripts/add-yuva-pankh-voter-bhavesh.ts
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
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile('.env.local')

const NAME = 'Bhavesh Harilal Mandan'
const PHONE = '9601010208'
const DOB = '23/4/1992'

function calculateAge(dob: string): number {
  const [day, month, year] = dob.split('/').map(Number)
  const birthDate = new Date(year, month - 1, day)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

async function main() {
  console.log('\n📋 Adding Bhavesh Harilal Mandan for YUVA PANKH (Kutch zone)\n')

  const kutchZone = await prisma.zone.findFirst({
    where: { code: 'KUTCH', electionType: 'YUVA_PANK' },
  })

  if (!kutchZone) {
    throw new Error('KUTCH zone for YUVA_PANK not found in database')
  }

  console.log(`   Kutch YUVA_PANK zone: ${kutchZone.name} (${kutchZone.id})\n`)

  // Look up by phone (exact and variants)
  const existingVoter = await prisma.voter.findFirst({
    where: {
      OR: [
        { phone: PHONE },
        { phone: PHONE.replace(/\D/g, '') },
        { phone: { contains: PHONE.slice(-10) } },
      ],
    },
    include: {
      votes: { select: { id: true, electionId: true } },
      trusteeZone: true,
      yuvaPankZone: true,
    },
  })

  if (existingVoter) {
    console.log('   Voter already exists (e.g. voted in trustee). Assigning YUVA PANKH Kutch zone only.\n')
    console.log(`   Current: Voter ID ${existingVoter.voterId}, Name: ${existingVoter.name}`)
    console.log(`   Trustee zone: ${existingVoter.trusteeZone?.name ?? 'none'}`)
    console.log(`   Yuva Pank zone before: ${existingVoter.yuvaPankZone?.name ?? 'none'}`)
    console.log(`   Existing votes: ${existingVoter.votes.length}\n`)

    const updated = await prisma.voter.update({
      where: { id: existingVoter.id },
      data: {
        yuvaPankZoneId: kutchZone.id,
        // Optionally sync name/dob if they were different
        name: NAME,
        dob: DOB,
        age: calculateAge(DOB),
      },
    })

    console.log('   ✅ Updated: yuvaPankZoneId set to Kutch. Trustee zone and votes unchanged.\n')
    console.log(`   Voter ID: ${updated.voterId}`)
    console.log(`   Name: ${updated.name}`)
    console.log(`   Phone: ${updated.phone}`)
    console.log(`   DOB: ${updated.dob}`)
    console.log(`   Yuva Pank Zone: KUTCH`)
    console.log(`   Trustee Zone: ${existingVoter.trusteeZoneId ? 'unchanged' : 'none'}`)
    await prisma.$disconnect()
    return
  }

  // Create new User + Voter (only YUVA PANKH Kutch; no trustee/karobari zone so no impact on trustee votes)
  const age = calculateAge(DOB)
  const email = `${PHONE}@voter.kms-election.com`
  const voterId = `V${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 2).toUpperCase()}`

  const [day, month, year] = DOB.split('/').map(Number)
  const dateOfBirth = new Date(year, month - 1, day)

  const user = await prisma.user.create({
    data: {
      name: NAME,
      phone: PHONE,
      email,
      dateOfBirth,
      age,
      role: 'VOTER',
    },
  })

  const voter = await prisma.voter.create({
    data: {
      userId: user.id,
      voterId,
      name: NAME,
      phone: PHONE,
      email,
      dob: DOB,
      age,
      region: 'Kutch',
      yuvaPankZoneId: kutchZone.id,
      karobariZoneId: null,
      trusteeZoneId: null,
      zoneId: kutchZone.id,
      hasVoted: false,
      isActive: true,
    },
  })

  console.log('   ✅ New voter created for YUVA PANKH (Kutch) only. No trustee zone assigned.\n')
  console.log(`   Voter ID: ${voter.voterId}`)
  console.log(`   Name: ${voter.name}`)
  console.log(`   Phone: ${voter.phone}`)
  console.log(`   DOB: ${voter.dob}`)
  console.log(`   Age: ${voter.age}`)
  console.log(`   Yuva Pank Zone: KUTCH`)
  console.log(`   User ID: ${user.id}`)

  await prisma.$disconnect()
}

main()
  .then(() => {
    console.log('\n✅ Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
