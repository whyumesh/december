import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

// Load environment variables
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const prisma = new PrismaClient()

// Helper function to calculate age as of a specific date from DOB
function calculateAgeAsOf(dob: string | null, referenceDate: Date): number | null {
  if (!dob) return null
  
  try {
    // Handle DD/MM/YYYY format
    const parts = dob.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10)
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    
    const birthDate = new Date(year, month, day)
    if (birthDate.getDate() !== day || birthDate.getMonth() !== month || birthDate.getFullYear() !== year) {
      return null
    }
    
    let age = referenceDate.getFullYear() - birthDate.getFullYear()
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  } catch {
    return null
  }
}

async function checkZoneAssignments() {
  console.log('🔍 Checking Voter Zone Assignments\n')
  console.log('='.repeat(80))
  
  // Get statistics
  const totalVoters = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } }
    }
  })
  
  const votersWithYuvaPank = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      yuvaPankZoneId: { not: null }
    }
  })
  
  const votersWithKarobari = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      karobariZoneId: { not: null }
    }
  })
  
  const votersWithTrustee = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      trusteeZoneId: { not: null }
    }
  })
  
  // Calculate missing Yuva Pank voters based on age as of Aug 31, 2025
  const cutoffDate = new Date('2025-08-31T23:59:59')
  const allVotersForYuvaPank = await prisma.voter.findMany({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      yuvaPankZoneId: null,
      dob: { not: null }
    },
    select: {
      dob: true
    }
  })
  
  const votersMissingYuvaPank = allVotersForYuvaPank.filter(v => {
    const ageAsOfCutoff = calculateAgeAsOf(v.dob, cutoffDate)
    return ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39
  }).length
  
  const votersMissingKarobari = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      age: { gte: 18 },
      karobariZoneId: null
    }
  })
  
  const votersMissingTrustee = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      age: { gte: 18 },
      trusteeZoneId: null
    }
  })
  
  console.log(`\n📊 Overall Statistics:`)
  console.log(`   Total voters (excluding test): ${totalVoters}`)
  console.log(`\n   ✅ Voters with Yuva Pank Zone: ${votersWithYuvaPank}`)
  console.log(`   ✅ Voters with Karobari Zone: ${votersWithKarobari}`)
  console.log(`   ✅ Voters with Trustee Zone: ${votersWithTrustee}`)
  
  if (votersMissingYuvaPank > 0 || votersMissingKarobari > 0 || votersMissingTrustee > 0) {
    console.log(`\n   ⚠️  Missing Assignments:`)
    if (votersMissingYuvaPank > 0) {
      console.log(`      - ${votersMissingYuvaPank} eligible voters missing Yuva Pank Zone`)
    }
    if (votersMissingKarobari > 0) {
      console.log(`      - ${votersMissingKarobari} eligible voters missing Karobari Zone`)
    }
    if (votersMissingTrustee > 0) {
      console.log(`      - ${votersMissingTrustee} eligible voters missing Trustee Zone`)
    }
  }
  
  // Check by region
  console.log(`\n📋 Zone Assignments by Region:`)
  console.log('-'.repeat(80))
  
  const regions = await prisma.voter.groupBy({
    by: ['region'],
    where: {
      voterId: { not: { startsWith: 'TEST_' } }
    },
    _count: true
  })
  
  for (const regionData of regions.sort((a, b) => (a.region || '').localeCompare(b.region || ''))) {
    const region = regionData.region || 'Unknown'
    const count = regionData._count
    
    const withYuvaPank = await prisma.voter.count({
      where: {
        region: region,
        voterId: { not: { startsWith: 'TEST_' } },
        yuvaPankZoneId: { not: null }
      }
    })
    
    const withKarobari = await prisma.voter.count({
      where: {
        region: region,
        voterId: { not: { startsWith: 'TEST_' } },
        karobariZoneId: { not: null }
      }
    })
    
    const withTrustee = await prisma.voter.count({
      where: {
        region: region,
        voterId: { not: { startsWith: 'TEST_' } },
        trusteeZoneId: { not: null }
      }
    })
    
    console.log(`\n📍 ${region}: ${count} voters`)
    console.log(`   Yuva Pank: ${withYuvaPank}/${count} (${Math.round(withYuvaPank/count*100)}%)`)
    console.log(`   Karobari:  ${withKarobari}/${count} (${Math.round(withKarobari/count*100)}%)`)
    console.log(`   Trustee:   ${withTrustee}/${count} (${Math.round(withTrustee/count*100)}%)`)
  }
  
  // Show sample voters with missing zones
  console.log(`\n\n🔍 Sample Voters Missing Zones:`)
  console.log('-'.repeat(80))
  
  const missingKarobari = await prisma.voter.findMany({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      age: { gte: 18 },
      karobariZoneId: null
    },
    take: 5,
    select: {
      voterId: true,
      name: true,
      region: true,
      age: true
    }
  })
  
  if (missingKarobari.length > 0) {
    console.log(`\n   Missing Karobari Zone (showing first ${missingKarobari.length}):`)
    missingKarobari.forEach(v => {
      console.log(`      - ${v.voterId}: ${v.name} (${v.region}, age ${v.age})`)
    })
  }
  
  const missingYuvaPank = await prisma.voter.findMany({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      yuvaPankZoneId: null,
      dob: { not: null }
    },
    select: {
      voterId: true,
      name: true,
      region: true,
      age: true,
      dob: true
    }
  })
  
  // Filter by age as of Aug 31, 2025
  const eligibleMissingYuvaPank = missingYuvaPank.filter(v => {
    const ageAsOfCutoff = calculateAgeAsOf(v.dob, cutoffDate)
    return ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39
  }).slice(0, 5)
  
  if (eligibleMissingYuvaPank.length > 0) {
    console.log(`\n   Missing Yuva Pank Zone (age 18-39 as of Aug 31, 2025, showing first ${eligibleMissingYuvaPank.length}):`)
    eligibleMissingYuvaPank.forEach(v => {
      const ageAsOfCutoff = calculateAgeAsOf(v.dob, cutoffDate)
      console.log(`      - ${v.voterId}: ${v.name} (${v.region}, age ${v.age}, age as of Aug 31, 2025: ${ageAsOfCutoff})`)
    })
  }
  
  // Check specific "Abdasa & Garda" region
  console.log(`\n\n🎯 Specific Check: "Abdasa & Garda" Region:`)
  console.log('-'.repeat(80))
  
  const abdasaGardaVoters = await prisma.voter.findMany({
    where: {
      region: 'Abdasa & Garda',
      voterId: { not: { startsWith: 'TEST_' } }
    },
    select: {
      voterId: true,
      name: true,
      age: true,
      dob: true,
      region: true,
      yuvaPankZone: { select: { code: true, name: true } },
      karobariZone: { select: { code: true, name: true } },
      trusteeZone: { select: { code: true, name: true } }
    },
    take: 10
  })
  
  if (abdasaGardaVoters.length > 0) {
    console.log(`\n   Found ${abdasaGardaVoters.length} sample voters from "Abdasa & Garda":`)
    abdasaGardaVoters.forEach(v => {
      const ageAsOfCutoff = v.dob ? calculateAgeAsOf(v.dob, cutoffDate) : null
      const ageDisplay = ageAsOfCutoff !== null 
        ? `${v.age || 'N/A'} (age as of Aug 31, 2025: ${ageAsOfCutoff})`
        : (v.age || 'N/A')
      
      console.log(`\n   📌 ${v.voterId}: ${v.name}`)
      console.log(`      Age: ${ageDisplay}`)
      console.log(`      DOB: ${v.dob || 'N/A'}`)
      console.log(`      Yuva Pank Zone: ${v.yuvaPankZone ? v.yuvaPankZone.name : '❌ Missing'} ${ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39 ? '(eligible)' : ageAsOfCutoff !== null ? '(not eligible - age)' : ''}`)
      console.log(`      Karobari Zone: ${v.karobariZone ? v.karobariZone.name : '❌ Missing'}`)
      console.log(`      Trustee Zone: ${v.trusteeZone ? v.trusteeZone.name : '❌ Missing'}`)
    })
  }
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('✅ Validation Complete!\n')
}

checkZoneAssignments()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

