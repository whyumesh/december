/**
 * Update Kutch zone seats to 1 (1 seat is pre-declared, so only 1 available for voting)
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

async function updateKutchZoneSeats() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('UPDATING KUTCH ZONE SEATS')
    console.log('='.repeat(80))
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    console.log(`\n📊 Current Kutch Zone Configuration:`)
    console.log(`   Zone Name: ${kutchZone.name}`)
    console.log(`   Zone Code: ${kutchZone.code}`)
    console.log(`   Current Seats: ${kutchZone.seats}`)
    
    // Update seats to 1 (1 seat available for voting, 1 pre-declared)
    if (kutchZone.seats !== 1) {
      await prisma.zone.update({
        where: { id: kutchZone.id },
        data: { seats: 1 }
      })
      
      console.log(`\n✅ Updated Kutch zone seats from ${kutchZone.seats} to 1`)
      console.log(`   (1 seat available for voting, 1 seat pre-declared)`)
    } else {
      console.log(`\n✅ Kutch zone already has 1 seat configured`)
    }
    
    // Verify update
    const updatedZone = await prisma.zone.findFirst({
      where: { id: kutchZone.id }
    })
    
    console.log(`\n📊 Updated Configuration:`)
    console.log(`   Zone Name: ${updatedZone?.name}`)
    console.log(`   Zone Code: ${updatedZone?.code}`)
    console.log(`   Seats: ${updatedZone?.seats}`)
    
    // Get candidate count
    const candidateCount = await prisma.yuvaPankhCandidate.count({
      where: {
        zoneId: kutchZone.id,
        status: 'APPROVED'
      }
    })
    
    console.log(`\n📊 Candidates:`)
    console.log(`   Approved Candidates: ${candidateCount}`)
    console.log(`   Available Seats for Voting: ${updatedZone?.seats}`)
    console.log(`   Pre-declared Seats: ${candidateCount - (updatedZone?.seats || 0)}`)
    
    console.log(`\n` + '='.repeat(80))
    console.log('UPDATE COMPLETE')
    console.log('='.repeat(80))
    console.log(`✅ Voters in Kutch zone can now vote for 1 candidate only`)
    console.log(`✅ The voting system will enforce this limit automatically`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateKutchZoneSeats()

