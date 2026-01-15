/**
 * Check total voters in Kutch and Anya Gujarat zones
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

async function checkVoters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('VOTER COUNT FOR KUTCH AND ANYA GUJARAT ZONES')
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
    
    // Count voters (excluding test voters)
    const kutchVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    const anyaGujaratVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: anyaGujaratZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    const totalVoters = kutchVoters + anyaGujaratVoters
    
    // Get voters who have voted
    const kutchVotersVoted = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidate: {
          zoneId: kutchZone.id
        },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      select: { voterId: true },
      distinct: ['voterId']
    })
    
    const anyaGujaratVotersVoted = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidate: {
          zoneId: anyaGujaratZone.id
        },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      select: { voterId: true },
      distinct: ['voterId']
    })
    
    const kutchVotersVotedCount = new Set(kutchVotersVoted.map(v => v.voterId)).size
    const anyaGujaratVotersVotedCount = new Set(anyaGujaratVotersVoted.map(v => v.voterId)).size
    const totalVotersVoted = kutchVotersVotedCount + anyaGujaratVotersVotedCount
    
    console.log(`\n📊 KUTCH ZONE:`)
    console.log(`   Zone Name: ${kutchZone.name}`)
    console.log(`   Zone Code: ${kutchZone.code}`)
    console.log(`   Total Voters: ${kutchVoters}`)
    console.log(`   Voters Voted: ${kutchVotersVotedCount}`)
    console.log(`   Turnout: ${kutchVoters > 0 ? ((kutchVotersVotedCount / kutchVoters) * 100).toFixed(2) : 0}%`)
    
    console.log(`\n📊 ANYA GUJARAT ZONE:`)
    console.log(`   Zone Name: ${anyaGujaratZone.name}`)
    console.log(`   Zone Code: ${anyaGujaratZone.code}`)
    console.log(`   Total Voters: ${anyaGujaratVoters}`)
    console.log(`   Voters Voted: ${anyaGujaratVotersVotedCount}`)
    console.log(`   Turnout: ${anyaGujaratVoters > 0 ? ((anyaGujaratVotersVotedCount / anyaGujaratVoters) * 100).toFixed(2) : 0}%`)
    
    console.log(`\n` + '='.repeat(80))
    console.log(`📊 TOTAL (KUTCH + ANYA GUJARAT):`)
    console.log(`   Total Voters: ${totalVoters}`)
    console.log(`   Total Voters Voted: ${totalVotersVoted}`)
    console.log(`   Overall Turnout: ${totalVoters > 0 ? ((totalVotersVoted / totalVoters) * 100).toFixed(2) : 0}%`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkVoters()

