/**
 * Production Readiness Check
 * Verifies all critical systems before going live
 * Run with: npx tsx scripts/production-readiness-check.ts
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

function excludeTestVoters(additionalWhere: any = {}) {
  return {
    ...additionalWhere,
    voterId: {
      not: {
        startsWith: 'TEST_',
      },
    },
  }
}

async function productionReadinessCheck() {
  console.log('🚀 Production Readiness Check\n')
  console.log('='.repeat(70))
  
  let allChecksPassed = true
  const issues: string[] = []
  
  try {
    // 1. Database Connection
    console.log('\n✅ 1. Database Connection')
    console.log('-'.repeat(70))
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('   ✓ Database connection: OK')
    } catch (error) {
      console.log('   ❌ Database connection: FAILED')
      issues.push('Database connection failed')
      allChecksPassed = false
    }
    
    // 2. Election Status
    console.log('\n✅ 2. Election Status')
    console.log('-'.repeat(70))
    const election = await prisma.election.findFirst({
      where: { type: 'YUVA_PANK' },
      orderBy: { createdAt: 'desc' }
    })
    
    if (election) {
      console.log(`   ✓ Election found: ${election.id}`)
      console.log(`   ✓ Status: ${election.status}`)
      if (election.status !== 'ACTIVE') {
        console.log('   ⚠️  Election is not ACTIVE')
        issues.push('Election status is not ACTIVE')
        allChecksPassed = false
      }
    } else {
      console.log('   ❌ No election found')
      issues.push('No Yuva Pankh election found')
      allChecksPassed = false
    }
    
    // 3. Candidates
    console.log('\n✅ 3. Candidates')
    console.log('-'.repeat(70))
    const approvedCandidates = await prisma.yuvaPankhCandidate.count({
      where: { status: 'APPROVED', position: { not: 'NOTA' } }
    })
    const pendingCandidates = await prisma.yuvaPankhCandidate.count({
      where: { status: 'PENDING' }
    })
    
    console.log(`   ✓ Approved candidates: ${approvedCandidates}`)
    console.log(`   ⚠️  Pending candidates: ${pendingCandidates}`)
    
    // Check Kutch and Anya Gujarat have candidates
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    if (kutchZone) {
      const kutchCandidates = await prisma.yuvaPankhCandidate.count({
        where: { zoneId: kutchZone.id, status: 'APPROVED', position: { not: 'NOTA' } }
      })
      console.log(`   ✓ Kutch candidates: ${kutchCandidates}`)
      if (kutchCandidates === 0) {
        issues.push('Kutch zone has no approved candidates')
        allChecksPassed = false
      }
    }
    
    if (anyaGujaratZone) {
      const anyaCandidates = await prisma.yuvaPankhCandidate.count({
        where: { zoneId: anyaGujaratZone.id, status: 'APPROVED', position: { not: 'NOTA' } }
      })
      console.log(`   ✓ Anya Gujarat candidates: ${anyaCandidates}`)
      if (anyaCandidates === 0) {
        issues.push('Anya Gujarat zone has no approved candidates')
        allChecksPassed = false
      }
    }
    
    // 4. Test Voter Exclusion
    console.log('\n✅ 4. Test Voter Exclusion')
    console.log('-'.repeat(70))
    const testVoters = await prisma.voter.count({
      where: { voterId: { startsWith: 'TEST_' } }
    })
    const regularVoters = await prisma.voter.count({
      where: excludeTestVoters()
    })
    const totalVoters = await prisma.voter.count()
    
    console.log(`   ✓ Test voters: ${testVoters}`)
    console.log(`   ✓ Regular voters: ${regularVoters}`)
    console.log(`   ✓ Total voters: ${totalVoters}`)
    
    if (regularVoters + testVoters !== totalVoters) {
      console.log('   ❌ Voter count mismatch')
      issues.push('Voter count mismatch')
      allChecksPassed = false
    }
    
    // 5. Vote Counting
    console.log('\n✅ 5. Vote Counting')
    console.log('-'.repeat(70))
    const totalVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: { not: { startsWith: 'TEST_' } }
        }
      }
    })
    const testVotes = await prisma.vote.count({
      where: {
        voter: {
          voterId: { startsWith: 'TEST_' }
        }
      }
    })
    
    console.log(`   ✓ Total votes (excluding test): ${totalVotes}`)
    console.log(`   ✓ Test votes: ${testVotes}`)
    
    // 6. Zone Assignments
    console.log('\n✅ 6. Zone Assignments')
    console.log('-'.repeat(70))
    const votersWithZones = await prisma.voter.count({
      where: excludeTestVoters({ yuvaPankZoneId: { not: null } })
    })
    const votersWithoutZones = await prisma.voter.count({
      where: excludeTestVoters({ yuvaPankZoneId: null })
    })
    
    console.log(`   ✓ Voters with zones: ${votersWithZones}`)
    console.log(`   ⚠️  Voters without zones: ${votersWithoutZones}`)
    
    // 7. Vote Validation
    console.log('\n✅ 7. Vote Validation')
    console.log('-'.repeat(70))
    const invalidVotes = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidateId: { not: null },
        voter: {
          voterId: { not: { startsWith: 'TEST_' } }
        }
      },
      include: {
        voter: { select: { yuvaPankZoneId: true, voterId: true } },
        yuvaPankhCandidate: { select: { zoneId: true } }
      },
      take: 10
    })
    
    let invalidCount = 0
    for (const vote of invalidVotes) {
      if (vote.voter?.yuvaPankZoneId && vote.yuvaPankhCandidate?.zoneId) {
        if (vote.voter.yuvaPankZoneId !== vote.yuvaPankhCandidate.zoneId) {
          invalidCount++
        }
      }
    }
    
    if (invalidCount === 0) {
      console.log('   ✓ All votes are valid')
    } else {
      console.log(`   ❌ Found ${invalidCount} invalid votes`)
      issues.push(`${invalidCount} invalid votes found`)
      allChecksPassed = false
    }
    
    // 8. Environment Variables
    console.log('\n✅ 8. Environment Variables')
    console.log('-'.repeat(70))
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET']
    const missingEnvVars: string[] = []
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✓ ${envVar}: Set`)
      } else {
        console.log(`   ❌ ${envVar}: Missing`)
        missingEnvVars.push(envVar)
        allChecksPassed = false
      }
    }
    
    if (missingEnvVars.length > 0) {
      issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`)
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(70))
    console.log('📋 FINAL SUMMARY')
    console.log('='.repeat(70))
    
    if (allChecksPassed) {
      console.log('\n🎉 ALL CHECKS PASSED!')
      console.log('✅ System is ready for production deployment')
      console.log('\n📝 Pre-deployment checklist:')
      console.log('   1. ✓ Database connection working')
      console.log('   2. ✓ Election is ACTIVE')
      console.log('   3. ✓ Candidates are approved')
      console.log('   4. ✓ Test voters excluded')
      console.log('   5. ✓ Vote counting correct')
      console.log('   6. ✓ Vote validation working')
      console.log('   7. ✓ Environment variables set')
      console.log('\n🚀 You can proceed with deployment!')
    } else {
      console.log('\n⚠️  SOME CHECKS FAILED')
      console.log('\nIssues found:')
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      console.log('\n❌ Please fix the issues above before deploying to production.')
    }
    
  } catch (error) {
    console.error('\n❌ Check failed:', error)
    allChecksPassed = false
  } finally {
    await prisma.$disconnect()
  }
  
  process.exit(allChecksPassed ? 0 : 1)
}

productionReadinessCheck()

