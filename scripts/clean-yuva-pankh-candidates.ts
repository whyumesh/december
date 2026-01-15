/**
 * Clean Yuva Pankh candidates - keep only the 4 specified candidates
 * Anya Gujarat: Nidhi Ramesh Gandhi
 * Kutch: Bhavesh Harilal Mandan, Raj Dhiraj Mandan, Nikhil Vasant Gandhi
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Load environment variables
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
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

// Candidates to keep (case-insensitive matching)
const candidatesToKeep = [
  { name: 'Nidhi Ramesh Gandhi', zone: 'ANYA_GUJARAT' },
  { name: 'Bhavesh Harilal Mandan', zone: 'KUTCH' },
  { name: 'Raj Dhiraj Mandan', zone: 'KUTCH' },
  { name: 'Nikhil Vasant Gandhi', zone: 'KUTCH' }
]

// Normalize name for comparison (remove extra spaces, convert to uppercase)
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase()
}

async function cleanYuvaPankhCandidates() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('CLEANING YUVA PANKH CANDIDATES')
    console.log('='.repeat(80))
    
    // Get zones
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!anyaGujaratZone) {
      console.log('❌ Anya Gujarat zone not found')
      return
    }
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    console.log(`\n✅ Zones found:`)
    console.log(`   Anya Gujarat: ${anyaGujaratZone.id}`)
    console.log(`   Kutch: ${kutchZone.id}`)
    
    // Get all candidates in these zones
    const allCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: {
          in: [anyaGujaratZone.id, kutchZone.id]
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        zone: {
          select: {
            code: true,
            name: true
          }
        }
      }
    })
    
    console.log(`\n📊 Found ${allCandidates.length} total candidates in Anya Gujarat and Kutch zones`)
    
    // Create normalized list of candidates to keep
    const keepList = candidatesToKeep.map(c => ({
      normalizedName: normalizeName(c.name),
      zoneCode: c.zone,
      originalName: c.name
    }))
    
    // Find candidates to keep
    const candidatesToKeepList: typeof allCandidates = []
    const candidatesToRemove: typeof allCandidates = []
    
    for (const candidate of allCandidates) {
      const candidateName = candidate.user?.name || candidate.name || ''
      const normalizedCandidateName = normalizeName(candidateName)
      const zoneCode = candidate.zone?.code || ''
      
      // Check if this candidate should be kept
      const shouldKeep = keepList.some(keep => {
        const nameMatches = normalizedCandidateName === keep.normalizedName ||
                           normalizedCandidateName.includes(keep.normalizedName) ||
                           keep.normalizedName.includes(normalizedCandidateName)
        const zoneMatches = zoneCode === keep.zoneCode
        return nameMatches && zoneMatches
      })
      
      if (shouldKeep) {
        candidatesToKeepList.push(candidate)
      } else {
        candidatesToRemove.push(candidate)
      }
    }
    
    console.log(`\n✅ Candidates to KEEP: ${candidatesToKeepList.length}`)
    candidatesToKeepList.forEach(c => {
      console.log(`   - ${c.user?.name || c.name} (${c.zone?.code || 'N/A'}) - Status: ${c.status}`)
    })
    
    console.log(`\n❌ Candidates to REMOVE: ${candidatesToRemove.length}`)
    candidatesToRemove.forEach(c => {
      console.log(`   - ${c.user?.name || c.name} (${c.zone?.code || 'N/A'}) - Status: ${c.status}`)
    })
    
    if (candidatesToRemove.length === 0) {
      console.log(`\n✅ No candidates to remove. All candidates match the keep list.`)
      return
    }
    
    // Remove candidates (reject them)
    let removed = 0
    let errors = 0
    
    for (const candidate of candidatesToRemove) {
      try {
        await prisma.yuvaPankhCandidate.update({
          where: { id: candidate.id },
          data: {
            status: 'REJECTED',
            rejectionReason: 'Removed as per nomination update - not in the approved list of 4 candidates'
          }
        })
        removed++
        console.log(`   ✅ Removed: ${candidate.user?.name || candidate.name}`)
      } catch (error) {
        console.error(`   ❌ Error removing ${candidate.user?.name || candidate.name}:`, error)
        errors++
      }
    }
    
    // Summary
    console.log(`\n` + '='.repeat(80))
    console.log('CLEANUP RESULTS')
    console.log('='.repeat(80))
    console.log(`✅ Candidates kept: ${candidatesToKeepList.length}`)
    console.log(`❌ Candidates removed: ${removed}`)
    console.log(`❌ Errors: ${errors}`)
    
    // Verify final state
    const finalCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: {
          in: [anyaGujaratZone.id, kutchZone.id]
        },
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        zone: {
          select: {
            code: true
          }
        }
      }
    })
    
    console.log(`\n📊 Final approved candidates: ${finalCandidates.length}`)
    finalCandidates.forEach(c => {
      console.log(`   - ${c.user?.name || c.name} (${c.zone?.code || 'N/A'})`)
    })
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanYuvaPankhCandidates()

