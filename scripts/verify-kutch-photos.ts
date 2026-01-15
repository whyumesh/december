/**
 * Verify Kutch zone candidate photos are properly stored
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

async function verifyKutchPhotos() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('VERIFYING KUTCH ZONE CANDIDATE PHOTOS')
    console.log('='.repeat(80))
    
    // Get Kutch zone
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    // Get Kutch zone candidates
    const candidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: kutchZone.id,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    console.log(`\n📊 Found ${candidates.length} approved candidates in Kutch zone:\n`)
    
    for (const candidate of candidates) {
      const name = candidate.user?.name || candidate.name
      let photoFileKey = null
      let photoFromExperience = null
      
      // Check experience field
      try {
        if (candidate.experience) {
          const exp = JSON.parse(candidate.experience)
          photoFileKey = exp.photoFileKey || null
          photoFromExperience = exp.filePaths?.candidatePhoto || null
        }
      } catch (error) {
        // Ignore
      }
      
      // Check UploadedFile table
      let uploadedFile = null
      if (candidate.userId) {
        uploadedFile = await prisma.uploadedFile.findFirst({
          where: {
            userId: candidate.userId,
            fileType: 'photo'
          },
          orderBy: {
            uploadedAt: 'desc'
          }
        })
      }
      
      console.log(`📸 ${name}:`)
      console.log(`   Candidate ID: ${candidate.id}`)
      console.log(`   User ID: ${candidate.userId || 'N/A'}`)
      
      if (photoFileKey) {
        console.log(`   ✅ photoFileKey (from experience): ${photoFileKey}`)
      } else {
        console.log(`   ⚠️  photoFileKey: Not found`)
      }
      
      if (photoFromExperience) {
        console.log(`   ✅ filePaths.candidatePhoto: ${photoFromExperience}`)
      }
      
      if (uploadedFile) {
        console.log(`   ✅ UploadedFile record: ${uploadedFile.filePath}`)
        console.log(`      File size: ${uploadedFile.size} bytes`)
        console.log(`      Uploaded: ${uploadedFile.uploadedAt}`)
      } else {
        console.log(`   ⚠️  UploadedFile record: Not found`)
      }
      
      // Check if file exists locally
      if (photoFileKey || photoFromExperience) {
        const fileKey = photoFileKey || photoFromExperience
        const uploadsDir = process.env.UPLOAD_DIR || './uploads'
        const filePath = join(process.cwd(), uploadsDir, fileKey)
        const fileExists = existsSync(filePath)
        
        if (fileExists) {
          console.log(`   ✅ Local file exists: ${filePath}`)
        } else {
          console.log(`   ⚠️  Local file not found: ${filePath}`)
        }
      }
      
      console.log('')
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyKutchPhotos()

