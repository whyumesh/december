/**
 * Analyze updated Kutch Yuva Pankh List PDF and compare with database
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

async function analyzeUpdatedKutchPDF() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ANALYZING UPDATED KUTCH YUVA PANKH LIST PDF')
    console.log('='.repeat(80))
    
    const pdfPath = join(process.cwd(), 'Kutch Yuva Pankh List updated.pdf')
    
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
    
    console.log(`✅ PDF extracted: ${data.numpages} pages, ${data.text.length} characters`)
    
    // Parse voters from PDF
    const pdfVoters = parseVotersFromText(data.text || '')
    console.log(`📊 Found ${pdfVoters.length} voters in updated PDF`)
    
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
    
    console.log(`\n📊 Database currently has ${dbVoters.length} voters assigned to Kutch zone`)
    
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
    
    // Find voters in PDF but not in database (need to be assigned)
    const needAssignment: typeof pdfVoters = []
    pdfVoters.forEach(pdfVoter => {
      const foundByPhone = dbVotersByPhone.has(pdfVoter.phone)
      const foundByVoterId = pdfVoter.voterId ? dbVotersByVoterId.has(pdfVoter.voterId.toUpperCase()) : false
      
      if (!foundByPhone && !foundByVoterId) {
        needAssignment.push(pdfVoter)
      }
    })
    
    // Find voters in database but not in PDF (should be removed from Kutch zone)
    const shouldRemove: typeof dbVoters = []
    dbVoters.forEach(dbVoter => {
      const dbPhone = normalizePhone(dbVoter.phone) || ''
      const foundByPhone = pdfVotersByPhone.has(dbPhone)
      const foundByVoterId = dbVoter.voterId ? pdfVotersByVoterId.has(dbVoter.voterId.toUpperCase()) : false
      
      if (!foundByPhone && !foundByVoterId) {
        shouldRemove.push(dbVoter)
      }
    })
    
    // Find voters in both (already correctly assigned)
    const alreadyAssigned = pdfVoters.filter(pdfVoter => {
      const foundByPhone = dbVotersByPhone.has(pdfVoter.phone)
      const foundByVoterId = pdfVoter.voterId ? dbVotersByVoterId.has(pdfVoter.voterId.toUpperCase()) : false
      return foundByPhone || foundByVoterId
    })
    
    // Summary
    console.log(`\n` + '='.repeat(80))
    console.log('COMPARISON RESULTS')
    console.log('='.repeat(80))
    console.log(`\n📊 Updated PDF Voters: ${pdfVoters.length}`)
    console.log(`📊 Current Database Voters (Kutch Zone): ${dbVoters.length}`)
    console.log(`\n✅ Already correctly assigned: ${alreadyAssigned.length}`)
    console.log(`➕ Need to assign (in PDF, not in DB): ${needAssignment.length}`)
    console.log(`➖ Should remove from Kutch (in DB, not in PDF): ${shouldRemove.length}`)
    
    if (needAssignment.length > 0) {
      console.log(`\n\n📋 VOTERS TO ASSIGN TO KUTCH (first 20):`)
      console.log('─'.repeat(80))
      needAssignment.slice(0, 20).forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name}`)
        console.log(`      Phone: ${voter.phone}`)
        console.log(`      Voter ID: ${voter.voterId || 'N/A'}`)
        console.log('')
      })
      if (needAssignment.length > 20) {
        console.log(`   ... and ${needAssignment.length - 20} more`)
      }
    }
    
    if (shouldRemove.length > 0) {
      console.log(`\n\n📋 VOTERS TO REMOVE FROM KUTCH (first 20):`)
      console.log('─'.repeat(80))
      shouldRemove.slice(0, 20).forEach((voter, index) => {
        console.log(`   ${index + 1}. ${voter.name} (${voter.voterId})`)
        console.log(`      Phone: ${voter.phone || 'N/A'}`)
        console.log('')
      })
      if (shouldRemove.length > 20) {
        console.log(`   ... and ${shouldRemove.length - 20} more`)
      }
    }
    
    console.log(`\n` + '='.repeat(80))
    console.log(`📊 SUMMARY:`)
    console.log(`   PDF Total: ${pdfVoters.length}`)
    console.log(`   Current DB Total: ${dbVoters.length}`)
    console.log(`   Already Assigned: ${alreadyAssigned.length}`)
    console.log(`   To Assign: ${needAssignment.length}`)
    console.log(`   To Remove: ${shouldRemove.length}`)
    console.log(`   Expected Final Total: ${pdfVoters.length}`)
    console.log(`   Net Change: ${pdfVoters.length - dbVoters.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeUpdatedKutchPDF()

