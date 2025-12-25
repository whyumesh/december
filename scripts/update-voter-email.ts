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

async function updateVoterEmail(voterId: string, newEmail: string) {
  try {
    console.log(`\n🔍 Finding voter: ${voterId}...\n`)
    
    // Find the voter
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
    
    console.log('📋 Current Voter Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Voter ID: ${voter.voterId}`)
    console.log(`Name: ${voter.name}`)
    console.log(`Current Email: ${voter.email || 'N/A'}`)
    if (voter.user) {
      console.log(`User Email: ${voter.user.email || 'N/A'}`)
    }
    
    console.log(`\n🔄 Updating email to: ${newEmail}...\n`)
    
    // Update voter email
    const updatedVoter = await prisma.voter.update({
      where: { id: voter.id },
      data: { email: newEmail }
    })
    
    // Update user email if user exists
    if (voter.user) {
      await prisma.user.update({
        where: { id: voter.user.id },
        data: { email: newEmail }
      })
      console.log('✅ User email updated')
    }
    
    console.log('✅ Voter email updated successfully!')
    
    console.log('\n📋 Updated Voter Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Voter ID: ${updatedVoter.voterId}`)
    console.log(`Name: ${updatedVoter.name}`)
    console.log(`New Email: ${updatedVoter.email}`)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Error updating voter email:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const voterId = process.argv[2] || 'VID-1872'
const newEmail = process.argv[3] || 'honeymaheshwari52@gmail.com'

updateVoterEmail(voterId, newEmail)
  .then(() => {
    console.log('\n✅ Update completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

