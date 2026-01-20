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
  
  const votersMissingYuvaPank = await prisma.voter.count({
    where: {
      voterId: { not: { startsWith: 'TEST_' } },
      age: { gte: 18, lte: 39 },
      yuvaPankZoneId: null
    }
  })
  
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
      age: { gte: 18, lte: 39 },
      yuvaPankZoneId: null
    },
    take: 5,
    select: {
      voterId: true,
      name: true,
      region: true,
      age: true
    }
  })
  
  if (missingYuvaPank.length > 0) {
    console.log(`\n   Missing Yuva Pank Zone (showing first ${missingYuvaPank.length}):`)
    missingYuvaPank.forEach(v => {
      console.log(`      - ${v.voterId}: ${v.name} (${v.region}, age ${v.age})`)
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
    include: {
      yuvaPankZone: { select: { code: true, name: true } },
      karobariZone: { select: { code: true, name: true } },
      trusteeZone: { select: { code: true, name: true } }
    },
    take: 10
  })
  
  if (abdasaGardaVoters.length > 0) {
    console.log(`\n   Found ${abdasaGardaVoters.length} sample voters from "Abdasa & Garda":`)
    abdasaGardaVoters.forEach(v => {
      console.log(`\n   📌 ${v.voterId}: ${v.name}`)
      console.log(`      Age: ${v.age || 'N/A'}`)
      console.log(`      Yuva Pank Zone: ${v.yuvaPankZone ? v.yuvaPankZone.name : '❌ Missing'}`)
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

