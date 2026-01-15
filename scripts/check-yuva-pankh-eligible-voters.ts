/**
 * Check total Yuva Pankh eligible voters (age 18-39) in Kutch and Anya Gujarat zones
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

// Helper function to calculate age as of Aug 31, 2025 (eligibility cutoff)
function calculateAgeAsOf(dob: Date | string | null | undefined, referenceDate: Date): number | null {
  if (!dob) return null
  
  try {
    let birthDate: Date
    
    if (dob instanceof Date) {
      birthDate = dob
      if (isNaN(birthDate.getTime())) return null
    } else if (typeof dob === 'string') {
      // Handle DD/MM/YYYY format
      const parts = dob.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parseInt(parts[2], 10)
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day > 0 && day <= 31 && month >= 0 && month <= 11) {
          birthDate = new Date(year, month, day)
          if (birthDate.getDate() !== day || birthDate.getMonth() !== month || birthDate.getFullYear() !== year) {
            return null
          }
        } else {
          return null
        }
      } else if (dob.includes('-')) {
        birthDate = new Date(dob)
        if (isNaN(birthDate.getTime())) return null
      } else {
        return null
      }
    } else {
      return null
    }
    
    if (birthDate > referenceDate) return null
    
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

// Check if eligible for Yuva Pankh (18-39 as of Aug 31, 2025)
function isEligibleForYuvaPankh(dob: Date | string | null | undefined, age: number | null | undefined): boolean {
  const cutoffDate = new Date('2025-08-31T23:59:59')
  
  let calculatedAge: number | null = null
  
  if (dob) {
    calculatedAge = calculateAgeAsOf(dob, cutoffDate)
  } else if (age !== null && age !== undefined) {
    // Use stored age as fallback
    calculatedAge = age
  }
  
  return calculatedAge !== null && calculatedAge >= 18 && calculatedAge <= 39
}

async function checkYuvaPankhEligibleVoters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('YUVA PANKH ELIGIBLE VOTERS FOR KUTCH AND ANYA GUJARAT ZONES')
    console.log('(Age 18-39 as of August 31, 2025)')
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
    
    // Get currently assigned voters
    const kutchAssignedVoters = await prisma.voter.findMany({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: true
      },
      include: {
        user: {
          select: {
            dateOfBirth: true
          }
        }
      }
    })
    
    const anyaGujaratAssignedVoters = await prisma.voter.findMany({
      where: {
        yuvaPankZoneId: anyaGujaratZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        },
        isActive: true
      },
      include: {
        user: {
          select: {
            dateOfBirth: true
          }
        }
      }
    })
    
    // Filter for Yuva Pankh eligibility
    const kutchEligibleAssigned = kutchAssignedVoters.filter(voter => {
      const dob = voter.user?.dateOfBirth || voter.dob
      return isEligibleForYuvaPankh(dob, voter.age)
    })
    
    const anyaGujaratEligibleAssigned = anyaGujaratAssignedVoters.filter(voter => {
      const dob = voter.user?.dateOfBirth || voter.dob
      return isEligibleForYuvaPankh(dob, voter.age)
    })
    
    // Get unassigned voters who should be in these zones
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
      include: {
        user: {
          select: {
            dateOfBirth: true
          }
        }
      }
    })
    
    // Keywords for zone assignment
    const kutchKeywords = ['kutch', 'kachchh', 'bhuj', 'mandvi', 'anjar', 'gandhidham', 'rapar', 'mundra', 'kandla']
    const anyaGujaratKeywords = ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar', 'mehsana', 'anand', 'nadiad', 'bharuch', 'valsad', 'navsari']
    
    const potentialKutchVoters: typeof unassignedVoters = []
    const potentialAnyaGujaratVoters: typeof unassignedVoters = []
    
    unassignedVoters.forEach(voter => {
      const regionLower = (voter.region || '').toLowerCase()
      const mulgamLower = (voter.mulgam || '').toLowerCase()
      const nameLower = (voter.name || '').toLowerCase()
      
      const searchText = `${regionLower} ${mulgamLower} ${nameLower}`
      
      const isKutch = kutchKeywords.some(keyword => searchText.includes(keyword))
      const isAnyaGujarat = !isKutch && anyaGujaratKeywords.some(keyword => searchText.includes(keyword))
      
      if (isKutch) {
        potentialKutchVoters.push(voter)
      } else if (isAnyaGujarat) {
        potentialAnyaGujaratVoters.push(voter)
      }
    })
    
    // Filter for Yuva Pankh eligibility
    const kutchEligibleUnassigned = potentialKutchVoters.filter(voter => {
      const dob = voter.user?.dateOfBirth || voter.dob
      return isEligibleForYuvaPankh(dob, voter.age)
    })
    
    const anyaGujaratEligibleUnassigned = potentialAnyaGujaratVoters.filter(voter => {
      const dob = voter.user?.dateOfBirth || voter.dob
      return isEligibleForYuvaPankh(dob, voter.age)
    })
    
    // Calculate totals
    const kutchTotalEligible = kutchEligibleAssigned.length + kutchEligibleUnassigned.length
    const anyaGujaratTotalEligible = anyaGujaratEligibleAssigned.length + anyaGujaratEligibleUnassigned.length
    const grandTotal = kutchTotalEligible + anyaGujaratTotalEligible
    
    console.log(`\n📊 KUTCH ZONE:`)
    console.log(`   Currently Assigned & Eligible: ${kutchEligibleAssigned.length}`)
    console.log(`   Unassigned but Should Be Assigned & Eligible: ${kutchEligibleUnassigned.length}`)
    console.log(`   ✅ Total Yuva Pankh Eligible Voters: ${kutchTotalEligible}`)
    
    console.log(`\n📊 ANYA GUJARAT ZONE:`)
    console.log(`   Currently Assigned & Eligible: ${anyaGujaratEligibleAssigned.length}`)
    console.log(`   Unassigned but Should Be Assigned & Eligible: ${anyaGujaratEligibleUnassigned.length}`)
    console.log(`   ✅ Total Yuva Pankh Eligible Voters: ${anyaGujaratTotalEligible}`)
    
    console.log(`\n` + '='.repeat(80))
    console.log(`📊 TOTAL YUVA PANKH ELIGIBLE VOTERS:`)
    console.log(`   Kutch Zone: ${kutchTotalEligible}`)
    console.log(`   Anya Gujarat Zone: ${anyaGujaratTotalEligible}`)
    console.log(`   ✅ GRAND TOTAL: ${grandTotal} voters`)
    console.log('='.repeat(80))
    
    // Show breakdown by region
    console.log(`\n\n📋 BREAKDOWN BY REGION:`)
    console.log('='.repeat(80))
    
    const kutchRegions = new Map<string, number>()
    kutchEligibleUnassigned.forEach(voter => {
      const region = voter.region || 'Unknown'
      kutchRegions.set(region, (kutchRegions.get(region) || 0) + 1)
    })
    
    const anyaGujaratRegions = new Map<string, number>()
    anyaGujaratEligibleUnassigned.forEach(voter => {
      const region = voter.region || 'Unknown'
      anyaGujaratRegions.set(region, (anyaGujaratRegions.get(region) || 0) + 1)
    })
    
    console.log(`\n📋 KUTCH ZONE - Eligible Unassigned Voters by Region:`)
    Array.from(kutchRegions.entries()).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
      console.log(`   ${region}: ${count} voters`)
    })
    
    console.log(`\n📋 ANYA GUJARAT ZONE - Eligible Unassigned Voters by Region:`)
    Array.from(anyaGujaratRegions.entries()).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
      console.log(`   ${region}: ${count} voters`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkYuvaPankhEligibleVoters()

