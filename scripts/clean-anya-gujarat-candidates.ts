/**
 * Clean up Anya Gujarat candidates - reject old candidates
 * Keep only: Nidhi Ramesh Gandhi
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
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    if (!zone) {
      console.log('❌ Anya Gujarat zone not found')
      return
    }
    
    console.log(`\n🧹 Cleaning up Anya Gujarat candidates...\n`)
    
    // Get all approved candidates
    const allCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { 
        zoneId: zone.id,
        status: 'APPROVED'
      }
    })
    
    // Expected candidate
    const expectedName = 'Nidhi Ramesh Gandhi'
    
    // Find candidates to reject
    const toReject = allCandidates.filter(c => 
      !c.name.toLowerCase().includes(expectedName.toLowerCase())
    )
    
    console.log(`Found ${allCandidates.length} approved candidates`)
    console.log(`Expected: ${expectedName}`)
    console.log(`Candidates to reject: ${toReject.length}\n`)
    
    if (toReject.length === 0) {
      console.log('✅ No candidates to clean up')
      return
    }
    
    // Reject old candidates
    for (const candidate of toReject) {
      console.log(`Rejecting: ${candidate.name} (ID: ${candidate.id})`)
      
      await prisma.yuvaPankhCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Old candidate - replaced by new nomination process. Only Nidhi Ramesh Gandhi is the approved candidate for Anya Gujarat zone.'
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
    remaining.forEach(c => console.log(`   - ${c.name}`))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanCandidates()

