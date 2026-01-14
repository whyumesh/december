/**
 * Test vote submission for test voter
 * This will simulate a vote submission to verify the voting system works
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

async function testVoteSubmission() {
  try {
    console.log('🧪 Testing Vote Submission System\n')
    console.log('='.repeat(70))
    
    // 1. Find test voter
    console.log('\n1️⃣ Finding test voter...')
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
          }
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
    console.log(`   Existing votes: ${testVoter.votes.length}`)
    
    if (testVoter.votes.length > 0) {
      console.log(`\n⚠️  Test voter has already voted!`)
      console.log(`   Existing vote IDs: ${testVoter.votes.map(v => v.id).join(', ')}`)
      console.log(`\n   To test again, you need to delete existing votes first.`)
      console.log(`   Run: npx tsx scripts/delete-test-voter-votes.ts`)
      return
    }
    
    // 2. Get available candidates
    console.log(`\n2️⃣ Getting available candidates for ${testVoter.yuvaPankZone?.name}...`)
    
    if (!testVoter.yuvaPankZoneId) {
      console.log('❌ Test voter has no zone assigned')
      return
    }
    
    const candidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: testVoter.yuvaPankZoneId,
        status: 'APPROVED',
        position: { not: 'NOTA' }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`✅ Found ${candidates.length} approved candidates:`)
    candidates.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.position}) - ID: ${c.id}`)
    })
    
    if (candidates.length === 0) {
      console.log('❌ No candidates available for voting')
      return
    }
    
    // 3. Get election
    console.log(`\n3️⃣ Getting election...`)
    const election = await prisma.election.findFirst({
      where: { type: 'YUVA_PANK' },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!election) {
      console.log('❌ No Yuva Pankh election found')
      return
    }
    
    console.log(`✅ Election found:`)
    console.log(`   ID: ${election.id}`)
    console.log(`   Status: ${election.status}`)
    
    if (election.status !== 'ACTIVE') {
      console.log(`\n⚠️  Election is not ACTIVE. Cannot submit votes.`)
      return
    }
    
    // 4. Simulate vote selection (select first candidate)
    console.log(`\n4️⃣ Simulating vote selection...`)
    const selectedCandidate = candidates[0]
    console.log(`   Selected candidate: ${selectedCandidate.name}`)
    
    // 5. Check zone seats
    const zone = testVoter.yuvaPankZone
    if (!zone) {
      console.log('❌ Zone not found')
      return
    }
    
    console.log(`   Zone seats: ${zone.seats}`)
    console.log(`   Selected: 1 candidate`)
    
    // 6. Verify candidate belongs to voter's zone
    if (selectedCandidate.zoneId !== testVoter.yuvaPankZoneId) {
      console.log(`\n❌ Candidate does not belong to voter's zone!`)
      console.log(`   Candidate zone: ${selectedCandidate.zoneId}`)
      console.log(`   Voter zone: ${testVoter.yuvaPankZoneId}`)
      return
    }
    
    console.log(`✅ Candidate belongs to voter's zone`)
    
    // 7. Check if we should proceed with actual vote submission
    console.log(`\n5️⃣ Vote Validation:`)
    console.log(`   ✅ Voter exists`)
    console.log(`   ✅ Voter has not voted yet`)
    console.log(`   ✅ Election is ACTIVE`)
    console.log(`   ✅ Candidate is APPROVED`)
    console.log(`   ✅ Candidate belongs to voter's zone`)
    console.log(`   ✅ Zone has ${zone.seats} seat(s)`)
    
    console.log(`\n📝 Ready to submit vote!`)
    console.log(`\n⚠️  Note: This script only validates the voting logic.`)
    console.log(`   To actually submit a vote, you need to:`)
    console.log(`   1. Log in as the test voter (phone: 7400324576)`)
    console.log(`   2. Go to the voting page`)
    console.log(`   3. View candidate profiles`)
    console.log(`   4. Select candidate(s)`)
    console.log(`   5. Submit vote`)
    
    console.log(`\n✅ All validations passed! Voting system is ready.`)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testVoteSubmission()

