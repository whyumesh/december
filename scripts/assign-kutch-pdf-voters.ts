/**
 * Assign voters from Kutch PDF to Kutch zone
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
      voterId: voterId
    })
  }
  
  // Remove duplicates based on phone number
  const uniqueVoters = voters.filter((voter, index, self) =>
    index === self.findIndex(v => v.phone === voter.phone)
  )
  
  return uniqueVoters
}

async function assignKutchPDFVoters() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ASSIGNING KUTCH PDF VOTERS TO KUTCH ZONE')
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
    
    console.log(`\n🔍 Assigning voters to Kutch zone (ID: ${kutchZone.id})...`)
    
    let assigned = 0
    let notFound = 0
    let alreadyAssigned = 0
    let errors = 0
    
    for (const pdfVoter of pdfVoters) {
      try {
        let dbVoter = null
        
        // Try to find by Voter ID first
        if (pdfVoter.voterId) {
          dbVoter = await prisma.voter.findFirst({
            where: {
              voterId: pdfVoter.voterId.toUpperCase()
            }
          })
        }
        
        // If not found by Voter ID, try phone
        if (!dbVoter && pdfVoter.phone) {
          const normalizedPhone = normalizePhone(pdfVoter.phone)
          if (normalizedPhone) {
            dbVoter = await prisma.voter.findFirst({
              where: {
                phone: normalizedPhone
              }
            })
          }
        }
        
        if (!dbVoter) {
          console.log(`⚠️  Not found: ${pdfVoter.name} (${pdfVoter.voterId || pdfVoter.phone})`)
          notFound++
          continue
        }
        
        // Check if already assigned to Kutch
        if (dbVoter.yuvaPankZoneId === kutchZone.id) {
          alreadyAssigned++
          continue
        }
        
        // Assign to Kutch zone
        await prisma.voter.update({
          where: { id: dbVoter.id },
          data: {
            yuvaPankZoneId: kutchZone.id,
            region: 'Kutch' // Also update region
          }
        })
        
        assigned++
        
        if (assigned % 10 === 0) {
          console.log(`   ✅ Assigned ${assigned} voters...`)
        }
      } catch (error) {
        console.error(`❌ Error assigning ${pdfVoter.name}:`, error)
        errors++
      }
    }
    
    // Summary
    console.log(`\n` + '='.repeat(80))
    console.log('ASSIGNMENT RESULTS')
    console.log('='.repeat(80))
    console.log(`✅ Successfully assigned: ${assigned}`)
    console.log(`⚠️  Already assigned: ${alreadyAssigned}`)
    console.log(`❌ Not found: ${notFound}`)
    console.log(`❌ Errors: ${errors}`)
    console.log(`📊 Total processed: ${pdfVoters.length}`)
    
    // Verify final count
    const finalCount = await prisma.voter.count({
      where: {
        yuvaPankZoneId: kutchZone.id,
        voterId: {
          not: {
            startsWith: 'TEST_'
          }
        }
      }
    })
    
    console.log(`\n📊 Final Kutch zone voter count: ${finalCount}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

assignKutchPDFVoters()

