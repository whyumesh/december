/**
 * Change test voter's zone to Kutch
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        const cleanValue = value.replace(/^["']|["']$/g, '')
        if (key && cleanValue) {
          process.env[key.trim()] = cleanValue
        }
      }
    }
  }
}

loadEnvFile()

const prisma = new PrismaClient()

async function changeTestVoterZone() {
  try {
    console.log('🔧 Changing test voter zone to Kutch...\n')
    
    // Find test voter
    const testVoter = await prisma.voter.findFirst({
      where: {
        OR: [
          { phone: '7400324576' },
          { voterId: 'TEST_VOTER_001' }
        ]
      },
      include: {
        yuvaPankZone: true
      }
    })
    
    if (!testVoter) {
      console.log('❌ Test voter not found')
      return
    }
    
    console.log(`Found test voter:`)
    console.log(`   Voter ID: ${testVoter.voterId}`)
    console.log(`   Name: ${testVoter.name}`)
    console.log(`   Phone: ${testVoter.phone}`)
    console.log(`   Current Zone: ${testVoter.yuvaPankZone?.name || 'None'} (${testVoter.yuvaPankZone?.code || 'N/A'})`)
    
    // Find Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: {
        code: 'KUTCH',
        electionType: 'YUVA_PANK'
      }
    })
    
    if (!kutchZone) {
      console.log('\n❌ Kutch zone not found')
      return
    }
    
    console.log(`\nKutch zone found:`)
    console.log(`   Zone ID: ${kutchZone.id}`)
    console.log(`   Name: ${kutchZone.name}`)
    console.log(`   Code: ${kutchZone.code}`)
    console.log(`   Seats: ${kutchZone.seats}`)
    
    // Update test voter's zone
    const updated = await prisma.voter.update({
      where: { id: testVoter.id },
      data: {
        yuvaPankZoneId: kutchZone.id,
        region: 'Kutch' // Update region as well
      },
      include: {
        yuvaPankZone: true
      }
    })
    
    console.log(`\n✅ Test voter zone updated successfully!`)
    console.log(`\nUpdated voter:`)
    console.log(`   Voter ID: ${updated.voterId}`)
    console.log(`   Name: ${updated.name}`)
    console.log(`   Phone: ${updated.phone}`)
    console.log(`   New Zone: ${updated.yuvaPankZone?.name} (${updated.yuvaPankZone?.code})`)
    console.log(`   Region: ${updated.region}`)
    
    // Verify candidates available in Kutch
    const kutchCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: kutchZone.id,
        status: 'APPROVED',
        position: { not: 'NOTA' }
      }
    })
    
    console.log(`\n📋 Available candidates in Kutch zone:`)
    console.log(`   Total: ${kutchCandidates.length}`)
    kutchCandidates.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.position})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

changeTestVoterZone()

