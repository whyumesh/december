/**
 * Check total eligible voters (who will vote) in Kutch and Anya Gujarat zones
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

async function checkEligibleVoters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ELIGIBLE VOTERS COUNT FOR KUTCH AND ANYA GUJARAT ZONES')
    console.log('='.repeat(80))
    
    // Get zones
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    if (!anyaGujaratZone) {
      console.log('❌ Anya Gujarat zone not found')
      return
    }
    
    console.log(`\nKutch Zone ID: ${kutchZone.id}`)
    console.log(`Anya Gujarat Zone ID: ${anyaGujaratZone.id}\n`)
    
    // Count all eligible voters (excluding test voters)
    // Eligible voters = voters assigned to these zones who can vote
    const kutchEligibleVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: true // Only active voters
      }
    })
    
    const anyaGujaratEligibleVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: anyaGujaratZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: true // Only active voters
      }
    })
    
    // Also check inactive voters
    const kutchInactiveVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: false
      }
    })
    
    const anyaGujaratInactiveVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: anyaGujaratZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: false
      }
    })
    
    // Get detailed voter list
    const kutchVotersList = await prisma.voter.findMany({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      },
      select: {
        voterId: true,
        name: true,
        phone: true,
        isActive: true,
        hasVoted: true
      },
      orderBy: { voterId: 'asc' }
    })
    
    const anyaGujaratVotersList = await prisma.voter.findMany({
      where: {
        yuvaPankZoneId: anyaGujaratZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      },
      select: {
        voterId: true,
        name: true,
        phone: true,
        isActive: true,
        hasVoted: true
      },
      orderBy: { voterId: 'asc' }
    })
    
    const totalEligibleVoters = kutchEligibleVoters + anyaGujaratEligibleVoters
    const totalInactiveVoters = kutchInactiveVoters + anyaGujaratInactiveVoters
    const totalAllVoters = totalEligibleVoters + totalInactiveVoters
    
    console.log(`\n📊 KUTCH ZONE:`)
    console.log(`   Zone Name: ${kutchZone.name}`)
    console.log(`   Zone Code: ${kutchZone.code}`)
    console.log(`   Active Eligible Voters: ${kutchEligibleVoters}`)
    console.log(`   Inactive Voters: ${kutchInactiveVoters}`)
    console.log(`   Total Voters (Active + Inactive): ${kutchEligibleVoters + kutchInactiveVoters}`)
    
    if (kutchVotersList.length > 0) {
      console.log(`\n   Voter Details:`)
      kutchVotersList.forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name} (${voter.voterId}) - ${voter.isActive ? 'Active' : 'Inactive'} - ${voter.hasVoted ? 'Voted' : 'Not Voted'}`)
      })
    }
    
    console.log(`\n📊 ANYA GUJARAT ZONE:`)
    console.log(`   Zone Name: ${anyaGujaratZone.name}`)
    console.log(`   Zone Code: ${anyaGujaratZone.code}`)
    console.log(`   Active Eligible Voters: ${anyaGujaratEligibleVoters}`)
    console.log(`   Inactive Voters: ${anyaGujaratInactiveVoters}`)
    console.log(`   Total Voters (Active + Inactive): ${anyaGujaratEligibleVoters + anyaGujaratInactiveVoters}`)
    
    if (anyaGujaratVotersList.length > 0) {
      console.log(`\n   Voter Details:`)
      anyaGujaratVotersList.forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name} (${voter.voterId}) - ${voter.isActive ? 'Active' : 'Inactive'} - ${voter.hasVoted ? 'Voted' : 'Not Voted'}`)
      })
    }
    
    console.log(`\n` + '='.repeat(80))
    console.log(`📊 TOTAL ELIGIBLE VOTERS (KUTCH + ANYA GUJARAT):`)
    console.log(`   Active Eligible Voters: ${totalEligibleVoters}`)
    console.log(`   Inactive Voters: ${totalInactiveVoters}`)
    console.log(`   Total All Voters: ${totalAllVoters}`)
    console.log(`\n   ✅ Total people who will vote or going to vote: ${totalEligibleVoters}`)
    console.log('='.repeat(80))
    
    // Check if there are voters without zone assignment that might belong to these zones
    console.log(`\n\n📋 CHECKING FOR VOTERS WITHOUT YUVA PANKH ZONE ASSIGNMENT...`)
    const votersWithoutZone = await prisma.voter.count({
      where: {
        yuvaPankZoneId: null,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: true
      }
    })
    
    console.log(`   Voters without Yuva Pankh zone assignment: ${votersWithoutZone}`)
    if (votersWithoutZone > 0) {
      console.log(`   ⚠️  Note: There are ${votersWithoutZone} active voters without Yuva Pankh zone assignment.`)
      console.log(`      These voters may need to be assigned to Kutch or Anya Gujarat zones.`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkEligibleVoters()

