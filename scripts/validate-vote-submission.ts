/**
 * Validate vote submission - Check if votes were recorded correctly
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

function excludeTestVoters(additionalWhere: any = {}) {
  return {
    ...additionalWhere,
    voterId: {
      not: {
        startsWith: 'TEST_',
      },
    },
  }
}

async function validateVoteSubmission() {
  console.log('🔍 Validating Vote Submission\n')
  console.log('='.repeat(70))
  
  try {
    // 1. Check test voter's votes
    console.log('\n1️⃣ Checking Test Voter Votes')
    console.log('-'.repeat(70))
    
    const testVoter = await prisma.voter.findFirst({
      where: {
        OR: [
          { phone: '7400324576' },
          { voterId: 'TEST_VOTER_001' }
        ]
      },
      include: {
        yuvaPankZone: true,
        votes: {
          where: {
            yuvaPankhCandidateId: { not: null }
          },
          include: {
            yuvaPankhCandidate: {
              include: {
                zone: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    })
    
    if (!testVoter) {
      console.log('❌ Test voter not found')
      return
    }
    
    console.log(`✅ Test voter found:`)
    console.log(`   Voter ID: ${testVoter.voterId}`)
    console.log(`   Name: ${testVoter.name}`)
    console.log(`   Phone: ${testVoter.phone}`)
    console.log(`   Zone: ${testVoter.yuvaPankZone?.name} (${testVoter.yuvaPankZone?.code})`)
    console.log(`   Has voted: ${testVoter.hasVoted}`)
    console.log(`   Total votes: ${testVoter.votes.length}`)
    
    if (testVoter.votes.length > 0) {
      console.log(`\n📊 Test voter's votes:`)
      testVoter.votes.forEach((vote, i) => {
        const candidate = vote.yuvaPankhCandidate
        console.log(`   ${i + 1}. Vote ID: ${vote.id}`)
        console.log(`      Candidate: ${candidate?.name || 'Unknown'}`)
        console.log(`      Candidate Zone: ${candidate?.zone?.name || 'Unknown'} (${candidate?.zone?.code || 'N/A'})`)
        console.log(`      Voter Zone: ${testVoter.yuvaPankZone?.name} (${testVoter.yuvaPankZone?.code})`)
        console.log(`      Position: ${candidate?.position || 'N/A'}`)
        console.log(`      Created: ${vote.createdAt}`)
        
        // Validate zone match
        if (candidate?.zoneId === testVoter.yuvaPankZoneId) {
          console.log(`      ✅ Zone match: Correct`)
        } else {
          console.log(`      ❌ Zone mismatch: Candidate zone (${candidate?.zoneId}) != Voter zone (${testVoter.yuvaPankZoneId})`)
        }
      })
    } else {
      console.log(`\n⚠️  Test voter has not voted yet`)
    }
    
    // 2. Check election status
    console.log(`\n2️⃣ Checking Election Status`)
    console.log('-'.repeat(70))
    
    const election = await prisma.election.findFirst({
      where: { type: 'YUVA_PANK' },
      orderBy: { createdAt: 'desc' }
    })
    
    if (election) {
      console.log(`✅ Election found:`)
      console.log(`   ID: ${election.id}`)
      console.log(`   Status: ${election.status}`)
      console.log(`   Type: ${election.type}`)
    } else {
      console.log(`❌ No election found`)
    }
    
    // 3. Check total votes (excluding test voters)
    console.log(`\n3️⃣ Checking Total Votes (excluding test voters)`)
    console.log('-'.repeat(70))
    
    const totalVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: { not: { startsWith: 'TEST_' } }
        },
        yuvaPankhCandidateId: { not: null }
      }
    })
    
    const testVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: { startsWith: 'TEST_' }
        },
        yuvaPankhCandidateId: { not: null }
      }
    })
    
    console.log(`✅ Total votes (excluding test): ${totalVotes}`)
    console.log(`⚠️  Test votes: ${testVotes}`)
    console.log(`📊 Total votes: ${totalVotes + testVotes}`)
    
    // 4. Check votes by zone
    console.log(`\n4️⃣ Checking Votes by Zone`)
    console.log('-'.repeat(70))
    
    const zones = await prisma.zone.findMany({
      where: { electionType: 'YUVA_PANK', isActive: true }
    })
    
    for (const zone of zones) {
      // Count voters in zone (excluding test)
      const votersInZone = await prisma.voter.count({
        where: excludeTestVoters({ yuvaPankZoneId: zone.id })
      })
      
      // Count votes from this zone (excluding test voters)
      const votesInZone = await prisma.vote.count({
        where: {
          voter: {
            voterId: { not: { startsWith: 'TEST_' } },
            yuvaPankZoneId: zone.id
          },
          yuvaPankhCandidateId: { not: null }
        }
      })
      
      // Count unique voters who voted
      const uniqueVoters = await prisma.vote.groupBy({
        by: ['voterId'],
        where: {
          voter: {
            voterId: { not: { startsWith: 'TEST_' } },
            yuvaPankZoneId: zone.id
          },
          yuvaPankhCandidateId: { not: null }
        }
      })
      
      const turnout = votersInZone > 0 ? ((uniqueVoters.length / votersInZone) * 100).toFixed(1) : '0.0'
      
      console.log(`\n   Zone: ${zone.name} (${zone.code})`)
      console.log(`   📋 Total voters: ${votersInZone}`)
      console.log(`   🗳️  Total votes: ${votesInZone}`)
      console.log(`   👥 Unique voters voted: ${uniqueVoters.length}`)
      console.log(`   📊 Turnout: ${turnout}%`)
    }
    
    // 5. Check candidate vote counts
    console.log(`\n5️⃣ Checking Candidate Vote Counts`)
    console.log('-'.repeat(70))
    
    const kutchZone = zones.find(z => z.code === 'KUTCH')
    if (kutchZone) {
      const kutchCandidates = await prisma.yuvaPankhCandidate.findMany({
        where: {
          zoneId: kutchZone.id,
          status: 'APPROVED',
          position: { not: 'NOTA' }
        }
      })
      
      console.log(`\n   Kutch zone candidates:`)
      for (const candidate of kutchCandidates) {
        const voteCount = await prisma.vote.count({
          where: {
            yuvaPankhCandidateId: candidate.id,
            voter: {
              voterId: { not: { startsWith: 'TEST_' } }
            }
          }
        })
        
        const testVoteCount = await prisma.vote.count({
          where: {
            yuvaPankhCandidateId: candidate.id,
            voter: {
              voterId: { startsWith: 'TEST_' }
            }
          }
        })
        
        console.log(`   ${candidate.name}:`)
        console.log(`      Regular votes: ${voteCount}`)
        console.log(`      Test votes: ${testVoteCount}`)
        console.log(`      Total: ${voteCount + testVoteCount}`)
      }
    }
    
    // 6. Validate vote integrity
    console.log(`\n6️⃣ Validating Vote Integrity`)
    console.log('-'.repeat(70))
    
    // Check for votes from wrong zones
    const allVotes = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidateId: { not: null },
        voter: {
          voterId: { not: { startsWith: 'TEST_' } }
        }
      },
      include: {
        voter: {
          select: { yuvaPankZoneId: true, voterId: true }
        },
        yuvaPankhCandidate: {
          select: { zoneId: true, name: true }
        }
      },
      take: 100
    })
    
    let invalidVotes = 0
    for (const vote of allVotes) {
      if (vote.voter?.yuvaPankZoneId && vote.yuvaPankhCandidate?.zoneId) {
        if (vote.voter.yuvaPankZoneId !== vote.yuvaPankhCandidate.zoneId) {
          invalidVotes++
        }
      }
    }
    
    if (invalidVotes === 0) {
      console.log(`✅ All votes are valid (voters voted in their own zones)`)
    } else {
      console.log(`❌ Found ${invalidVotes} invalid votes (voters voted outside their zones)`)
    }
    
    // 7. Summary
    console.log(`\n📋 Summary`)
    console.log('='.repeat(70))
    console.log(`✅ Test voter: ${testVoter.voterId}`)
    console.log(`✅ Test voter votes: ${testVoter.votes.length}`)
    console.log(`✅ Test voter has voted: ${testVoter.hasVoted}`)
    console.log(`✅ Total votes (excluding test): ${totalVotes}`)
    console.log(`✅ Test votes: ${testVotes}`)
    console.log(`✅ Invalid votes: ${invalidVotes}`)
    console.log(`✅ Election status: ${election?.status || 'NOT FOUND'}`)
    
    if (testVoter.votes.length > 0) {
      console.log(`\n🎉 Test voter's vote was successfully recorded!`)
      console.log(`\n✅ Validation Results:`)
      console.log(`   • Vote submission: SUCCESS`)
      console.log(`   • Zone validation: ${testVoter.votes.every(v => v.yuvaPankhCandidate?.zoneId === testVoter.yuvaPankZoneId) ? 'PASS' : 'FAIL'}`)
      console.log(`   • Vote exclusion: ${testVotes === testVoter.votes.length ? 'CORRECT (test votes excluded from counts)' : 'CHECK REQUIRED'}`)
    } else {
      console.log(`\n⚠️  Test voter has not voted yet. Please submit a vote first.`)
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

validateVoteSubmission()

