/**
 * Script to add a test voter that won't be counted in statistics
 * Run with: npx tsx scripts/add-test-voter.ts
 */

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

const TEST_PHONE = '7400324576'
const TEST_VOTER_ID = 'TEST_VOTER_001'

async function addTestVoter() {
  try {
    console.log('🔧 Adding test voter...\n')
    
    // Check if test voter already exists
    const existingVoter = await prisma.voter.findFirst({
      where: {
        OR: [
          { phone: TEST_PHONE },
          { voterId: TEST_VOTER_ID }
        ]
      }
    })
    
    if (existingVoter) {
      console.log('⚠️  Test voter already exists!')
      console.log(`   Voter ID: ${existingVoter.voterId}`)
      console.log(`   Phone: ${existingVoter.phone}`)
      console.log(`   Name: ${existingVoter.name}`)
      
      // Update to ensure it's marked as test voter
      const updated = await prisma.voter.update({
        where: { id: existingVoter.id },
        data: {
          // Mark as test voter by using a special voterId prefix
          voterId: TEST_VOTER_ID,
          phone: TEST_PHONE,
          isActive: true,
          // Add a note in the name to identify as test
          name: existingVoter.name.includes('[TEST]') ? existingVoter.name : `[TEST] ${existingVoter.name}`
        }
      })
      
      console.log('\n✅ Test voter updated!')
      console.log(`   ID: ${updated.id}`)
      console.log(`   Voter ID: ${updated.voterId}`)
      console.log(`   Phone: ${updated.phone}`)
      console.log(`   Name: ${updated.name}`)
      console.log(`\n📝 Note: This voter will be excluded from all statistics`)
      return
    }
    
    // Find a zone to assign (use ANYA_GUJARAT for Yuva Pankh as default)
    const yuvaPankZone = await prisma.zone.findFirst({
      where: {
        code: 'ANYA_GUJARAT',
        electionType: 'YUVA_PANK'
      }
    })
    
    if (!yuvaPankZone) {
      throw new Error('ANYA_GUJARAT zone not found for Yuva Pankh!')
    }
    
    // Create test voter
    const testVoter = await prisma.voter.create({
      data: {
        voterId: TEST_VOTER_ID,
        name: '[TEST] Test Voter',
        phone: TEST_PHONE,
        email: 'test@example.com',
        region: 'Anya Gujarat',
        isActive: true,
        hasVoted: false,
        yuvaPankZoneId: yuvaPankZone.id,
        // Assign to other zones too for testing
        karobariZoneId: null,
        trusteeZoneId: null,
        age: 25,
        gender: 'M'
      }
    })
    
    console.log('✅ Test voter created successfully!')
    console.log(`   ID: ${testVoter.id}`)
    console.log(`   Voter ID: ${testVoter.voterId}`)
    console.log(`   Phone: ${testVoter.phone}`)
    console.log(`   Name: ${testVoter.name}`)
    console.log(`   Zone: ${yuvaPankZone.name} (${yuvaPankZone.code})`)
    console.log(`\n📝 Important:`)
    console.log(`   • This voter uses voterId: ${TEST_VOTER_ID}`)
    console.log(`   • All queries must exclude voters with voterId starting with 'TEST_'`)
    console.log(`   • This voter will NOT appear in any statistics or counts`)
    console.log(`   • Phone number: ${TEST_PHONE}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addTestVoter()

