/**
 * Verify final Yuva Pankh candidates - should only have 4 approved candidates
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

async function verifyFinalCandidates() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('VERIFYING FINAL YUVA PANKH CANDIDATES')
    console.log('='.repeat(80))
    
    // Get zones
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!anyaGujaratZone || !kutchZone) {
      console.log('❌ Zones not found')
      return
    }
    
    // Get all candidates by status
    const approvedCandidates = await prisma.yuvaPankhCandidate.findMany({
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
            code: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const rejectedCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: {
          in: [anyaGujaratZone.id, kutchZone.id]
        },
        status: 'REJECTED'
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const pendingCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: {
          in: [anyaGujaratZone.id, kutchZone.id]
        },
        status: 'PENDING'
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n✅ APPROVED CANDIDATES (${approvedCandidates.length}):`)
    console.log('─'.repeat(80))
    if (approvedCandidates.length === 0) {
      console.log('   No approved candidates')
    } else {
      approvedCandidates.forEach((c, index) => {
        console.log(`   ${index + 1}. ${c.user?.name || c.name}`)
        console.log(`      Zone: ${c.zone?.name || 'N/A'} (${c.zone?.code || 'N/A'})`)
        console.log(`      ID: ${c.id}`)
        console.log('')
      })
    }
    
    console.log(`\n❌ REJECTED CANDIDATES (${rejectedCandidates.length}):`)
    console.log('─'.repeat(80))
    if (rejectedCandidates.length === 0) {
      console.log('   No rejected candidates')
    } else {
      rejectedCandidates.forEach((c, index) => {
        console.log(`   ${index + 1}. ${c.user?.name || c.name}`)
        console.log(`      Zone: ${c.zone?.name || 'N/A'} (${c.zone?.code || 'N/A'})`)
        console.log(`      Reason: ${c.rejectionReason || 'N/A'}`)
        console.log('')
      })
    }
    
    console.log(`\n⚠️  PENDING CANDIDATES (${pendingCandidates.length}):`)
    console.log('─'.repeat(80))
    if (pendingCandidates.length === 0) {
      console.log('   No pending candidates')
    } else {
      pendingCandidates.forEach((c, index) => {
        console.log(`   ${index + 1}. ${c.user?.name || c.name}`)
        console.log(`      Zone: ${c.zone?.name || 'N/A'} (${c.zone?.code || 'N/A'})`)
        console.log('')
      })
    }
    
    // Expected candidates
    const expectedCandidates = [
      { name: 'Nidhi Ramesh Gandhi', zone: 'ANYA_GUJARAT' },
      { name: 'Bhavesh Harilal Mandan', zone: 'KUTCH' },
      { name: 'Raj Dhiraj Mandan', zone: 'KUTCH' },
      { name: 'Nikhil Vasant Gandhi', zone: 'KUTCH' }
    ]
    
    console.log(`\n` + '='.repeat(80))
    console.log('VERIFICATION SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Expected approved candidates: ${expectedCandidates.length}`)
    console.log(`✅ Actual approved candidates: ${approvedCandidates.length}`)
    console.log(`❌ Rejected candidates: ${rejectedCandidates.length}`)
    console.log(`⚠️  Pending candidates: ${pendingCandidates.length}`)
    
    if (approvedCandidates.length === expectedCandidates.length) {
      console.log(`\n✅ SUCCESS: Correct number of approved candidates!`)
    } else {
      console.log(`\n⚠️  WARNING: Mismatch in candidate count`)
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyFinalCandidates()

