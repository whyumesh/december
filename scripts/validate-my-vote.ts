/**
 * Quick script to validate a specific vote
 * Usage: npx tsx scripts/validate-my-vote.ts <voterId-or-phone>
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

async function validateMyVote() {
  try {
    const identifier = process.argv[2]
    
    if (!identifier) {
      console.log('\n❌ Please provide your Voter ID or Phone Number')
      console.log('Usage: npx tsx scripts/validate-my-vote.ts <voterId-or-phone>')
      console.log('Example: npx tsx scripts/validate-my-vote.ts VID-1544')
      console.log('Example: npx tsx scripts/validate-my-vote.ts 9172133303')
      process.exit(1)
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('VOTE VALIDATION')
    console.log('='.repeat(80))
    console.log(`\n🔍 Searching for: ${identifier}`)
    
    // Find voter
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
    
    console.log(`\n✅ Voter Found:`)
    console.log(`   Name: ${voter.name}`)
    console.log(`   Voter ID: ${voter.voterId}`)
    console.log(`   Phone: ${voter.phone || 'N/A'}`)
    console.log(`   Zone: ${voter.yuvaPankZone?.name || 'N/A'} (${voter.yuvaPankZone?.code || 'N/A'})`)
    console.log(`   Has Voted Flag: ${voter.hasVoted ? '✅ YES' : '❌ NO'}`)
    
    // Get Yuva Pankh votes
    const votes = await prisma.vote.findMany({
      where: {
        voterId: voter.id,
        yuvaPankhCandidateId: {
          not: null
        }
      },
      include: {
        yuvaPankhCandidate: {
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
    
    if (votes.length === 0) {
      console.log('   ❌ NO VOTE FOUND')
      console.log('   Your vote has not been recorded for Yuva Pankh election.')
    } else {
      // Group by timestamp (same voting session)
      const votesByTime = new Map<string, typeof votes>()
      votes.forEach(vote => {
        const timeKey = vote.timestamp.toISOString()
        if (!votesByTime.has(timeKey)) {
          votesByTime.set(timeKey, [])
        }
        votesByTime.get(timeKey)!.push(vote)
      })
      
      votesByTime.forEach((sessionVotes, timeKey) => {
        const voteDate = new Date(timeKey)
        console.log(`\n   ✅ VOTE RECORDED!`)
        console.log(`   📅 Vote Time: ${voteDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        console.log(`   🗳️  Candidates Voted (${sessionVotes.length}):`)
        
        sessionVotes.forEach((vote, idx) => {
          const candidateName = vote.yuvaPankhCandidate?.user?.name || vote.yuvaPankhCandidate?.name || 'Unknown'
          const zone = vote.yuvaPankhCandidate?.zone?.code || 'N/A'
          console.log(`      ${idx + 1}. ${candidateName} (${zone})`)
        })
      })
    }
    
    // Final status
    console.log(`\n` + '='.repeat(80))
    if (votes.length > 0) {
      console.log('✅ VALIDATION RESULT: VOTE SUCCESSFULLY RECORDED!')
      console.log(`   Total votes: ${votes.length}`)
      console.log(`   Latest vote: ${votes[0].timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
    } else {
      console.log('❌ VALIDATION RESULT: NO VOTE FOUND')
      console.log('   Your vote has not been recorded.')
    }
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

validateMyVote()

