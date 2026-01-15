/**
 * Check Kutch zone Yuva Pankh votes and their timestamps
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

async function checkKutchVotesTimestamps() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('CHECKING KUTCH ZONE YUVA PANKH VOTES - TIMESTAMPS')
    console.log('='.repeat(80))
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    // Get all votes for Kutch zone
    const allVotes = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: kutchZone.id
        },
        voter: {
          yuvaPankZoneId: kutchZone.id
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
        timestamp: 'desc'
      }
    })
    
    console.log(`\n📊 Total Kutch Zone Votes: ${allVotes.length}\n`)
    
    if (allVotes.length === 0) {
      console.log('✅ No votes found in Kutch zone')
      return
    }
    
    // Check today's date
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    
    console.log(`📅 Today's Date Range (Local Time):`)
    console.log(`   Start: ${todayStart.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
    console.log(`   End: ${todayEnd.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
    console.log(`   UTC Start: ${todayStart.toISOString()}`)
    console.log(`   UTC End: ${todayEnd.toISOString()}`)
    console.log('')
    
    // Display all votes with timestamps
    console.log('📊 All Votes (most recent first):')
    console.log('─'.repeat(80))
    
    let todayVotesCount = 0
    
    allVotes.forEach((vote, index) => {
      const voteDate = new Date(vote.timestamp)
      const isToday = voteDate >= todayStart && voteDate <= todayEnd
      
      if (isToday) {
        todayVotesCount++
      }
      
      const voterName = vote.voter.name || vote.voter.voterId
      const candidateName = vote.yuvaPankhCandidate?.name || 'Unknown'
      const voteTimeLocal = voteDate.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'short',
        timeStyle: 'medium'
      })
      const voteTimeUTC = voteDate.toISOString()
      
      console.log(`${index + 1}. ${isToday ? '🆕 TODAY' : '     '} Voter: ${voterName}`)
      console.log(`   Candidate: ${candidateName}`)
      console.log(`   Local Time: ${voteTimeLocal} (IST)`)
      console.log(`   UTC Time: ${voteTimeUTC}`)
      console.log(`   Vote ID: ${vote.id}`)
      console.log('')
    })
    
    console.log('─'.repeat(80))
    console.log(`\n📊 Summary:`)
    console.log(`   Total Votes: ${allVotes.length}`)
    console.log(`   Votes Today: ${todayVotesCount}`)
    console.log(`   Votes Before Today: ${allVotes.length - todayVotesCount}`)
    
    // Check votes in the date range for 15th Jan 2025
    const jan15Start = new Date('2025-01-15T00:00:00.000Z')
    const jan15End = new Date('2025-01-15T23:59:59.999Z')
    
    const jan15Votes = allVotes.filter(v => {
      const voteDate = new Date(v.timestamp)
      return voteDate >= jan15Start && voteDate <= jan15End
    })
    
    console.log(`\n📅 Votes on 15th Jan 2025 (00:00 - 23:59 UTC): ${jan15Votes.length}`)
    
    if (jan15Votes.length > 0) {
      console.log('\n🆕 Votes on 15th Jan 2025:')
      jan15Votes.forEach((vote, index) => {
        const voteDate = new Date(vote.timestamp)
        const voterName = vote.voter.name || vote.voter.voterId
        const candidateName = vote.yuvaPankhCandidate?.name || 'Unknown'
        const voteTimeLocal = voteDate.toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          dateStyle: 'short',
          timeStyle: 'medium'
        })
        console.log(`   ${index + 1}. ${voterName} -> ${candidateName} at ${voteTimeLocal}`)
      })
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkKutchVotesTimestamps()

