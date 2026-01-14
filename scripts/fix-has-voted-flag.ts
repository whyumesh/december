/**
 * Fix hasVoted flag for voters who have votes but flag is false
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

async function fixHasVotedFlag() {
  try {
    console.log('🔧 Fixing hasVoted flags...\n')
    
    // Find voters who have votes but hasVoted is false
    const votersWithVotes = await prisma.voter.findMany({
      where: {
        hasVoted: false,
        votes: {
          some: {
            yuvaPankhCandidateId: { not: null }
          }
        }
      },
      include: {
        votes: {
          where: {
            yuvaPankhCandidateId: { not: null }
          }
        }
      }
    })
    
    console.log(`Found ${votersWithVotes.length} voters with votes but hasVoted=false\n`)
    
    if (votersWithVotes.length === 0) {
      console.log('✅ No voters need fixing')
      return
    }
    
    // Update each voter
    for (const voter of votersWithVotes) {
      console.log(`Updating voter: ${voter.voterId} (${voter.name})`)
      console.log(`   Votes: ${voter.votes.length}`)
      
      await prisma.voter.update({
        where: { id: voter.id },
        data: { hasVoted: true }
      })
      
      console.log(`   ✅ Updated\n`)
    }
    
    console.log(`✅ Fixed ${votersWithVotes.length} voter(s)`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixHasVotedFlag()

