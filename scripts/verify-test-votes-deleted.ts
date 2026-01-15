/**
 * Verify test votes have been deleted
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Load environment variables
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
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

async function verifyTestVotesDeleted() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('VERIFYING TEST VOTES DELETION')
    console.log('='.repeat(80))
    
    // Find test voter
    const testVoter = await prisma.voter.findFirst({
      where: {
        OR: [
          { phone: '7400324576' },
          { voterId: 'TEST_VOTER_001' }
        ]
      },
      include: {
        votes: true
      }
    })
    
    if (!testVoter) {
      console.log('❌ Test voter not found')
      return
    }
    
    console.log(`\n📊 Test Voter Status:`)
    console.log(`   Voter ID: ${testVoter.voterId}`)
    console.log(`   Phone: ${testVoter.phone}`)
    console.log(`   hasVoted: ${testVoter.hasVoted}`)
    console.log(`   Remaining Votes: ${testVoter.votes.length}`)
    
    // Check Kutch zone votes (excluding test voters)
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (kutchZone) {
      const kutchVotes = await prisma.vote.count({
        where: {
          yuvaPankhCandidateId: {
            not: null
          },
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
        }
      })
      
      console.log(`\n📊 Kutch Zone Votes (excluding test):`)
      console.log(`   Total Votes: ${kutchVotes}`)
    }
    
    // Total votes excluding test voters
    const totalVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }
    })
    
    console.log(`\n📊 Overall Statistics:`)
    console.log(`   Total Votes (excluding test): ${totalVotes}`)
    
    if (testVoter.votes.length === 0 && !testVoter.hasVoted) {
      console.log(`\n✅ SUCCESS: Test votes have been deleted`)
      console.log(`✅ Test voter's hasVoted status has been reset`)
    } else {
      console.log(`\n⚠️  WARNING: Test votes may still exist`)
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyTestVotesDeleted()

