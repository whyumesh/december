/**
 * Comprehensive verification of old vs new candidates
 * Shows creation dates and identifies which candidates are truly "old"
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

async function verifyOldCandidates() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('COMPREHENSIVE VERIFICATION: OLD vs NEW CANDIDATES')
    console.log('='.repeat(80))
    
    // The new nomination processing happened on 2026-01-13
    // So candidates created before this date are "old"
    const newNominationDate = new Date('2026-01-13')
    
    console.log(`\n📅 Reference Date: ${newNominationDate.toISOString().split('T')[0]}`)
    console.log(`   Candidates created BEFORE this date are considered "OLD"`)
    console.log(`   Candidates created ON/AFTER this date are considered "NEW"\n`)
    
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
    
    // Get ALL candidates (all statuses) for both zones
    const allKutchCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { zoneId: kutchZone.id },
      orderBy: { createdAt: 'asc' }
    })
    
    const allAnyaGujaratCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { zoneId: anyaGujaratZone.id },
      orderBy: { createdAt: 'asc' }
    })
    
    // Analyze Kutch
    console.log('\n' + '='.repeat(80))
    console.log('KUTCH ZONE ANALYSIS')
    console.log('='.repeat(80))
    console.log(`\nTotal candidates found: ${allKutchCandidates.length}\n`)
    
    const kutchOld = allKutchCandidates.filter(c => c.createdAt < newNominationDate)
    const kutchNew = allKutchCandidates.filter(c => c.createdAt >= newNominationDate)
    
    console.log(`📊 OLD CANDIDATES (created before ${newNominationDate.toISOString().split('T')[0]}): ${kutchOld.length}`)
    if (kutchOld.length > 0) {
      kutchOld.forEach(c => {
        const dateStr = c.createdAt.toISOString().split('T')[0]
        const statusIcon = c.status === 'APPROVED' ? '✅' : c.status === 'REJECTED' ? '❌' : '⏳'
        console.log(`   ${statusIcon} ${c.name}`)
        console.log(`      Created: ${dateStr}`)
        console.log(`      Status: ${c.status}`)
        if (c.rejectionReason) {
          console.log(`      Rejection Reason: ${c.rejectionReason.substring(0, 80)}...`)
        }
        console.log('')
      })
    } else {
      console.log('   (none found)')
    }
    
    console.log(`\n📊 NEW CANDIDATES (created on/after ${newNominationDate.toISOString().split('T')[0]}): ${kutchNew.length}`)
    if (kutchNew.length > 0) {
      kutchNew.forEach(c => {
        const dateStr = c.createdAt.toISOString().split('T')[0]
        const statusIcon = c.status === 'APPROVED' ? '✅' : c.status === 'REJECTED' ? '❌' : '⏳'
        console.log(`   ${statusIcon} ${c.name}`)
        console.log(`      Created: ${dateStr}`)
        console.log(`      Status: ${c.status}`)
        console.log('')
      })
    } else {
      console.log('   (none found)')
    }
    
    // Analyze Anya Gujarat
    console.log('\n' + '='.repeat(80))
    console.log('ANYA GUJARAT ZONE ANALYSIS')
    console.log('='.repeat(80))
    console.log(`\nTotal candidates found: ${allAnyaGujaratCandidates.length}\n`)
    
    const anyaGujaratOld = allAnyaGujaratCandidates.filter(c => c.createdAt < newNominationDate)
    const anyaGujaratNew = allAnyaGujaratCandidates.filter(c => c.createdAt >= newNominationDate)
    
    console.log(`📊 OLD CANDIDATES (created before ${newNominationDate.toISOString().split('T')[0]}): ${anyaGujaratOld.length}`)
    if (anyaGujaratOld.length > 0) {
      anyaGujaratOld.forEach(c => {
        const dateStr = c.createdAt.toISOString().split('T')[0]
        const statusIcon = c.status === 'APPROVED' ? '✅' : c.status === 'REJECTED' ? '❌' : '⏳'
        console.log(`   ${statusIcon} ${c.name}`)
        console.log(`      Created: ${dateStr}`)
        console.log(`      Status: ${c.status}`)
        if (c.rejectionReason) {
          console.log(`      Rejection Reason: ${c.rejectionReason.substring(0, 80)}...`)
        }
        console.log('')
      })
    } else {
      console.log('   (none found)')
    }
    
    console.log(`\n📊 NEW CANDIDATES (created on/after ${newNominationDate.toISOString().split('T')[0]}): ${anyaGujaratNew.length}`)
    if (anyaGujaratNew.length > 0) {
      anyaGujaratNew.forEach(c => {
        const dateStr = c.createdAt.toISOString().split('T')[0]
        const statusIcon = c.status === 'APPROVED' ? '✅' : c.status === 'REJECTED' ? '❌' : '⏳'
        console.log(`   ${statusIcon} ${c.name}`)
        console.log(`      Created: ${dateStr}`)
        console.log(`      Status: ${c.status}`)
        console.log('')
      })
    } else {
      console.log('   (none found)')
    }
    
    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('SUMMARY')
    console.log('='.repeat(80))
    
    const kutchOldApproved = kutchOld.filter(c => c.status === 'APPROVED').length
    const kutchOldRejected = kutchOld.filter(c => c.status === 'REJECTED').length
    const kutchOldPending = kutchOld.filter(c => c.status === 'PENDING').length
    
    const anyaGujaratOldApproved = anyaGujaratOld.filter(c => c.status === 'APPROVED').length
    const anyaGujaratOldRejected = anyaGujaratOld.filter(c => c.status === 'REJECTED').length
    const anyaGujaratOldPending = anyaGujaratOld.filter(c => c.status === 'PENDING').length
    
    console.log(`\nKUTCH ZONE:`)
    console.log(`   Old candidates: ${kutchOld.length} total`)
    console.log(`      ✅ Approved: ${kutchOldApproved}`)
    console.log(`      ❌ Rejected: ${kutchOldRejected}`)
    console.log(`      ⏳ Pending: ${kutchOldPending}`)
    console.log(`   New candidates: ${kutchNew.length} total`)
    console.log(`      ✅ Approved: ${kutchNew.filter(c => c.status === 'APPROVED').length}`)
    
    console.log(`\nANYA GUJARAT ZONE:`)
    console.log(`   Old candidates: ${anyaGujaratOld.length} total`)
    console.log(`      ✅ Approved: ${anyaGujaratOldApproved}`)
    console.log(`      ❌ Rejected: ${anyaGujaratOldRejected}`)
    console.log(`      ⏳ Pending: ${anyaGujaratOldPending}`)
    console.log(`   New candidates: ${anyaGujaratNew.length} total`)
    console.log(`      ✅ Approved: ${anyaGujaratNew.filter(c => c.status === 'APPROVED').length}`)
    
    // Check if there are any old candidates that are still rejected
    const kutchOldStillRejected = kutchOld.filter(c => c.status === 'REJECTED')
    const anyaGujaratOldStillRejected = anyaGujaratOld.filter(c => c.status === 'REJECTED')
    
    if (kutchOldStillRejected.length > 0 || anyaGujaratOldStillRejected.length > 0) {
      console.log(`\n⚠️  WARNING: Found old candidates that are still REJECTED:`)
      if (kutchOldStillRejected.length > 0) {
        console.log(`\n   Kutch:`)
        kutchOldStillRejected.forEach(c => {
          console.log(`      - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
        })
      }
      if (anyaGujaratOldStillRejected.length > 0) {
        console.log(`\n   Anya Gujarat:`)
        anyaGujaratOldStillRejected.forEach(c => {
          console.log(`      - ${c.name} (Created: ${c.createdAt.toISOString().split('T')[0]})`)
        })
      }
    } else {
      console.log(`\n✅ All old candidates have been restored to APPROVED status!`)
    }
    
    // Final verification
    console.log(`\n` + '='.repeat(80))
    console.log('FINAL VERIFICATION')
    console.log('='.repeat(80))
    console.log(`\n✅ Kutch Zone:`)
    console.log(`   Total approved candidates: ${allKutchCandidates.filter(c => c.status === 'APPROVED').length}`)
    console.log(`   Old approved: ${kutchOldApproved}`)
    console.log(`   New approved: ${kutchNew.filter(c => c.status === 'APPROVED').length}`)
    
    console.log(`\n✅ Anya Gujarat Zone:`)
    console.log(`   Total approved candidates: ${allAnyaGujaratCandidates.filter(c => c.status === 'APPROVED').length}`)
    console.log(`   Old approved: ${anyaGujaratOldApproved}`)
    console.log(`   New approved: ${anyaGujaratNew.filter(c => c.status === 'APPROVED').length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyOldCandidates()

