/**
 * Delete test voter's votes (for testing purposes)
 * WARNING: This will delete all votes cast by the test voter
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

async function deleteTestVoterVotes() {
  try {
    console.log('🗑️  Deleting test voter votes...\n')
    
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
    
    console.log(`Found test voter: ${testVoter.voterId}`)
    console.log(`Existing votes: ${testVoter.votes.length}`)
    
    if (testVoter.votes.length === 0) {
      console.log('✅ No votes to delete')
      return
    }
    
    // Delete votes
    const voteIds = testVoter.votes.map(v => v.id)
    await prisma.vote.deleteMany({
      where: {
        voterId: testVoter.id
      }
    })
    
    // Update voter's hasVoted status
    await prisma.voter.update({
      where: { id: testVoter.id },
      data: { hasVoted: false }
    })
    
    console.log(`\n✅ Deleted ${voteIds.length} vote(s)`)
    console.log(`✅ Reset hasVoted status to false`)
    console.log(`\n📝 Test voter can now vote again`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deleteTestVoterVotes()

