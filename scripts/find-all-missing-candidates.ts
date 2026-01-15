/**
 * Find ALL candidates that might have been missed - check all statuses and deleted table
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

async function findAllMissingCandidates() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('COMPREHENSIVE SEARCH: ALL CANDIDATES (INCLUDING DELETED/WITHDRAWN)')
    console.log('='.repeat(80))
    
    const newNominationDate = new Date('2026-01-13')
    
    // Get zones
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone || !anyaGujaratZone) {
      console.log('❌ Zones not found')
      return
    }
    
    // Get ALL candidates with ALL statuses
    const allKutchCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { zoneId: kutchZone.id },
      orderBy: { createdAt: 'asc' }
    })
    
    const allAnyaGujaratCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { zoneId: anyaGujaratZone.id },
      orderBy: { createdAt: 'asc' }
    })
    
    // Check deleted candidates table
    const deletedKutch = await prisma.deletedYuvaPankhCandidate.findMany({
      where: { zoneId: kutchZone.id },
      orderBy: { deletedAt: 'desc' }
    })
    
    const deletedAnyaGujarat = await prisma.deletedYuvaPankhCandidate.findMany({
      where: { zoneId: anyaGujaratZone.id },
      orderBy: { deletedAt: 'desc' }
    })
    
    console.log('\n' + '='.repeat(80))
    console.log('KUTCH ZONE - COMPLETE ANALYSIS')
    console.log('='.repeat(80))
    
    console.log(`\n📋 ACTIVE CANDIDATES TABLE (all statuses): ${allKutchCandidates.length}`)
    allKutchCandidates.forEach(c => {
      const isOld = c.createdAt < newNominationDate
      const ageLabel = isOld ? 'OLD' : 'NEW'
      const statusIcon = 
        c.status === 'APPROVED' ? '✅' : 
        c.status === 'REJECTED' ? '❌' : 
        c.status === 'PENDING' ? '⏳' : 
        c.status === 'WITHDRAWN' ? '🚫' : '❓'
      
      console.log(`\n   ${statusIcon} [${ageLabel}] ${c.name}`)
      console.log(`      Created: ${c.createdAt.toISOString().split('T')[0]}`)
      console.log(`      Status: ${c.status}`)
      if (c.rejectionReason) {
        console.log(`      Rejection: ${c.rejectionReason.substring(0, 100)}...`)
      }
    })
    
    console.log(`\n\n🗑️  DELETED CANDIDATES TABLE: ${deletedKutch.length}`)
    if (deletedKutch.length > 0) {
      deletedKutch.forEach(c => {
        const isOld = c.originalCreatedAt < newNominationDate
        const ageLabel = isOld ? 'OLD' : 'NEW'
        console.log(`\n   🗑️  [${ageLabel}] ${c.name}`)
        console.log(`      Original Created: ${c.originalCreatedAt.toISOString().split('T')[0]}`)
        console.log(`      Deleted: ${c.deletedAt.toISOString().split('T')[0]}`)
        console.log(`      Status when deleted: ${c.status}`)
        if (c.reason) {
          console.log(`      Reason: ${c.reason.substring(0, 100)}...`)
        }
      })
    } else {
      console.log('   (none found)')
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('ANYA GUJARAT ZONE - COMPLETE ANALYSIS')
    console.log('='.repeat(80))
    
    console.log(`\n📋 ACTIVE CANDIDATES TABLE (all statuses): ${allAnyaGujaratCandidates.length}`)
    allAnyaGujaratCandidates.forEach(c => {
      const isOld = c.createdAt < newNominationDate
      const ageLabel = isOld ? 'OLD' : 'NEW'
      const statusIcon = 
        c.status === 'APPROVED' ? '✅' : 
        c.status === 'REJECTED' ? '❌' : 
        c.status === 'PENDING' ? '⏳' : 
        c.status === 'WITHDRAWN' ? '🚫' : '❓'
      
      console.log(`\n   ${statusIcon} [${ageLabel}] ${c.name}`)
      console.log(`      Created: ${c.createdAt.toISOString().split('T')[0]}`)
      console.log(`      Status: ${c.status}`)
      if (c.rejectionReason) {
        console.log(`      Rejection: ${c.rejectionReason.substring(0, 100)}...`)
      }
    })
    
    console.log(`\n\n🗑️  DELETED CANDIDATES TABLE: ${deletedAnyaGujarat.length}`)
    if (deletedAnyaGujarat.length > 0) {
      deletedAnyaGujarat.forEach(c => {
        const isOld = c.originalCreatedAt < newNominationDate
        const ageLabel = isOld ? 'OLD' : 'NEW'
        console.log(`\n   🗑️  [${ageLabel}] ${c.name}`)
        console.log(`      Original Created: ${c.originalCreatedAt.toISOString().split('T')[0]}`)
        console.log(`      Deleted: ${c.deletedAt.toISOString().split('T')[0]}`)
        console.log(`      Status when deleted: ${c.status}`)
        if (c.reason) {
          console.log(`      Reason: ${c.reason.substring(0, 100)}...`)
        }
      })
    } else {
      console.log('   (none found)')
    }
    
    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('FINAL SUMMARY')
    console.log('='.repeat(80))
    
    const kutchOld = allKutchCandidates.filter(c => c.createdAt < newNominationDate)
    const anyaGujaratOld = allAnyaGujaratCandidates.filter(c => c.createdAt < newNominationDate)
    
    const kutchOldDeleted = deletedKutch.filter(c => c.originalCreatedAt < newNominationDate)
    const anyaGujaratOldDeleted = deletedAnyaGujarat.filter(c => c.originalCreatedAt < newNominationDate)
    
    console.log(`\n✅ KUTCH ZONE:`)
    console.log(`   Old candidates in active table: ${kutchOld.length}`)
    console.log(`      Approved: ${kutchOld.filter(c => c.status === 'APPROVED').length}`)
    console.log(`      Rejected: ${kutchOld.filter(c => c.status === 'REJECTED').length}`)
    console.log(`      Pending: ${kutchOld.filter(c => c.status === 'PENDING').length}`)
    console.log(`      Withdrawn: ${kutchOld.filter(c => c.status === 'WITHDRAWN').length}`)
    console.log(`   Old candidates in deleted table: ${kutchOldDeleted.length}`)
    
    console.log(`\n✅ ANYA GUJARAT ZONE:`)
    console.log(`   Old candidates in active table: ${anyaGujaratOld.length}`)
    console.log(`      Approved: ${anyaGujaratOld.filter(c => c.status === 'APPROVED').length}`)
    console.log(`      Rejected: ${anyaGujaratOld.filter(c => c.status === 'REJECTED').length}`)
    console.log(`      Pending: ${anyaGujaratOld.filter(c => c.status === 'PENDING').length}`)
    console.log(`      Withdrawn: ${anyaGujaratOld.filter(c => c.status === 'WITHDRAWN').length}`)
    console.log(`   Old candidates in deleted table: ${anyaGujaratOldDeleted.length}`)
    
    // Check if we need to restore anything from deleted table
    if (kutchOldDeleted.length > 0 || anyaGujaratOldDeleted.length > 0) {
      console.log(`\n⚠️  NOTE: There are old candidates in the DELETED table.`)
      console.log(`   These were permanently deleted and cannot be automatically restored.`)
      console.log(`   If you need them back, you'll need to manually recreate them.`)
    }
    
    // Check for any old candidates that are not approved
    const kutchOldNotApproved = kutchOld.filter(c => c.status !== 'APPROVED')
    const anyaGujaratOldNotApproved = anyaGujaratOld.filter(c => c.status !== 'APPROVED')
    
    if (kutchOldNotApproved.length > 0 || anyaGujaratOldNotApproved.length > 0) {
      console.log(`\n⚠️  WARNING: Found old candidates that are NOT approved:`)
      if (kutchOldNotApproved.length > 0) {
        console.log(`\n   Kutch:`)
        kutchOldNotApproved.forEach(c => {
          console.log(`      - ${c.name} (Status: ${c.status}, Created: ${c.createdAt.toISOString().split('T')[0]})`)
        })
      }
      if (anyaGujaratOldNotApproved.length > 0) {
        console.log(`\n   Anya Gujarat:`)
        anyaGujaratOldNotApproved.forEach(c => {
          console.log(`      - ${c.name} (Status: ${c.status}, Created: ${c.createdAt.toISOString().split('T')[0]})`)
        })
      }
    } else {
      console.log(`\n✅ All old candidates in the active table are APPROVED!`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

findAllMissingCandidates()

