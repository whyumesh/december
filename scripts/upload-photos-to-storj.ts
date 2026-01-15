/**
 * Upload existing candidate photos to Storj
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { uploadFileToStorj } from '@/lib/storj'

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

async function uploadPhotosToStorj() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('UPLOADING CANDIDATE PHOTOS TO STORJ')
    console.log('='.repeat(80))
    
    // Check Storj configuration
    if (!process.env.STORJ_ACCESS_KEY_ID || !process.env.STORJ_SECRET_ACCESS_KEY) {
      console.log('❌ Storj not configured. Please set STORJ_ACCESS_KEY_ID and STORJ_SECRET_ACCESS_KEY')
      return
    }
    
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
    
    console.log(`\n📊 Found ${candidates.length} approved candidates in Kutch zone\n`)
    
    const uploadsDir = process.env.UPLOAD_DIR || './uploads'
    
    for (const candidate of candidates) {
      const name = candidate.user?.name || candidate.name
      let photoFileKey: string | null = null
      
      // Extract photoFileKey from experience
      try {
        if (candidate.experience) {
          const exp = JSON.parse(candidate.experience)
          photoFileKey = exp.photoFileKey || exp.filePaths?.candidatePhoto || null
        }
      } catch (error) {
        // Ignore
      }
      
      if (!photoFileKey) {
        console.log(`⚠️  ${name}: No photoFileKey found`)
        continue
      }
      
      // Check if file exists locally
      const localPath = join(process.cwd(), uploadsDir, photoFileKey)
      if (!existsSync(localPath)) {
        console.log(`⚠️  ${name}: Local file not found at ${localPath}`)
        continue
      }
      
      // Read file
      const fileBuffer = readFileSync(localPath)
      const extension = photoFileKey.split('.').pop()?.toLowerCase() || 'png'
      const contentType = extension === 'png' ? 'image/png' : 
                         extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 
                         'image/png'
      
      // Normalize key for Storj
      let storjKey = photoFileKey
      if (storjKey.startsWith('yuva-pankh/')) {
        storjKey = `nominations/${storjKey}`
      }
      
      console.log(`📸 Uploading ${name}:`)
      console.log(`   Local: ${photoFileKey}`)
      console.log(`   Storj: ${storjKey}`)
      
      try {
        await uploadFileToStorj(storjKey, fileBuffer, contentType)
        console.log(`   ✅ Uploaded successfully\n`)
      } catch (error) {
        console.error(`   ❌ Upload failed:`, error instanceof Error ? error.message : error)
        console.log('')
      }
    }
    
    console.log('='.repeat(80))
    console.log('UPLOAD COMPLETE')
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

uploadPhotosToStorj()

