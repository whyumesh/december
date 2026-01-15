/**
 * Restore old Yuva Pankh candidates that were incorrectly rejected
 * This will restore candidates from Kutch and Anya Gujarat zones
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

async function restoreOldCandidates() {
  try {
    console.log('\n🔄 Restoring old Yuva Pankh candidates...\n')
    
    // Get zones
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    if (!anyaGujaratZone) {
      console.log('❌ Anya Gujarat zone not found')
      return
    }
    
    // Find rejected candidates that should be restored
    // These are the old candidates that were incorrectly rejected
    
    // Kutch: Jigar Bhedakiya
    const kutchRejected = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: kutchZone.id,
        status: 'REJECTED',
        name: {
          contains: 'Jigar',
          mode: 'insensitive'
        }
      }
    })
    
    // Anya Gujarat: VATSAL GINGAL and Rushik Mall
    const anyaGujaratRejected = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: anyaGujaratZone.id,
        status: 'REJECTED',
        OR: [
          { name: { contains: 'VATSAL', mode: 'insensitive' } },
          { name: { contains: 'Rushik', mode: 'insensitive' } }
        ]
      }
    })
    
    console.log(`Found ${kutchRejected.length} rejected candidate(s) in Kutch`)
    console.log(`Found ${anyaGujaratRejected.length} rejected candidate(s) in Anya Gujarat\n`)
    
    const allToRestore = [...kutchRejected, ...anyaGujaratRejected]
    
    if (allToRestore.length === 0) {
      console.log('✅ No candidates to restore')
      return
    }
    
    // Restore each candidate
    for (const candidate of allToRestore) {
      const zone = candidate.zoneId === kutchZone.id ? kutchZone : anyaGujaratZone
      console.log(`\n🔄 Restoring: ${candidate.name}`)
      console.log(`   Zone: ${zone.name} (${zone.code})`)
      console.log(`   Current status: ${candidate.status}`)
      console.log(`   Created: ${candidate.createdAt.toISOString().split('T')[0]}`)
      
      // Restore to APPROVED status and clear rejection reason
      await prisma.yuvaPankhCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          updatedAt: new Date()
        }
      })
      
      console.log(`   ✅ Restored to APPROVED status`)
    }
    
    // Verify restoration
    console.log(`\n\n${'='.repeat(60)}`)
    console.log('VERIFICATION')
    console.log('='.repeat(60))
    
    // Check Kutch
    const kutchApproved = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: kutchZone.id,
        status: 'APPROVED'
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`\n✅ Kutch - Approved candidates (${kutchApproved.length}):`)
    kutchApproved.forEach(c => {
      console.log(`   - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
    })
    
    // Check Anya Gujarat
    const anyaGujaratApproved = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: anyaGujaratZone.id,
        status: 'APPROVED'
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`\n✅ Anya Gujarat - Approved candidates (${anyaGujaratApproved.length}):`)
    anyaGujaratApproved.forEach(c => {
      console.log(`   - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
    })
    
    console.log(`\n\n✅ Restoration complete!`)
    console.log(`   Total restored: ${allToRestore.length} candidate(s)`)
    console.log(`   Kutch: ${kutchApproved.length} approved candidates`)
    console.log(`   Anya Gujarat: ${anyaGujaratApproved.length} approved candidates`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

restoreOldCandidates()

