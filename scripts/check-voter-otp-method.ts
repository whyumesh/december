import { prisma } from '../src/lib/db'
import * as fs from 'fs'
import { Prisma } from '@prisma/client'

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

async function checkVoterOTPMethod() {
  try {
    console.log('Starting voter lookup...')
    
    const voterNames = ['Pragnesh Ramesh Mall', 'Sheetal Pragnesh Mall']
    
    console.log('\n========================================')
    console.log('CHECKING OTP METHOD FOR VOTERS')
    console.log('========================================\n')

    for (const name of voterNames) {
      console.log(`Searching for: ${name}`)
      
      // Try multiple search patterns
      const searchPatterns: Prisma.VoterWhereInput[] = [
        { name: { contains: name, mode: 'insensitive' } },
        { name: { equals: name, mode: 'insensitive' } },
        { name: { startsWith: name.split(' ')[0], mode: 'insensitive' } }
      ]
      
      let voters: any[] = []
      for (const pattern of searchPatterns) {
        voters = await prisma.voter.findMany({
          where: pattern,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        })
        if (voters.length > 0) break
      }

      if (voters.length === 0) {
        console.log(`❌ No voter found with name: ${name}\n`)
        continue
      }
      
      console.log(`✅ Found ${voters.length} voter(s) matching "${name}"`)

      for (const voter of voters) {
        const displayName = voter.user?.name || voter.name
        const email = voter.email || voter.user?.email || null
        const phone = voter.phone || voter.user?.phone || null

        console.log(`📋 Voter: ${displayName}`)
        console.log(`   Voter ID: ${voter.voterId || 'N/A'}`)
        console.log(`   Email: ${email || '❌ Not available'}`)
        console.log(`   Phone: ${phone || '❌ Not available'}`)
        
        if (email) {
          console.log(`   ✅ Can use EMAIL OTP (if they enter email on login page)`)
        }
        if (phone) {
          console.log(`   ✅ Can use SMS OTP (if they enter phone on login page)`)
        }
        if (!email && !phone) {
          console.log(`   ⚠️  No contact information available - cannot receive OTP`)
        }
        console.log('')
      }
    }

    console.log('\n📝 Note: OTP method is determined by what the voter enters:')
    console.log('   - If they enter EMAIL → Email OTP is sent (via SMTP)')
    console.log('   - If they enter PHONE → SMS OTP is sent (via Twilio)\n')

  } catch (error) {
    console.error('Error checking voters:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVoterOTPMethod()

