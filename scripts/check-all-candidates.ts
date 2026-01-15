/**
 * Check all Yuva Pankh candidates (approved and rejected) to see what we have
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

async function checkAllCandidates() {
  try {
    console.log('\n📊 Checking all Yuva Pankh candidates...\n')
    
    // Get all zones
    const zones = await prisma.zone.findMany({
      where: { electionType: 'YUVA_PANK' },
      orderBy: { code: 'asc' }
    })
    
    for (const zone of zones) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Zone: ${zone.name} (${zone.code})`)
      console.log('='.repeat(60))
      
      // Get all candidates for this zone (all statuses)
      const allCandidates = await prisma.yuvaPankhCandidate.findMany({
        where: { zoneId: zone.id },
        orderBy: { createdAt: 'asc' }
      })
      
      if (allCandidates.length === 0) {
        console.log('   No candidates found')
        continue
      }
      
      // Group by status
      const byStatus = {
        APPROVED: allCandidates.filter(c => c.status === 'APPROVED'),
        REJECTED: allCandidates.filter(c => c.status === 'REJECTED'),
        PENDING: allCandidates.filter(c => c.status === 'PENDING'),
        WITHDRAWN: allCandidates.filter(c => c.status === 'WITHDRAWN')
      }
      
      console.log(`\n   Total: ${allCandidates.length} candidates`)
      console.log(`   ✅ Approved: ${byStatus.APPROVED.length}`)
      console.log(`   ❌ Rejected: ${byStatus.REJECTED.length}`)
      console.log(`   ⏳ Pending: ${byStatus.PENDING.length}`)
      console.log(`   🚫 Withdrawn: ${byStatus.WITHDRAWN.length}`)
      
      if (byStatus.APPROVED.length > 0) {
        console.log(`\n   ✅ APPROVED CANDIDATES:`)
        byStatus.APPROVED.forEach(c => {
          console.log(`      - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
        })
      }
      
      if (byStatus.REJECTED.length > 0) {
        console.log(`\n   ❌ REJECTED CANDIDATES:`)
        byStatus.REJECTED.forEach(c => {
          console.log(`      - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
          if (c.rejectionReason) {
            console.log(`        Reason: ${c.rejectionReason.substring(0, 100)}...`)
          }
        })
      }
      
      if (byStatus.PENDING.length > 0) {
        console.log(`\n   ⏳ PENDING CANDIDATES:`)
        byStatus.PENDING.forEach(c => {
          console.log(`      - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
        })
      }
    }
    
    // Also check deleted candidates table
    console.log(`\n\n${'='.repeat(60)}`)
    console.log('DELETED CANDIDATES TABLE')
    console.log('='.repeat(60))
    
    const deletedCandidates = await prisma.deletedYuvaPankhCandidate.findMany({
      include: { zone: true },
      orderBy: { deletedAt: 'desc' }
    })
    
    if (deletedCandidates.length === 0) {
      console.log('\n   No deleted candidates found in deleted table')
    } else {
      console.log(`\n   Found ${deletedCandidates.length} deleted candidates:\n`)
      deletedCandidates.forEach(c => {
        console.log(`   - ${c.name} (Zone: ${c.zone?.code || 'Unknown'}, Deleted: ${c.deletedAt.toISOString().split('T')[0]})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllCandidates()

