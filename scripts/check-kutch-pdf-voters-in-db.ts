/**
 * Check if voters from Kutch PDF exist in database but are unassigned or assigned to wrong zone
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createRequire } from 'module'

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

// Helper function to normalize phone number
function normalizePhone(phone: any): string | null {
  if (!phone) return null
  const cleaned = phone.toString().replace(/\D/g, '')
  if (cleaned.length === 10) return cleaned
  if (cleaned.length === 11 && cleaned.startsWith('0')) return cleaned.substring(1)
  if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.substring(2)
  return cleaned.length === 10 ? cleaned : null
}

// Parse voter data from PDF text
function parseVotersFromText(text: string): any[] {
  const voters: any[] = []
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Skip header lines
    if (line.match(/^(sr|s\.?no|sl\.?no|serial|name|phone|mobile|dob|date|gender|age|address|voter|vid)/i)) {
      continue
    }
    
    // Skip page numbers and footers
    if (line.match(/^(page|\d+\s*$)/i)) {
      continue
    }
    
    // Try to extract phone number (10 digits)
    const phoneMatch = line.match(/(\d{10})/)
    if (!phoneMatch) continue
    
    const phone = normalizePhone(phoneMatch[1])
    if (!phone) continue
    
    // Try to extract name (text before phone, clean it up)
    const phoneIndex = line.indexOf(phoneMatch[1])
    let name = line.substring(0, phoneIndex).trim()
    
    // Clean up name - remove common prefixes and extra spaces
    name = name
      .replace(/^(mr|mrs|miss|ms|dr|prof|shri|shrimati)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Skip if name is too short
    if (name.length < 3) continue
    
    // Try to extract VID if present (VID-XXXX format)
    const vidMatch = line.match(/VID[-\s]?(\d+)/i)
    const voterId = vidMatch ? `VID-${vidMatch[1]}` : null
    
    voters.push({
      name: name,
      phone: phone,
      voterId: voterId,
      rawLine: line
    })
  }
  
  // Remove duplicates based on phone number
  const uniqueVoters = voters.filter((voter, index, self) =>
    index === self.findIndex(v => v.phone === voter.phone)
  )
  
  return uniqueVoters
}

async function checkKutchPDFVotersInDB() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('CHECKING KUTCH PDF VOTERS IN DATABASE')
    console.log('='.repeat(80))
    
    const pdfPath = join(process.cwd(), 'Kutch Yuva Pakh List.pdf')
    
    if (!existsSync(pdfPath)) {
      console.log(`❌ PDF file not found: ${pdfPath}`)
      return
    }
    
    console.log(`\n📄 Reading PDF: ${pdfPath}`)
    
    // Parse PDF
    const require = createRequire(import.meta.url)
    const pdfParseModule = require('pdf-parse')
    
    const dataBuffer = readFileSync(pdfPath)
    const uint8Array = new Uint8Array(dataBuffer)
    let data: any
    
    if (typeof pdfParseModule === 'function') {
      data = await pdfParseModule(uint8Array)
    } else if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse(uint8Array)
      await parser.load()
      const textResult = await parser.getText()
      const text = typeof textResult === 'string' ? textResult : 
                   (textResult?.text || (Array.isArray(textResult) ? textResult.join('\n') : String(textResult)))
      const numpages = parser.pages?.length || parser.numPages || 1
      data = { text, numpages }
    } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
      data = await pdfParseModule.default(dataBuffer)
    } else {
      throw new Error('Unable to parse PDF')
    }
    
    console.log(`✅ PDF extracted: ${data.numpages} pages`)
    
    // Parse voters from PDF
    const pdfVoters = parseVotersFromText(data.text || '')
    console.log(`📊 Found ${pdfVoters.length} voters in PDF`)
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    console.log(`\n🔍 Checking database for PDF voters...`)
    
    // Check each PDF voter in database
    const foundByVoterId: any[] = []
    const foundByPhone: any[] = []
    const notFound: any[] = []
    const wrongZone: any[] = []
    const unassigned: any[] = []
    
    for (const pdfVoter of pdfVoters) {
      let dbVoter = null
      
      // Try to find by Voter ID first
      if (pdfVoter.voterId) {
        dbVoter = await prisma.voter.findFirst({
          where: {
            voterId: pdfVoter.voterId.toUpperCase()
          },
          include: {
            yuvaPankZone: true
          }
        })
        
        if (dbVoter) {
          if (dbVoter.yuvaPankZoneId === kutchZone.id) {
            foundByVoterId.push({ pdfVoter, dbVoter, matchType: 'voterId', status: 'correct' })
          } else if (dbVoter.yuvaPankZoneId === null) {
            unassigned.push({ pdfVoter, dbVoter, matchType: 'voterId' })
          } else {
            wrongZone.push({ pdfVoter, dbVoter, matchType: 'voterId', currentZone: dbVoter.yuvaPankZone })
          }
          continue
        }
      }
      
      // Try to find by phone
      const normalizedPhone = normalizePhone(pdfVoter.phone)
      if (normalizedPhone) {
        dbVoter = await prisma.voter.findFirst({
          where: {
            phone: normalizedPhone
          },
          include: {
            yuvaPankZone: true
          }
        })
        
        if (dbVoter) {
          if (dbVoter.yuvaPankZoneId === kutchZone.id) {
            foundByPhone.push({ pdfVoter, dbVoter, matchType: 'phone', status: 'correct' })
          } else if (dbVoter.yuvaPankZoneId === null) {
            unassigned.push({ pdfVoter, dbVoter, matchType: 'phone' })
          } else {
            wrongZone.push({ pdfVoter, dbVoter, matchType: 'phone', currentZone: dbVoter.yuvaPankZone })
          }
          continue
        }
      }
      
      // Not found
      notFound.push(pdfVoter)
    }
    
    // Summary
    console.log(`\n` + '='.repeat(80))
    console.log('RESULTS')
    console.log('='.repeat(80))
    console.log(`\n✅ Correctly assigned to Kutch (by Voter ID): ${foundByVoterId.length}`)
    console.log(`✅ Correctly assigned to Kutch (by Phone): ${foundByPhone.length}`)
    console.log(`⚠️  Found but UNASSIGNED (no zone): ${unassigned.length}`)
    console.log(`⚠️  Found but WRONG ZONE: ${wrongZone.length}`)
    console.log(`❌ NOT FOUND in database: ${notFound.length}`)
    
    const totalFound = foundByVoterId.length + foundByPhone.length + unassigned.length + wrongZone.length
    console.log(`\n📊 Total found in database: ${totalFound} / ${pdfVoters.length}`)
    console.log(`📊 Total correctly assigned: ${foundByVoterId.length + foundByPhone.length}`)
    console.log(`📊 Total needing assignment: ${unassigned.length + wrongZone.length}`)
    
    if (unassigned.length > 0) {
      console.log(`\n\n📋 UNASSIGNED VOTERS (first 10):`)
      console.log('─'.repeat(80))
      unassigned.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.pdfVoter.name} (${item.pdfVoter.voterId || 'N/A'})`)
        console.log(`      Phone: ${item.pdfVoter.phone}`)
        console.log(`      DB Voter ID: ${item.dbVoter.voterId}`)
        console.log(`      Match by: ${item.matchType}`)
        console.log('')
      })
      if (unassigned.length > 10) {
        console.log(`   ... and ${unassigned.length - 10} more`)
      }
    }
    
    if (wrongZone.length > 0) {
      console.log(`\n\n📋 WRONG ZONE VOTERS (first 10):`)
      console.log('─'.repeat(80))
      wrongZone.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.pdfVoter.name} (${item.pdfVoter.voterId || 'N/A'})`)
        console.log(`      Phone: ${item.pdfVoter.phone}`)
        console.log(`      Current Zone: ${item.currentZone?.name || 'Unknown'} (${item.currentZone?.code || 'N/A'})`)
        console.log(`      Should be: Kutch`)
        console.log('')
      })
      if (wrongZone.length > 10) {
        console.log(`   ... and ${wrongZone.length - 10} more`)
      }
    }
    
    if (notFound.length > 0) {
      console.log(`\n\n📋 NOT FOUND IN DATABASE (first 10):`)
      console.log('─'.repeat(80))
      notFound.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}`)
        console.log(`      Phone: ${item.phone}`)
        console.log(`      Voter ID: ${item.voterId || 'N/A'}`)
        console.log('')
      })
      if (notFound.length > 10) {
        console.log(`   ... and ${notFound.length - 10} more`)
      }
    }
    
    console.log(`\n` + '='.repeat(80))
    console.log(`📊 SUMMARY:`)
    console.log(`   PDF Total: ${pdfVoters.length}`)
    console.log(`   Correctly Assigned: ${foundByVoterId.length + foundByPhone.length}`)
    console.log(`   Unassigned: ${unassigned.length}`)
    console.log(`   Wrong Zone: ${wrongZone.length}`)
    console.log(`   Not Found: ${notFound.length}`)
    console.log(`   Need Assignment: ${unassigned.length + wrongZone.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkKutchPDFVotersInDB()

