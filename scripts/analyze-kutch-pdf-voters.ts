/**
 * Analyze Kutch Yuva Pankh List PDF and compare with database
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
  
  console.log(`\n📄 Parsing ${lines.length} lines from PDF...`)
  
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
    
    // Try to extract DOB if present
    const dobMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/)
    const dob = dobMatch ? dobMatch[1].replace(/-/g, '/') : null
    
    voters.push({
      name: name,
      phone: phone,
      voterId: voterId,
      dob: dob,
      rawLine: line
    })
  }
  
  // Remove duplicates based on phone number
  const uniqueVoters = voters.filter((voter, index, self) =>
    index === self.findIndex(v => v.phone === voter.phone)
  )
  
  return uniqueVoters
}

async function analyzeKutchPDF() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ANALYZING KUTCH YUVA PANKH LIST PDF')
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
    
    // Try approach 1: Direct function call (standard pdf-parse)
    if (typeof pdfParseModule === 'function') {
      data = await pdfParseModule(uint8Array)
    }
    // Try approach 2: Using PDFParse class with getText
    else if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse(uint8Array)
      await parser.load()
      const textResult = await parser.getText()
      const text = typeof textResult === 'string' ? textResult : 
                   (textResult?.text || (Array.isArray(textResult) ? textResult.join('\n') : String(textResult)))
      const numpages = parser.pages?.length || parser.numPages || 1
      data = { text, numpages }
    }
    // Try approach 3: Module might export a default function
    else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
      data = await pdfParseModule.default(dataBuffer)
    }
    else {
      throw new Error('Unable to parse PDF - pdf-parse module structure not recognized')
    }
    
    console.log(`✅ PDF extracted: ${data.numpages} pages, ${data.text.length} characters`)
    
    // Parse voters from PDF
    const pdfVoters = parseVotersFromText(data.text || '')
    console.log(`\n📊 Found ${pdfVoters.length} voters in PDF`)
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    // Get voters currently in database for Kutch zone
    const dbVoters = await prisma.voter.findMany({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      },
      select: {
        voterId: true,
        name: true,
        phone: true
      }
    })
    
    console.log(`\n📊 Database has ${dbVoters.length} voters assigned to Kutch zone`)
    
    // Create maps for comparison
    const pdfVotersByPhone = new Map<string, typeof pdfVoters[0]>()
    const pdfVotersByVoterId = new Map<string, typeof pdfVoters[0]>()
    
    pdfVoters.forEach(voter => {
      pdfVotersByPhone.set(voter.phone, voter)
      if (voter.voterId) {
        pdfVotersByVoterId.set(voter.voterId.toUpperCase(), voter)
      }
    })
    
    const dbVotersByPhone = new Map<string, typeof dbVoters[0]>()
    const dbVotersByVoterId = new Map<string, typeof dbVoters[0]>()
    
    dbVoters.forEach(voter => {
      if (voter.phone) {
        dbVotersByPhone.set(normalizePhone(voter.phone) || '', voter)
      }
      dbVotersByVoterId.set(voter.voterId.toUpperCase(), voter)
    })
    
    // Find voters in PDF but not in database
    const missingInDB: typeof pdfVoters = []
    pdfVoters.forEach(pdfVoter => {
      const foundByPhone = dbVotersByPhone.has(pdfVoter.phone)
      const foundByVoterId = pdfVoter.voterId ? dbVotersByVoterId.has(pdfVoter.voterId.toUpperCase()) : false
      
      if (!foundByPhone && !foundByVoterId) {
        missingInDB.push(pdfVoter)
      }
    })
    
    // Find voters in database but not in PDF
    const missingInPDF: typeof dbVoters = []
    dbVoters.forEach(dbVoter => {
      const dbPhone = normalizePhone(dbVoter.phone) || ''
      const foundByPhone = pdfVotersByPhone.has(dbPhone)
      const foundByVoterId = dbVoter.voterId ? pdfVotersByVoterId.has(dbVoter.voterId.toUpperCase()) : false
      
      if (!foundByPhone && !foundByVoterId) {
        missingInPDF.push(dbVoter)
      }
    })
    
    // Summary
    console.log(`\n` + '='.repeat(80))
    console.log('COMPARISON RESULTS')
    console.log('='.repeat(80))
    console.log(`\n📊 PDF Voters: ${pdfVoters.length}`)
    console.log(`📊 Database Voters (Kutch Zone): ${dbVoters.length}`)
    console.log(`\n✅ Voters in PDF and Database: ${pdfVoters.length - missingInDB.length}`)
    console.log(`❌ Voters in PDF but NOT in Database: ${missingInDB.length}`)
    console.log(`⚠️  Voters in Database but NOT in PDF: ${missingInPDF.length}`)
    
    if (missingInDB.length > 0) {
      console.log(`\n\n📋 VOTERS IN PDF BUT NOT IN DATABASE (first 20):`)
      console.log('─'.repeat(80))
      missingInDB.slice(0, 20).forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name}`)
        console.log(`      Phone: ${voter.phone}`)
        console.log(`      Voter ID: ${voter.voterId || 'N/A'}`)
        console.log('')
      })
      if (missingInDB.length > 20) {
        console.log(`   ... and ${missingInDB.length - 20} more`)
      }
    }
    
    if (missingInPDF.length > 0) {
      console.log(`\n\n📋 VOTERS IN DATABASE BUT NOT IN PDF:`)
      console.log('─'.repeat(80))
      missingInPDF.forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name} (${voter.voterId})`)
        console.log(`      Phone: ${voter.phone || 'N/A'}`)
        console.log('')
      })
    }
    
    console.log(`\n` + '='.repeat(80))
    console.log(`📊 SUMMARY:`)
    console.log(`   PDF Total: ${pdfVoters.length}`)
    console.log(`   Database Total: ${dbVoters.length}`)
    console.log(`   Missing in Database: ${missingInDB.length}`)
    console.log(`   Expected Total: ${pdfVoters.length}`)
    console.log(`   Current Total: ${dbVoters.length}`)
    console.log(`   Difference: ${pdfVoters.length - dbVoters.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeKutchPDF()

