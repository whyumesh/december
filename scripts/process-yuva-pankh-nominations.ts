/**
 * Script to process Yuva Pankh nominations and activate voting
 * Run with: npx tsx scripts/process-yuva-pankh-nominations.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Load environment variables from .env.local
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
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '')
        if (key && cleanValue) {
          process.env[key.trim()] = cleanValue
        }
      }
    }
    console.log('✅ Loaded environment variables from .env.local')
  } else {
    console.log('⚠️  .env.local file not found, using system environment variables')
  }
}

// Load env file before anything else
loadEnvFile()

// Simple file key generator
function generateFileKey(candidateId: string, fileType: string, extension: string): string {
  const timestamp = Date.now()
  return `yuva-pankh/${candidateId}/${fileType}_${timestamp}.${extension}`
}

// Try to use Cloudinary if available, otherwise use local storage
async function uploadNominationFile(fileKey: string, fileBuffer: Buffer, contentType: string): Promise<string> {
  // Try Cloudinary first if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const cloudinary = require('cloudinary').v2
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })
      
      const base64String = fileBuffer.toString('base64')
      const dataUri = `data:${contentType};base64,${base64String}`
      
      const result = await cloudinary.uploader.upload(dataUri, {
        public_id: fileKey.replace(/\.[^/.]+$/, ''),
        resource_type: 'raw',
        folder: 'kms-election/yuva-pankh',
        use_filename: true,
        unique_filename: true,
      })
      
      console.log(`  ✅ Uploaded to Cloudinary: ${result.public_id}`)
      return result.public_id
    } catch (error) {
      console.log(`  ⚠️  Cloudinary upload failed, using local storage:`, error instanceof Error ? error.message : error)
    }
  }
  
  // Fallback to local storage
  const uploadsDir = process.env.UPLOAD_DIR || './uploads'
  const fullPath = join(process.cwd(), uploadsDir, fileKey)
  const dir = path.dirname(fullPath)
  
  await mkdir(dir, { recursive: true })
  await writeFile(fullPath, fileBuffer)
  
  console.log(`  ✅ Saved locally: ${fileKey}`)
  return fileKey
}

const prisma = new PrismaClient()

// Candidate information from client
const candidates = [
  {
    name: 'Nidhi Ramesh Gandhi',
    zone: 'ANYA_GUJARAT',
    region: 'Anya Gujarat',
    pdfFile: '3. Nidhi Rameshbhai Mall.pdf', // Note: File says "Mall" but client says "Gandhi"
    position: 'Member'
  },
  {
    name: 'Bhavesh Harilal Mandan',
    zone: 'KUTCH',
    region: 'Kutch',
    pdfFile: '4. Bhavesh Harilal Mandan.pdf',
    position: 'Member'
  },
  {
    name: 'Raj Dhiraj Mandan',
    zone: 'KUTCH',
    region: 'Kutch',
    pdfFile: '2. Raj Dhirajlal Mandan.pdf',
    position: 'Member'
  },
  {
    name: 'Nikhil Vasant Gandhi',
    zone: 'KUTCH',
    region: 'Kutch',
    pdfFile: '3. Nikhil Vasantbhai Mall.pdf', // Note: File says "Mall" but client says "Gandhi"
    position: 'Member'
  }
]

async function findOrCreateZone(zoneCode: string, electionType: string) {
  const zone = await prisma.zone.findFirst({
    where: {
      code: zoneCode,
      electionType: electionType
    }
  })

  if (!zone) {
    throw new Error(`Zone ${zoneCode} for ${electionType} not found!`)
  }

  return zone
}

async function uploadNominationPDF(candidateId: string, pdfPath: string): Promise<string> {
  try {
    console.log(`  📄 Uploading PDF: ${path.basename(pdfPath)}`)
    
    // Read the PDF file
    const fileBuffer = fs.readFileSync(pdfPath)
    const fileExtension = path.extname(pdfPath).substring(1) || 'pdf'
    
    // Generate file key
    const fileKey = generateFileKey(candidateId, 'nomination_form', fileExtension)
    
    // Upload to storage (Cloudinary or local)
    const uploadedKey = await uploadNominationFile(fileKey, fileBuffer, 'application/pdf')
    
    return uploadedKey
  } catch (error) {
    console.error(`  ❌ Error uploading PDF:`, error)
    throw error
  }
}

async function processCandidate(candidateInfo: typeof candidates[0], nominationDir: string) {
  console.log(`\n📋 Processing: ${candidateInfo.name}`)
  console.log(`   Zone: ${candidateInfo.zone} (${candidateInfo.region})`)
  
  // Find the zone
  const zone = await findOrCreateZone(candidateInfo.zone, 'YUVA_PANK')
  console.log(`   ✅ Found zone: ${zone.name} (ID: ${zone.id})`)
  
  // Check if candidate already exists
  let candidate = await prisma.yuvaPankhCandidate.findFirst({
    where: {
      name: {
        contains: candidateInfo.name.split(' ')[0], // Match by first name
        mode: 'insensitive'
      },
      zoneId: zone.id
    }
  })
  
  // Upload nomination PDF
  const pdfPath = path.join(nominationDir, candidateInfo.pdfFile)
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`)
  }
  
  let nominationFormKey: string | undefined
  
  // If candidate exists, upload PDF and update
  if (candidate) {
    console.log(`   ℹ️  Candidate already exists (ID: ${candidate.id})`)
    console.log(`   📝 Current status: ${candidate.status}`)
    
    // Upload PDF
    nominationFormKey = await uploadNominationPDF(candidate.id, pdfPath)
    
    // Update candidate with nomination form
    const experienceData = candidate.experience ? JSON.parse(candidate.experience) : {}
    experienceData.nominationForm = nominationFormKey
    experienceData.filePaths = experienceData.filePaths || {}
    experienceData.filePaths.nominationForm = nominationFormKey
    
    candidate = await prisma.yuvaPankhCandidate.update({
      where: { id: candidate.id },
      data: {
        name: candidateInfo.name, // Update name to match client's version
        region: candidateInfo.region,
        zoneId: zone.id,
        position: candidateInfo.position,
        experience: JSON.stringify(experienceData),
        status: 'APPROVED', // Approve the candidate
        updatedAt: new Date()
      }
    })
    
    console.log(`   ✅ Updated and approved candidate`)
  } else {
    // Create new candidate
    console.log(`   ➕ Creating new candidate...`)
    
    // Create a temporary ID for file upload
    const tempId = `temp-${Date.now()}`
    nominationFormKey = await uploadNominationPDF(tempId, pdfPath)
    
    // Now create the candidate with the uploaded file
    const experienceData = {
      nominationForm: nominationFormKey,
      filePaths: {
        nominationForm: nominationFormKey
      }
    }
    
    candidate = await prisma.yuvaPankhCandidate.create({
      data: {
        name: candidateInfo.name,
        region: candidateInfo.region,
        zoneId: zone.id,
        position: candidateInfo.position,
        experience: JSON.stringify(experienceData),
        status: 'APPROVED',
        isOnlineRegistration: false, // Admin uploaded
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log(`   ✅ Created and approved candidate (ID: ${candidate.id})`)
  }
  
  return candidate
}

async function activateYuvaPankhElection() {
  console.log('\n🗳️  Activating Yuva Pankh election...')
  
  const election = await prisma.election.findFirst({
    where: { type: 'YUVA_PANK' },
    orderBy: { createdAt: 'desc' }
  })
  
  if (!election) {
    throw new Error('Yuva Pankh election not found!')
  }
  
  console.log(`   Found election: ${election.title} (Status: ${election.status})`)
  
  const updatedElection = await prisma.election.update({
    where: { id: election.id },
    data: { status: 'ACTIVE' }
  })
  
  console.log(`   ✅ Election activated! New status: ${updatedElection.status}`)
  return updatedElection
}

async function main() {
  try {
    console.log('🚀 Starting Yuva Pankh Nomination Processing...\n')
    
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL environment variable is not set!')
      console.error('   Please set DATABASE_URL in your environment or .env.local file')
      console.error('   Example: DATABASE_URL="postgresql://user:password@host:5432/database"')
      process.exit(1)
    }
    
    // Check nomination directory
    const nominationDir = path.join(process.cwd(), 'yuvapankh_candidates')
    if (!fs.existsSync(nominationDir)) {
      throw new Error(`Nomination directory not found: ${nominationDir}`)
    }
    
    console.log(`📁 Nomination directory: ${nominationDir}\n`)
    
    // Process each candidate
    const processedCandidates = []
    for (const candidateInfo of candidates) {
      try {
        const candidate = await processCandidate(candidateInfo, nominationDir)
        processedCandidates.push(candidate)
      } catch (error) {
        console.error(`❌ Error processing ${candidateInfo.name}:`, error)
        throw error
      }
    }
    
    // Verify all candidates are approved
    console.log('\n✅ Verification:')
    for (const candidate of processedCandidates) {
      const status = candidate.status
      const zone = await prisma.zone.findUnique({ where: { id: candidate.zoneId! } })
      console.log(`   ${candidate.name}: ${status} (Zone: ${zone?.name || 'Unknown'})`)
      
      if (status !== 'APPROVED') {
        throw new Error(`Candidate ${candidate.name} is not approved! Status: ${status}`)
      }
    }
    
    // Activate election
    await activateYuvaPankhElection()
    
    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ SUCCESS! Yuva Pankh Election is now open for voting')
    console.log('='.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   • Total candidates processed: ${processedCandidates.length}`)
    console.log(`   • Anya Gujarat: 1 candidate`)
    console.log(`   • Kutch: 3 candidates`)
    console.log(`   • All candidates: APPROVED`)
    console.log(`   • Election status: ACTIVE`)
    console.log(`\n🎉 Voting is now open for Yuva Pankh elections!`)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

