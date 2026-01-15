/**
 * Test voting functionality and verify metrics are correct
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

async function testVotingAndMetrics() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('TESTING VOTING FUNCTIONALITY AND METRICS')
    console.log('='.repeat(80))
    
    // 1. Check all approved candidates
    console.log('\n📋 STEP 1: Checking approved candidates...\n')
    
    const yuvaPankhCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { status: 'APPROVED' },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            code: true,
            seats: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { zone: { code: 'asc' } },
        { name: 'asc' }
      ]
    })
    
    console.log(`Found ${yuvaPankhCandidates.length} approved Yuva Pankh candidates\n`)
    
    // Group by zone
    const candidatesByZone = new Map<string, typeof yuvaPankhCandidates>()
    yuvaPankhCandidates.forEach(candidate => {
      const zoneCode = candidate.zone?.code || 'UNKNOWN'
      if (!candidatesByZone.has(zoneCode)) {
        candidatesByZone.set(zoneCode, [])
      }
      candidatesByZone.get(zoneCode)!.push(candidate)
    })
    
    // 2. Check vote counts for each candidate
    console.log('📊 STEP 2: Checking vote counts per candidate...\n')
    
    const voteCounts = await prisma.vote.groupBy({
      by: ['yuvaPankhCandidateId'],
      where: {
        yuvaPankhCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      _count: {
        id: true
      }
    })
    
    const voteCountMap = new Map<string, number>()
    voteCounts.forEach(vc => {
      if (vc.yuvaPankhCandidateId) {
        voteCountMap.set(vc.yuvaPankhCandidateId, vc._count.id)
      }
    })
    
    // Display candidates with vote counts
    for (const [zoneCode, candidates] of candidatesByZone.entries()) {
      const zone = candidates[0].zone
      console.log(`\n${'─'.repeat(60)}`)
      console.log(`Zone: ${zone?.name || zoneCode} (${zoneCode})`)
      console.log(`Seats: ${zone?.seats || 0}`)
      console.log(`${'─'.repeat(60)}`)
      
      candidates.forEach((candidate, index) => {
        const candidateName = candidate.user?.name || candidate.name
        const voteCount = voteCountMap.get(candidate.id) || 0
        const rank = index + 1
        
        console.log(`  ${rank}. ${candidateName}`)
        console.log(`     Votes: ${voteCount}`)
        console.log(`     ID: ${candidate.id}`)
      })
    }
    
    // 3. Check total votes
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('VOTE STATISTICS')
    console.log('='.repeat(80))
    
    const totalVotes = await prisma.vote.count({
      where: {
        yuvaPankhCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }
    })
    
    const totalVoters = await prisma.voter.count({
      where: {
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    const votersWithYuvaPankZone = await prisma.voter.count({
      where: {
        yuvaPankZoneId: { not: null },
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    const votersVotedYuvaPankh = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidateId: { not: null },
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
    
    const uniqueVotersVoted = new Set(votersVotedYuvaPankh.map(v => v.voterId)).size
    
    console.log(`\nTotal Voters: ${totalVoters}`)
    console.log(`Voters with Yuva Pankh Zone: ${votersWithYuvaPankZone}`)
    console.log(`Total Votes Cast: ${totalVotes}`)
    console.log(`Unique Voters Voted: ${uniqueVotersVoted}`)
    console.log(`Turnout: ${votersWithYuvaPankZone > 0 ? ((uniqueVotersVoted / votersWithYuvaPankZone) * 100).toFixed(2) : 0}%`)
    
    // 4. Check votes by zone
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('VOTES BY ZONE')
    console.log('='.repeat(80))
    
    for (const [zoneCode, candidates] of candidatesByZone.entries()) {
      const zone = candidates[0].zone
      if (!zone) continue
      
      const zoneVoteCount = candidates.reduce((sum, c) => {
        return sum + (voteCountMap.get(c.id) || 0)
      }, 0)
      
      const zoneVoters = await prisma.voter.count({
        where: {
          yuvaPankZoneId: zone.id,
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      })
      
      const zoneVotersVoted = await prisma.vote.findMany({
        where: {
          yuvaPankhCandidate: {
            zoneId: zone.id
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
      
      const uniqueZoneVotersVoted = new Set(zoneVotersVoted.map(v => v.voterId)).size
      
      console.log(`\n${zone.name} (${zoneCode}):`)
      console.log(`  Total Voters: ${zoneVoters}`)
      console.log(`  Voters Voted: ${uniqueZoneVotersVoted}`)
      console.log(`  Total Votes: ${zoneVoteCount}`)
      console.log(`  Turnout: ${zoneVoters > 0 ? ((uniqueZoneVotersVoted / zoneVoters) * 100).toFixed(2) : 0}%`)
      console.log(`  Seats: ${zone.seats}`)
    }
    
    // 5. Verify data integrity
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('DATA INTEGRITY CHECK')
    console.log('='.repeat(80))
    
    // Check for candidates with votes but no zone
    const candidatesWithoutZone = yuvaPankhCandidates.filter(c => !c.zoneId)
    if (candidatesWithoutZone.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${candidatesWithoutZone.length} candidate(s) without zone assignment:`)
      candidatesWithoutZone.forEach(c => {
        console.log(`   - ${c.user?.name || c.name} (ID: ${c.id})`)
      })
    } else {
      console.log(`\n✅ All candidates have zone assignments`)
    }
    
    // Check for votes without candidates
    const votesWithoutCandidate = await prisma.vote.count({
      where: {
        yuvaPankhCandidateId: { not: null },
        yuvaPankhCandidate: null
      }
    })
    
    if (votesWithoutCandidate > 0) {
      console.log(`\n⚠️  WARNING: Found ${votesWithoutCandidate} vote(s) without valid candidate`)
    } else {
      console.log(`\n✅ All votes have valid candidates`)
    }
    
    // Check for votes from test voters
    const testVoterVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    console.log(`\n📝 Test voter votes: ${testVoterVotes} (should be excluded from metrics)`)
    
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('✅ TEST COMPLETE')
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testVotingAndMetrics()

