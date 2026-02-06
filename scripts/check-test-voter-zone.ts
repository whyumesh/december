import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
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

async function checkTestVoterZone() {
  try {
    const testVoter = await prisma.voter.findFirst({
      where: {
        OR: [
          { phone: '7400324576' },
          { voterId: 'TEST_VOTER_001' }
        ]
      },
      include: {
        yuvaPankZone: true
      }
    })

    if (!testVoter) {
      console.log('❌ Test voter not found')
      return
    }

    console.log('📊 Test Voter Information:')
    console.log(`   Voter ID: ${testVoter.voterId}`)
    console.log(`   Name: ${testVoter.name}`)
    console.log(`   Phone: ${testVoter.phone}`)
    console.log(`   Region: ${testVoter.region}`)
    console.log(`\n📍 Yuva Pankh Zone:`)
    if (testVoter.yuvaPankZone) {
      console.log(`   Zone Name: ${testVoter.yuvaPankZone.name}`)
      console.log(`   Zone Code: ${testVoter.yuvaPankZone.code}`)
      console.log(`   Zone ID: ${testVoter.yuvaPankZoneId}`)
    } else {
      console.log(`   ❌ No zone assigned`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkTestVoterZone()
