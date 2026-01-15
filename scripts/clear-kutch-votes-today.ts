/**
 * Clear votes from Kutch zone Yuva Pankh cast today (15th Jan) until 11:59 PM
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

async function clearKutchVotesToday() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('CLEARING KUTCH ZONE YUVA PANKH VOTES - TODAY (15th Jan) UNTIL 11:59 PM')
    console.log('='.repeat(80))
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    // Set date range: 15th Jan 2026 from 00:00:00 IST to 23:59:59 IST
    // IST is UTC+5:30, so:
    // 15th Jan 2026 00:00:00 IST = 14th Jan 2026 18:30:00 UTC
    // 15th Jan 2026 23:59:59 IST = 15th Jan 2026 18:29:59 UTC
    const todayStart = new Date('2026-01-14T18:30:00.000Z') // 15th Jan 00:00 IST
    const todayEnd = new Date('2026-01-15T18:29:59.999Z')   // 15th Jan 23:59:59 IST
    
    console.log(`\n📅 Date Range:`)
    console.log(`   Start: ${todayStart.toISOString()}`)
    console.log(`   End: ${todayEnd.toISOString()}`)
    
    // Find votes to delete
    // Votes are for Yuva Pankh candidates in Kutch zone, cast by voters from Kutch zone
    const votesToDelete = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: kutchZone.id
        },
        voter: {
          yuvaPankZoneId: kutchZone.id
        },
        timestamp: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        voter: {
          select: {
            voterId: true,
            name: true
          }
        },
        yuvaPankhCandidate: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })
    
    console.log(`\n📊 Found ${votesToDelete.length} vote(s) to delete:`)
    console.log('─'.repeat(80))
    
    if (votesToDelete.length === 0) {
      console.log('✅ No votes found for today. Nothing to delete.')
      return
    }
    
    // Display votes to be deleted
    votesToDelete.forEach((vote, index) => {
      const voterName = vote.voter.name || vote.voter.voterId
      const candidateName = vote.yuvaPankhCandidate?.name || 'Unknown'
      const voteTime = new Date(vote.timestamp).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'short',
        timeStyle: 'medium'
      })
      console.log(`${index + 1}. Voter: ${voterName}`)
      console.log(`   Candidate: ${candidateName}`)
      console.log(`   Time: ${voteTime}`)
      console.log(`   Vote ID: ${vote.id}`)
      console.log('')
    })
    
    // Get unique voters who voted
    const uniqueVoters = new Set(votesToDelete.map(v => v.voterId))
    console.log(`\n📊 Summary:`)
    console.log(`   Total Votes: ${votesToDelete.length}`)
    console.log(`   Unique Voters: ${uniqueVoters.size}`)
    
    // Confirm deletion
    console.log(`\n⚠️  WARNING: This will delete ${votesToDelete.length} vote(s) from ${uniqueVoters.size} voter(s)`)
    console.log('   Proceeding with deletion...\n')
    
    // Delete votes
    const voteIds = votesToDelete.map(v => v.id)
    const deleteResult = await prisma.vote.deleteMany({
      where: {
        id: {
          in: voteIds
        }
      }
    })
    
    console.log(`✅ Deleted ${deleteResult.count} vote(s)`)
    
    // Update hasVoted flag for affected voters
    // Check if voters have any other votes
    for (const voterId of uniqueVoters) {
      const remainingVotes = await prisma.vote.count({
        where: {
          voterId: voterId
        }
      })
      
      await prisma.voter.update({
        where: { id: voterId },
        data: { hasVoted: remainingVotes > 0 }
      })
    }
    
    console.log(`✅ Updated hasVoted flag for ${uniqueVoters.size} voter(s)`)
    
    // Verify deletion
    const remainingVotes = await prisma.vote.count({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: kutchZone.id
        },
        voter: {
          yuvaPankZoneId: kutchZone.id
        },
        timestamp: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })
    
    console.log(`\n📊 Verification:`)
    console.log(`   Remaining votes for today: ${remainingVotes}`)
    
    if (remainingVotes === 0) {
      console.log(`\n✅ SUCCESS: All votes from today have been cleared`)
    } else {
      console.log(`\n⚠️  WARNING: ${remainingVotes} vote(s) still remain`)
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearKutchVotesToday()

