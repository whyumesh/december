import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

// Load environment variables from .env.local
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

// Map region names to zone codes (matching the upload route and other scripts)
const regionToZoneMapping: Record<string, {
  yuvaPank: string | null
  karobari: string | null
  trustee: string | null
}> = {
  'Mumbai': {
    yuvaPank: 'MUMBAI',
    karobari: 'MUMBAI',
    trustee: 'MUMBAI'
  },
  'Raigad': {
    yuvaPank: 'RAIGAD',
    karobari: 'RAIGAD',
    trustee: 'RAIGAD'
  },
  'Karnataka & Goa': {
    yuvaPank: 'KARNATAKA_GOA',
    karobari: 'KARNATAKA_GOA',
    trustee: 'KARNATAKA_GOA'
  },
  'Karnataka': {
    yuvaPank: 'KARNATAKA_GOA',
    karobari: 'KARNATAKA_GOA',
    trustee: 'KARNATAKA_GOA'
  },
  'Karnataka-Goa': {
    yuvaPank: 'KARNATAKA_GOA',
    karobari: 'KARNATAKA_GOA',
    trustee: 'KARNATAKA_GOA'
  },
  'Kutch': {
    yuvaPank: 'KUTCH',
    karobari: 'KUTCH',
    trustee: 'KUTCH'
  },
  'Bhuj': {
    yuvaPank: 'BHUJ_ANJAR',
    karobari: 'BHUJ',
    trustee: 'BHUJ'
  },
  'Anjar': {
    yuvaPank: 'BHUJ_ANJAR',
    karobari: 'ANJAR',
    trustee: 'ANJAR_ANYA_GUJARAT'
  },
  'Abdasa': {
    yuvaPank: 'KUTCH',
    karobari: 'ABDASA',
    trustee: 'ABDASA_GARDA'
  },
  'Garda': {
    yuvaPank: 'KUTCH',
    karobari: 'GARADA',
    trustee: 'ABDASA_GARDA'
  },
  'Abdasa & Garda': {
    yuvaPank: 'KUTCH',
    karobari: 'ABDASA', // Using ABDASA as the Karobari zone for Abdasa & Garda
    trustee: 'ABDASA_GARDA'
  },
  'Anya Gujarat': {
    yuvaPank: 'ANYA_GUJARAT',
    karobari: 'ANYA_GUJARAT',
    trustee: 'ANJAR_ANYA_GUJARAT'
  }
}

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

async function findZoneId(code: string | null, electionType: string): Promise<string | null> {
  if (!code) return null
  
  const zone = await prisma.zone.findFirst({
    where: {
      code: code,
      electionType: electionType
    }
  })
  
  return zone?.id || null
}

async function fixVoterZones() {
  console.log('🔧 Starting voter zone reassignment...\n')
  
  // Get all voters with DOB for accurate age calculation
  const voters = await prisma.voter.findMany({
    select: {
      id: true,
      name: true,
      region: true,
      age: true,
      dob: true, // Include DOB for accurate age calculation
      yuvaPankZoneId: true,
      karobariZoneId: true,
      trusteeZoneId: true,
    }
  })
  
  console.log(`📊 Found ${voters.length} voters to process\n`)
  
  let updated = 0
  let skipped = 0
  let errors = 0
  
  for (const voter of voters) {
    try {
      // Normalize region name
      let region = voter.region?.trim() || ''
      
      // Handle common variations
      if (region === 'Karnataka-Goa') {
        region = 'Karnataka & Goa'
      }
      
      // Find matching zone mapping
      const mapping = regionToZoneMapping[region] || 
                     regionToZoneMapping[region.replace(/&/g, 'and')] ||
                     regionToZoneMapping[region.replace(/and/g, '&')] ||
                     null
      
      if (!mapping) {
        console.log(`⚠️  Skipping ${voter.name}: Unknown region "${region}"`)
        skipped++
        continue
      }
      
      // Calculate age as of August 31, 2025 for Yuva Pankh eligibility
      const cutoffDate = new Date('2025-08-31T23:59:59')
      let ageAsOfCutoff: number | null = null
      
      if (voter.dob) {
        ageAsOfCutoff = calculateAgeAsOf(voter.dob, cutoffDate)
      }
      
      // Fallback to stored age if DOB is not available
      const age = ageAsOfCutoff !== null ? ageAsOfCutoff : (voter.age || 25)
      
      // For Yuva Pankh: use age as of Aug 31, 2025 (must be 18-39)
      // For Karobari and Trustee: use age (must be 18+)
      const isEligibleForYuvaPankh = ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39
      
      // Find zones
      const yuvaPankZoneId = (isEligibleForYuvaPankh && mapping.yuvaPank) 
        ? await findZoneId(mapping.yuvaPank, 'YUVA_PANK')
        : null
      
      const karobariZoneId = (age >= 18)
        ? await findZoneId(mapping.karobari, 'KAROBARI_MEMBERS')
        : null
      
      const trusteeZoneId = (age >= 18)
        ? await findZoneId(mapping.trustee, 'TRUSTEES')
        : null
      
      // Check if zones need to be updated
      const needsUpdate = 
        voter.yuvaPankZoneId !== yuvaPankZoneId ||
        voter.karobariZoneId !== karobariZoneId ||
        voter.trusteeZoneId !== trusteeZoneId
      
      if (needsUpdate) {
        await prisma.voter.update({
          where: { id: voter.id },
          data: {
            yuvaPankZoneId: yuvaPankZoneId,
            karobariZoneId: karobariZoneId,
            trusteeZoneId: trusteeZoneId,
            // Also update zoneId for backward compatibility (use trustee as primary)
            zoneId: trusteeZoneId || karobariZoneId || yuvaPankZoneId
          }
        })
        
        updated++
        if (updated % 50 === 0) {
          console.log(`  ✓ Updated ${updated} voters...`)
        }
      } else {
        skipped++
      }
    } catch (error: any) {
      console.error(`  ✗ Error updating ${voter.name}: ${error.message}`)
      errors++
    }
  }
  
  console.log(`\n✅ Zone reassignment complete!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped (no changes needed): ${skipped}`)
  console.log(`   Errors: ${errors}`)
  
  // Show summary by region
  console.log(`\n📊 Summary by region:`)
  const regionCounts: Record<string, number> = {}
  for (const voter of voters) {
    const region = voter.region || 'Unknown'
    regionCounts[region] = (regionCounts[region] || 0) + 1
  }
  
  for (const [region, count] of Object.entries(regionCounts)) {
    console.log(`   ${region}: ${count} voters`)
  }
}

fixVoterZones()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

