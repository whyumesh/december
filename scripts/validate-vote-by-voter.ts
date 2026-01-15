/**
 * Validate if a vote was successfully recorded for a voter
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'

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

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

async function validateVote() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('VOTE VALIDATION')
    console.log('='.repeat(80))
    
    // Get voter identifier
    const voterIdOrPhone = await askQuestion('\nEnter your Voter ID or Phone Number: ')
    
    if (!voterIdOrPhone || voterIdOrPhone.trim() === '') {
      console.log('❌ Voter ID or Phone Number is required')
      return
    }
    
    const identifier = voterIdOrPhone.trim()
    
    // Find voter by Voter ID or Phone
    const voter = await prisma.voter.findFirst({
      where: {
        OR: [
          { voterId: identifier.toUpperCase() },
          { phone: identifier.replace(/\D/g, '') }
        ]
      },
      include: {
        yuvaPankZone: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })
    
    if (!voter) {
      console.log(`\n❌ Voter not found with identifier: ${identifier}`)
      return
    }
    
    console.log(`\n✅ Voter found:`)
    console.log(`   Name: ${voter.name}`)
    console.log(`   Voter ID: ${voter.voterId}`)
    console.log(`   Phone: ${voter.phone || 'N/A'}`)
    console.log(`   Zone: ${voter.yuvaPankZone?.name || 'N/A'} (${voter.yuvaPankZone?.code || 'N/A'})`)
    console.log(`   Has Voted Flag: ${voter.hasVoted ? '✅ YES' : '❌ NO'}`)
    
    // Check for Yuva Pankh votes
    const yuvaPankVotes = await prisma.vote.findMany({
      where: {
        voterId: voter.id,
        electionType: 'YUVA_PANK'
      },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            zone: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    
    console.log(`\n📊 YUVA PANKH VOTES:`)
    console.log('─'.repeat(80))
    
    if (yuvaPankVotes.length === 0) {
      console.log('   ❌ No votes found for Yuva Pankh election')
    } else {
      console.log(`   ✅ Found ${yuvaPankVotes.length} vote(s)`)
      console.log('')
      
      // Group votes by timestamp (same voting session)
      const votesByTimestamp = new Map<string, typeof yuvaPankVotes>()
      yuvaPankVotes.forEach(vote => {
        const timestamp = vote.timestamp.toISOString()
        if (!votesByTimestamp.has(timestamp)) {
          votesByTimestamp.set(timestamp, [])
        }
        votesByTimestamp.get(timestamp)!.push(vote)
      })
      
      votesByTimestamp.forEach((votes, timestamp) => {
        const voteDate = new Date(timestamp)
        console.log(`   📅 Vote Session: ${voteDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        console.log(`   📍 Zone: ${votes[0].candidate?.zone?.name || 'N/A'} (${votes[0].candidate?.zone?.code || 'N/A'})`)
        console.log(`   🗳️  Candidates Voted:`)
        
        votes.forEach((vote, index) => {
          const candidateName = vote.candidate?.user?.name || vote.candidate?.name || 'Unknown'
          const isNota = vote.candidate?.position === 'NOTA'
          console.log(`      ${index + 1}. ${candidateName}${isNota ? ' (NOTA)' : ''}`)
        })
        
        console.log('')
      })
    }
    
    // Check for other election votes
    const allVotes = await prisma.vote.findMany({
      where: {
        voterId: voter.id
      },
      select: {
        electionType: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    
    const votesByElection = new Map<string, number>()
    allVotes.forEach(vote => {
      votesByElection.set(vote.electionType, (votesByElection.get(vote.electionType) || 0) + 1)
    })
    
    console.log(`\n📊 ALL ELECTION VOTES SUMMARY:`)
    console.log('─'.repeat(80))
    votesByElection.forEach((count, electionType) => {
      console.log(`   ${electionType}: ${count} vote(s)`)
    })
    
    if (allVotes.length === 0) {
      console.log('   ❌ No votes found for any election')
    }
    
    // Final validation
    console.log(`\n` + '='.repeat(80))
    console.log('VALIDATION RESULT')
    console.log('='.repeat(80))
    
    if (yuvaPankVotes.length > 0) {
      console.log(`✅ SUCCESS: Your vote for Yuva Pankh election has been recorded!`)
      console.log(`   Total votes cast: ${yuvaPankVotes.length}`)
      console.log(`   Latest vote time: ${yuvaPankVotes[0].timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
    } else {
      console.log(`❌ NO VOTE FOUND: No vote recorded for Yuva Pankh election`)
    }
    
    if (voter.hasVoted && yuvaPankVotes.length > 0) {
      console.log(`✅ Voter flag matches: hasVoted = true`)
    } else if (!voter.hasVoted && yuvaPankVotes.length > 0) {
      console.log(`⚠️  WARNING: Votes exist but hasVoted flag is false`)
    } else if (voter.hasVoted && yuvaPankVotes.length === 0) {
      console.log(`⚠️  WARNING: hasVoted flag is true but no votes found`)
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

validateVote()

