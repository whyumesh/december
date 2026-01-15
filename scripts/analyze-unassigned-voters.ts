/**
 * Analyze unassigned voters to determine which should be in Kutch and Anya Gujarat zones
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

async function analyzeUnassignedVoters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ANALYZING UNASSIGNED VOTERS FOR KUTCH AND ANYA GUJARAT ZONES')
    console.log('='.repeat(80))
    
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
    
    // Get all unassigned active voters
    const unassignedVoters = await prisma.voter.findMany({
      where: {
        yuvaPankZoneId: null,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: true
      },
      select: {
        id: true,
        voterId: true,
        name: true,
        phone: true,
        region: true,
        email: true,
        mulgam: true
      },
      orderBy: { voterId: 'asc' }
    })
    
    console.log(`\n📊 Total unassigned active voters: ${unassignedVoters.length}\n`)
    
    // Analyze by region
    const regionStats = new Map<string, number>()
    unassignedVoters.forEach(voter => {
      const region = voter.region || 'Unknown'
      regionStats.set(region, (regionStats.get(region) || 0) + 1)
    })
    
    console.log('📋 VOTERS BY REGION:')
    console.log('─'.repeat(80))
    const sortedRegions = Array.from(regionStats.entries()).sort((a, b) => b[1] - a[1])
    sortedRegions.forEach(([region, count]) => {
      console.log(`   ${region}: ${count} voters`)
    })
    
    // Check for Kutch-related regions
    const kutchKeywords = ['kutch', 'kachchh', 'bhuj', 'mandvi', 'anjar', 'gandhidham', 'rapar', 'mundra', 'kandla']
    const anyaGujaratKeywords = ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar', 'mehsana', 'anand', 'nadiad', 'bharuch', 'valsad', 'navsari']
    
    const potentialKutchVoters: typeof unassignedVoters = []
    const potentialAnyaGujaratVoters: typeof unassignedVoters = []
    const unknownVoters: typeof unassignedVoters = []
    
    unassignedVoters.forEach(voter => {
      const regionLower = (voter.region || '').toLowerCase()
      const mulgamLower = (voter.mulgam || '').toLowerCase()
      const nameLower = (voter.name || '').toLowerCase()
      
      const searchText = `${regionLower} ${mulgamLower} ${nameLower}`
      
      // Check for Kutch
      const isKutch = kutchKeywords.some(keyword => searchText.includes(keyword))
      // Check for Anya Gujarat (but not Kutch)
      const isAnyaGujarat = !isKutch && anyaGujaratKeywords.some(keyword => searchText.includes(keyword))
      
      if (isKutch) {
        potentialKutchVoters.push(voter)
      } else if (isAnyaGujarat) {
        potentialAnyaGujaratVoters.push(voter)
      } else {
        unknownVoters.push(voter)
      }
    })
    
    console.log(`\n\n📊 ANALYSIS RESULTS:`)
    console.log('='.repeat(80))
    console.log(`\n✅ Potential Kutch Zone Voters: ${potentialKutchVoters.length}`)
    console.log(`✅ Potential Anya Gujarat Zone Voters: ${potentialAnyaGujaratVoters.length}`)
    console.log(`❓ Unknown/Other Region Voters: ${unknownVoters.length}`)
    
    // Show sample voters for Kutch
    if (potentialKutchVoters.length > 0) {
      console.log(`\n\n📋 SAMPLE KUTCH ZONE VOTERS (showing first 10):`)
      console.log('─'.repeat(80))
      potentialKutchVoters.slice(0, 10).forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name} (${voter.voterId})`)
        console.log(`      Region: ${voter.region || 'N/A'}, Mulgam: ${voter.mulgam || 'N/A'}`)
      })
      if (potentialKutchVoters.length > 10) {
        console.log(`   ... and ${potentialKutchVoters.length - 10} more`)
      }
    }
    
    // Show sample voters for Anya Gujarat
    if (potentialAnyaGujaratVoters.length > 0) {
      console.log(`\n\n📋 SAMPLE ANYA GUJARAT ZONE VOTERS (showing first 10):`)
      console.log('─'.repeat(80))
      potentialAnyaGujaratVoters.slice(0, 10).forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name} (${voter.voterId})`)
        console.log(`      Region: ${voter.region || 'N/A'}, Mulgam: ${voter.mulgam || 'N/A'}`)
      })
      if (potentialAnyaGujaratVoters.length > 10) {
        console.log(`   ... and ${potentialAnyaGujaratVoters.length - 10} more`)
      }
    }
    
    // Show regions breakdown for potential assignments
    console.log(`\n\n📊 REGION BREAKDOWN FOR POTENTIAL ASSIGNMENTS:`)
    console.log('='.repeat(80))
    
    const kutchRegions = new Map<string, number>()
    potentialKutchVoters.forEach(voter => {
      const region = voter.region || 'Unknown'
      kutchRegions.set(region, (kutchRegions.get(region) || 0) + 1)
    })
    
    const anyaGujaratRegions = new Map<string, number>()
    potentialAnyaGujaratVoters.forEach(voter => {
      const region = voter.region || 'Unknown'
      anyaGujaratRegions.set(region, (anyaGujaratRegions.get(region) || 0) + 1)
    })
    
    console.log(`\n📋 KUTCH ZONE - Voters by Region:`)
    Array.from(kutchRegions.entries()).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
      console.log(`   ${region}: ${count} voters`)
    })
    
    console.log(`\n📋 ANYA GUJARAT ZONE - Voters by Region:`)
    Array.from(anyaGujaratRegions.entries()).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
      console.log(`   ${region}: ${count} voters`)
    })
    
    // Summary
    console.log(`\n\n` + '='.repeat(80))
    console.log(`📊 SUMMARY:`)
    console.log('='.repeat(80))
    console.log(`   Total Unassigned Voters: ${unassignedVoters.length}`)
    console.log(`   Recommended for Kutch Zone: ${potentialKutchVoters.length}`)
    console.log(`   Recommended for Anya Gujarat Zone: ${potentialAnyaGujaratVoters.length}`)
    console.log(`   Need Manual Review: ${unknownVoters.length}`)
    console.log(`\n   ✅ Total that can be assigned: ${potentialKutchVoters.length + potentialAnyaGujaratVoters.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeUnassignedVoters()

