import { prisma } from '../src/lib/db'
import * as fs from 'fs'

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile('.env.local')

async function checkVoterTimestamps(voterId: string) {
  try {
    const voter = await prisma.voter.findFirst({
      where: {
        OR: [
          { voterId: voterId },
          { name: { contains: voterId, mode: 'insensitive' } }
        ]
      },
      include: {
        user: true
      }
    })
    
    if (!voter) {
      console.log(`❌ Voter not found: ${voterId}`)
      await prisma.$disconnect()
      return
    }
    
    console.log('\n📅 Timestamp Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Voter ID: ${voter.voterId}`)
    console.log(`Name: ${voter.name}`)
    console.log(`\nVoter Table:`)
    console.log(`  Created At: ${voter.createdAt.toISOString()}`)
    console.log(`  Created At (Local): ${voter.createdAt.toLocaleString()}`)
    console.log(`  Updated At: ${voter.updatedAt.toISOString()}`)
    console.log(`  Updated At (Local): ${voter.updatedAt.toLocaleString()}`)
    console.log(`  Email: ${voter.email}`)
    
    if (voter.user) {
      console.log(`\nUser Table:`)
      console.log(`  Created At: ${voter.user.createdAt.toISOString()}`)
      console.log(`  Created At (Local): ${voter.user.createdAt.toLocaleString()}`)
      console.log(`  Updated At: ${voter.user.updatedAt.toISOString()}`)
      console.log(`  Updated At (Local): ${voter.user.updatedAt.toLocaleString()}`)
      console.log(`  Email: ${voter.user.email}`)
    }
    
    // Calculate time difference
    const now = new Date()
    const voterUpdatedAgo = Math.round((now.getTime() - voter.updatedAt.getTime()) / 1000 / 60) // minutes
    console.log(`\n⏰ Time Since Last Update:`)
    console.log(`  Voter record updated ${voterUpdatedAgo} minutes ago`)
    
    if (voter.user) {
      const userUpdatedAgo = Math.round((now.getTime() - voter.user.updatedAt.getTime()) / 1000 / 60) // minutes
      console.log(`  User record updated ${userUpdatedAgo} minutes ago`)
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const voterId = process.argv[2] || 'VID-1872'

checkVoterTimestamps(voterId)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

