/**
 * Clean up Kutch candidates - reject incorrect candidates
 * Keep only: Bhavesh Harilal Mandan, Raj Dhiraj Mandan, Nikhil Vasant Gandhi
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

async function cleanCandidates() {
  try {
    const zone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!zone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    console.log(`\n🧹 Cleaning up Kutch candidates...\n`)
    
    // Get all approved candidates
    const allCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { 
        zoneId: zone.id,
        status: 'APPROVED'
      }
    })
    
    // Expected candidates
    const expected = [
      'Bhavesh Harilal Mandan',
      'Raj Dhiraj Mandan',
      'Nikhil Vasant Gandhi'
    ]
    
    // Find candidates to reject
    const toReject = allCandidates.filter(c => {
      const nameLower = c.name.toLowerCase()
      return !expected.some(e => {
        const eParts = e.toLowerCase().split(' ')
        return eParts.every(part => nameLower.includes(part))
      })
    })
    
    console.log(`Found ${allCandidates.length} approved candidates`)
    console.log(`Expected candidates:`)
    expected.forEach(e => console.log(`   - ${e}`))
    console.log(`\nCandidates to reject: ${toReject.length}\n`)
    
    if (toReject.length === 0) {
      console.log('✅ No candidates to clean up')
      return
    }
    
    // Reject incorrect candidates
    for (const candidate of toReject) {
      console.log(`Rejecting: ${candidate.name} (ID: ${candidate.id})`)
      
      await prisma.yuvaPankhCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Incorrect zone assignment. This candidate does not belong to Kutch zone. Only Bhavesh Harilal Mandan, Raj Dhiraj Mandan, and Nikhil Vasant Gandhi are the approved candidates for Kutch zone.'
        }
      })
      
      console.log(`   ✅ Rejected\n`)
    }
    
    // Verify
    const remaining = await prisma.yuvaPankhCandidate.findMany({
      where: { 
        zoneId: zone.id,
        status: 'APPROVED'
      }
    })
    
    console.log(`\n✅ Cleanup complete!`)
    console.log(`Remaining approved candidates: ${remaining.length}`)
    remaining.forEach(c => console.log(`   - ${c.name} (${c.position})`))
    
    // Final verification
    const remainingNames = remaining.map(c => c.name.toLowerCase())
    const allExpectedFound = expected.every(e => {
      const eParts = e.toLowerCase().split(' ')
      return remainingNames.some(n => eParts.every(part => n.includes(part)))
    })
    
    if (allExpectedFound && remaining.length === expected.length) {
      console.log(`\n✅ Verification: All correct candidates are present and no incorrect candidates remain`)
    } else {
      console.log(`\n⚠️  Verification: Something might be wrong. Please check manually.`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanCandidates()

