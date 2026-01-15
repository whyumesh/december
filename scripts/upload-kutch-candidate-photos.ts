/**
 * Upload candidate photos for Kutch zone candidates
 * Photos: bhavesh.png, nikhil.png, raj.png
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { mkdir, writeFile } from 'fs/promises'

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

// Photo file mappings
const photoMappings: Record<string, string> = {
  'bhavesh.png': 'Bhavesh Harilal Mandan',
  'nikhil.png': 'Nikhil Vasant Gandhi',
  'raj.png': 'Raj Dhiraj Mandan'
}

// Upload to Storj (for deployment) and local storage (for local dev)
async function uploadPhoto(fileKey: string, fileBuffer: Buffer, contentType: string): Promise<string> {
  // Normalize file key for Storj (convert to nominations/ format)
  let storjKey = fileKey
  if (storjKey.startsWith('yuva-pankh/')) {
    storjKey = `nominations/${storjKey}`
  }
  
  // Try Storj first (for deployment)
  if (process.env.STORJ_ACCESS_KEY_ID && process.env.STORJ_SECRET_ACCESS_KEY) {
    try {
      const { uploadFileToStorj } = require('@/lib/storj')
      await uploadFileToStorj(storjKey, fileBuffer, contentType)
      console.log(`  ✅ Uploaded to Storj: ${storjKey}`)
    } catch (error) {
      console.log(`  ⚠️  Storj upload failed:`, error instanceof Error ? error.message : error)
    }
  }
  
  // Also save locally (for local development)
  const uploadsDir = process.env.UPLOAD_DIR || './uploads'
  const fullPath = join(process.cwd(), uploadsDir, fileKey)
  const dir = dirname(fullPath)
  
  await mkdir(dir, { recursive: true })
  await writeFile(fullPath, fileBuffer)
  
  console.log(`  ✅ Saved locally: ${fileKey}`)
  
  // Return the original fileKey (not storjKey) for database storage
  return fileKey
}

async function uploadKutchCandidatePhotos() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('UPLOADING KUTCH ZONE CANDIDATE PHOTOS')
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
    
    console.log(`\n📊 Found ${candidates.length} approved candidates in Kutch zone:`)
    candidates.forEach(c => {
      const name = c.user?.name || c.name
      console.log(`   - ${name}`)
    })
    
    const photosDir = join(process.cwd(), 'yuvapankh_candidates')
    
    // Process each photo file
    for (const [photoFile, expectedName] of Object.entries(photoMappings)) {
      const photoPath = join(photosDir, photoFile)
      
      if (!existsSync(photoPath)) {
        console.log(`\n⚠️  Photo not found: ${photoFile}`)
        continue
      }
      
      // Find matching candidate
      const candidate = candidates.find(c => {
        const name = (c.user?.name || c.name).toLowerCase()
        const expected = expectedName.toLowerCase()
        // Match by first name or full name
        return name.includes(expected.split(' ')[0].toLowerCase()) || 
               expected.includes(name.split(' ')[0].toLowerCase())
      })
      
      if (!candidate) {
        console.log(`\n⚠️  No candidate found for photo: ${photoFile} (expected: ${expectedName})`)
        continue
      }
      
      const candidateName = candidate.user?.name || candidate.name
      console.log(`\n📸 Processing photo for: ${candidateName}`)
      console.log(`   Photo file: ${photoFile}`)
      
      // Read photo file
      const photoBuffer = readFileSync(photoPath)
      const fileExtension = photoFile.split('.').pop() || 'png'
      const contentType = fileExtension === 'png' ? 'image/png' : 
                         fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' : 
                         'image/png'
      
      // Generate file key
      const timestamp = Date.now()
      const fileKey = `yuva-pankh/photos/${candidate.id}/photo_${timestamp}.${fileExtension}`
      
      // Upload photo
      console.log(`   Uploading to: ${fileKey}`)
      const uploadedKey = await uploadPhoto(fileKey, photoBuffer, contentType)
      
      // Update candidate's experience field with photoFileKey
      let experienceData: any = {}
      try {
        if (candidate.experience) {
          experienceData = JSON.parse(candidate.experience)
        }
      } catch (error) {
        console.log(`   ⚠️  Could not parse existing experience data, creating new`)
      }
      
      // Update experience with photo file path
      experienceData.filePaths = experienceData.filePaths || {}
      experienceData.filePaths.candidatePhoto = uploadedKey
      experienceData.photoFileKey = uploadedKey
      
      // Also create/update UploadedFile record
      if (candidate.userId) {
        await prisma.uploadedFile.upsert({
          where: {
            userId_fileType: {
              userId: candidate.userId,
              fileType: 'photo'
            }
          },
          create: {
            userId: candidate.userId,
            fileName: `photo_${timestamp}.${fileExtension}`,
            fileType: 'photo',
            originalName: photoFile,
            mimeType: contentType,
            size: photoBuffer.length,
            fileData: '', // Empty if using Cloudinary or external storage
            filePath: uploadedKey
          },
          update: {
            fileName: `photo_${timestamp}.${fileExtension}`,
            originalName: photoFile,
            mimeType: contentType,
            size: photoBuffer.length,
            filePath: uploadedKey,
            uploadedAt: new Date()
          }
        })
        console.log(`   ✅ Created/updated UploadedFile record`)
      }
      
      // Update candidate record
      await prisma.yuvaPankhCandidate.update({
        where: { id: candidate.id },
        data: {
          experience: JSON.stringify(experienceData)
        }
      })
      
      console.log(`   ✅ Updated candidate record with photoFileKey: ${uploadedKey}`)
    }
    
    console.log(`\n` + '='.repeat(80))
    console.log('PHOTO UPLOAD COMPLETE')
    console.log('='.repeat(80))
    
    // Verify updates
    const updatedCandidates = await prisma.yuvaPankhCandidate.findMany({
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
    
    console.log(`\n📊 Verification:`)
    for (const candidate of updatedCandidates) {
      const name = candidate.user?.name || candidate.name
      let photoFileKey = null
      
      try {
        if (candidate.experience) {
          const exp = JSON.parse(candidate.experience)
          photoFileKey = exp.filePaths?.candidatePhoto || exp.photoFileKey || null
        }
      } catch (error) {
        // Ignore
      }
      
      if (photoFileKey) {
        console.log(`   ✅ ${name}: ${photoFileKey}`)
      } else {
        console.log(`   ⚠️  ${name}: No photo found`)
      }
    }
    
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

uploadKutchCandidatePhotos()

