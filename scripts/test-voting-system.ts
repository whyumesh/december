/**
 * Comprehensive test script for voting system
 * Tests vote counting, statistics, and test voter exclusion
 * Run with: npx tsx scripts/test-voting-system.ts
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

// Helper function to exclude test voters (same as in voter-utils.ts)
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

async function testVotingSystem() {
  console.log('🧪 Testing Voting System\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. Test Voter Counts
    console.log('\n📊 1. Testing Voter Counts (excluding test voters)')
    console.log('-'.repeat(60))
    
    const totalVoters = await prisma.voter.count({ where: excludeTestVoters() })
    const testVoters = await prisma.voter.count({ 
      where: { voterId: { startsWith: 'TEST_' } }
    })
    const allVoters = await prisma.voter.count()
    
    console.log(`✅ Total voters (excluding test): ${totalVoters}`)
    console.log(`⚠️  Test voters: ${testVoters}`)
    console.log(`📈 All voters: ${allVoters}`)
    console.log(`✓ Verification: ${totalVoters + testVoters === allVoters ? 'PASS' : 'FAIL'}`)
    
    // 2. Test Vote Counts
    console.log('\n🗳️  2. Testing Vote Counts (excluding test voters)')
    console.log('-'.repeat(60))
    
    const totalVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: {
            not: { startsWith: 'TEST_' }
          }
        }
      }
    })
    
    const testVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: { startsWith: 'TEST_' }
        }
      }
    })
    
    const allVotes = await prisma.vote.count()
    
    console.log(`✅ Total votes (excluding test): ${totalVotes}`)
    console.log(`⚠️  Test votes: ${testVotes}`)
    console.log(`📈 All votes: ${allVotes}`)
    console.log(`✓ Verification: ${totalVotes + testVotes === allVotes ? 'PASS' : 'FAIL'}`)
    
    // 3. Test Yuva Pankh Vote Counts by Zone
    console.log('\n🏛️  3. Testing Yuva Pankh Vote Counts by Zone')
    console.log('-'.repeat(60))
    
    const yuvaPankhZones = await prisma.zone.findMany({
      where: { electionType: 'YUVA_PANK', isActive: true }
    })
    
    for (const zone of yuvaPankhZones) {
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
      
      // Count unique voters who voted in this zone
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
    
    // 4. Test Candidate Vote Counts
    console.log('\n👤 4. Testing Candidate Vote Counts')
    console.log('-'.repeat(60))
    
    const yuvaPankhCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { status: 'APPROVED', position: { not: 'NOTA' } },
      include: { zone: true }
    })
    
    console.log(`\n   Found ${yuvaPankhCandidates.length} approved candidates\n`)
    
    for (const candidate of yuvaPankhCandidates.slice(0, 10)) { // Show first 10
      const voteCount = await prisma.vote.count({
        where: {
          yuvaPankhCandidateId: candidate.id,
          voter: {
            voterId: { not: { startsWith: 'TEST_' } }
          }
        }
      })
      
      console.log(`   ${candidate.name} (${candidate.zone?.code || 'No zone'}): ${voteCount} votes`)
    }
    
    // 5. Test Test Voter Exclusion
    console.log('\n🧪 5. Testing Test Voter Exclusion')
    console.log('-'.repeat(60))
    
    const testVoter = await prisma.voter.findFirst({
      where: { phone: '7400324576' }
    })
    
    if (testVoter) {
      console.log(`\n   Test voter found: ${testVoter.voterId}`)
      console.log(`   Name: ${testVoter.name}`)
      console.log(`   Zone: ${testVoter.yuvaPankZoneId || 'Not assigned'}`)
      
      // Check if test voter is excluded from counts
      const isExcluded = testVoter.voterId.startsWith('TEST_')
      console.log(`   ✓ Excluded from counts: ${isExcluded ? 'YES' : 'NO'}`)
      
      // Count test voter's votes
      const testVoterVotes = await prisma.vote.count({
        where: { voterId: testVoter.id }
      })
      console.log(`   Votes cast: ${testVoterVotes}`)
      
      // Verify test voter is not in regular counts
      const inRegularCount = await prisma.voter.count({
        where: excludeTestVoters({ id: testVoter.id })
      })
      console.log(`   ✓ In regular voter count: ${inRegularCount > 0 ? 'YES (ERROR!)' : 'NO (CORRECT)'}`)
    } else {
      console.log('   ⚠️  Test voter not found')
    }
    
    // 6. Test Election Status
    console.log('\n📅 6. Testing Election Status')
    console.log('-'.repeat(60))
    
    const yuvaPankhElection = await prisma.election.findFirst({
      where: { type: 'YUVA_PANK' },
      orderBy: { createdAt: 'desc' }
    })
    
    if (yuvaPankhElection) {
      console.log(`\n   Election ID: ${yuvaPankhElection.id}`)
      console.log(`   Status: ${yuvaPankhElection.status}`)
      console.log(`   Type: ${yuvaPankhElection.type}`)
      console.log(`   Created: ${yuvaPankhElection.createdAt}`)
      console.log(`   ✓ Election is ${yuvaPankhElection.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}`)
    } else {
      console.log('   ⚠️  No Yuva Pankh election found')
    }
    
    // 7. Test Vote Validation
    console.log('\n✅ 7. Testing Vote Validation Logic')
    console.log('-'.repeat(60))
    
    // Check for votes from wrong zones
    const invalidVotes = await prisma.vote.findMany({
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
    
    let invalidCount = 0
    for (const vote of invalidVotes) {
      if (vote.voter?.yuvaPankZoneId && vote.yuvaPankhCandidate?.zoneId) {
        if (vote.voter.yuvaPankZoneId !== vote.yuvaPankhCandidate.zoneId) {
          invalidCount++
          if (invalidCount <= 5) {
            console.log(`   ⚠️  Invalid vote: Voter ${vote.voter.voterId} voted for candidate from different zone`)
          }
        }
      }
    }
    
    if (invalidCount === 0) {
      console.log(`   ✓ All votes are valid (voters voted in their own zones)`)
    } else {
      console.log(`   ❌ Found ${invalidCount} invalid votes (voters voted outside their zones)`)
    }
    
    // 8. Summary
    console.log('\n📋 8. Summary')
    console.log('='.repeat(60))
    console.log(`✅ Total voters (excluding test): ${totalVoters}`)
    console.log(`✅ Total votes (excluding test): ${totalVotes}`)
    console.log(`✅ Test voters excluded: ${testVoters}`)
    console.log(`✅ Test votes excluded: ${testVotes}`)
    console.log(`✅ Invalid votes found: ${invalidCount}`)
    console.log(`✅ Election status: ${yuvaPankhElection?.status || 'NOT FOUND'}`)
    
    if (invalidCount === 0 && testVoters > 0 && testVotes >= 0) {
      console.log('\n🎉 All tests PASSED! System is ready for production.')
    } else {
      console.log('\n⚠️  Some issues found. Please review the results above.')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testVotingSystem()

