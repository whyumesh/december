/**
 * Count voters who can log in to Kutch zone (excluding test voters)
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

async function countKutchLoginVoters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('KUTCH ZONE LOGIN VOTER COUNT')
    console.log('='.repeat(80))
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    // Count all voters assigned to Kutch zone (excluding test voters)
    const totalVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    // Count active voters
    const activeVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        isActive: true,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    // Count inactive voters
    const inactiveVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        isActive: false,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    // Count voters who have voted
    const votersWhoVoted = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        hasVoted: true,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    // Count voters who haven't voted yet
    const votersNotVoted = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        hasVoted: false,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    // Count test voters (for reference)
    const testVoters = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          startsWith: 'TEST_'
        }
      }
    })
    
    console.log(`\n📊 KUTCH ZONE VOTER STATISTICS:`)
    console.log('─'.repeat(80))
    console.log(`✅ Total Voters (excluding test): ${totalVoters}`)
    console.log(`   - Active Voters: ${activeVoters}`)
    console.log(`   - Inactive Voters: ${inactiveVoters}`)
    console.log(`   - Voters Who Voted: ${votersWhoVoted}`)
    console.log(`   - Voters Not Voted Yet: ${votersNotVoted}`)
    console.log(`\n⚠️  Test Voters (excluded from login): ${testVoters}`)
    
    console.log(`\n` + '='.repeat(80))
    console.log('LOGIN ACCESS SUMMARY')
    console.log('='.repeat(80))
    console.log(`🔐 Voters who CAN LOGIN: ${activeVoters}`)
    console.log(`   (Active voters assigned to Kutch zone)`)
    console.log(`\n🚫 Voters who CANNOT LOGIN:`)
    console.log(`   - Inactive voters: ${inactiveVoters}`)
    console.log(`   - Test voters: ${testVoters}`)
    console.log(`   - Total blocked: ${inactiveVoters + testVoters}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

countKutchLoginVoters()

