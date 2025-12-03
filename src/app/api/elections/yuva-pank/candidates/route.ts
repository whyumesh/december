import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic'

const STORJ_BUCKET_NAME = process.env.STORJ_BUCKET_NAME || 'kmselection'

// Gujarati name mappings for Raigad and Karnataka & Goa zone candidates
const CANDIDATE_NAMES_GUJARATI: Record<string, string> = {
  'Ram Ashok Karva': 'રામ અશોક કરવા',
  'Dilip Haresh Bhutada': 'દિલીપ હરેશ ભૂતડા',
  'Hardik Mukesh Navdhare': 'હાર્દિક મુકેશ નવધરે',
  'Jaymin Arvind Bhutada': 'જયમીન અરવિંદ ભુતડા'
}

// Zones that use the Gujarati name mapping
const ZONES_WITH_GUJARATI_NAMES = ['RAIGAD', 'KARNATAKA_GOA']

export async function GET(request: NextRequest) {
  try {
    // Get voter's zone from query parameter (optional)
    const { searchParams } = new URL(request.url)
    const voterZoneId = searchParams.get('zoneId')
    
    // Build where clause - if zoneId is provided, filter by zone, otherwise get all approved candidates
    const whereClause: any = {
      status: 'APPROVED'
    }
    
    if (voterZoneId) {
      whereClause.zoneId = voterZoneId
    }

    const candidates = await prisma.yuvaPankhCandidate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
            nameGujarati: true,
            code: true,
            seats: true
          }
        }
      },
      where: {
        ...whereClause,
        position: { not: 'NOTA' } // Exclude NOTA candidates from display
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    // Get all photo fileKeys from UploadedFile table for these candidates
    let uploadedPhotos: any[] = []
    let photoMap = new Map<string, string>()
    
    try {
      const candidateUserIds = candidates
        .filter(c => c.userId)
        .map(c => c.userId) as string[]
      
      if (candidateUserIds.length > 0) {
        uploadedPhotos = await prisma.uploadedFile.findMany({
          where: {
            userId: { in: candidateUserIds },
            fileType: 'photo'
          },
          select: {
            userId: true,
            filePath: true,
            originalName: true,
            uploadedAt: true
          },
          orderBy: { uploadedAt: 'desc' }
        })
        
        // Create a map of userId to photo fileKey
        uploadedPhotos.forEach(photo => {
          if (photo.userId && photo.filePath) {
            photoMap.set(photo.userId, photo.filePath)
          }
        })
      }
      
      console.log(`📸 Found ${uploadedPhotos.length} photos in UploadedFile table for ${candidateUserIds.length} Yuva Pankh candidates`)
    } catch (photoError) {
      console.error('Error fetching photo metadata (non-critical, continuing):', photoError)
    }

    const formattedCandidates = candidates.map(candidate => {
      // Parse experience and education fields
      let experienceData = null
      let educationData = null
      let photoUrl = null
      
      try {
        if (candidate.experience) {
          experienceData = JSON.parse(candidate.experience)
          photoUrl = experienceData.filePaths?.candidatePhoto || null
        }
      } catch (error) {
        console.error('Error parsing experience data:', error)
        experienceData = candidate.experience
      }

      try {
        if (candidate.education) {
          educationData = JSON.parse(candidate.education)
        }
      } catch (error) {
        console.error('Error parsing education data:', error)
        educationData = candidate.education
      }

      // Extract additional candidate info from experience JSON
      const candidateDetails = experienceData?.candidateDetails || {}
      
      // Get photoFileKey from experience JSON (primary source)
      // Check multiple possible locations in the experience JSON
      let photoFileKey = 
        experienceData?.fileKeys?.candidatePhoto || 
        experienceData?.filePaths?.candidatePhoto ||
        experienceData?.candidatePhoto ||
        experienceData?.photo ||
        experienceData?.photoFileKey ||
        null
      
      // Handle empty string as null
      if (photoFileKey === '' || (typeof photoFileKey === 'string' && photoFileKey.trim() === '')) {
        photoFileKey = null
      }
      
      // If no photoFileKey in experience, try to find it from UploadedFile table
      if (!photoFileKey && candidate.userId) {
        photoFileKey = photoMap.get(candidate.userId) || null
        if (photoFileKey) {
          console.log(`✅ Found photo for Yuva Pankh candidate ${candidate.id} from UploadedFile table:`, photoFileKey)
        }
      }
      
      // Normalize photoFileKey if it exists
      if (photoFileKey) {
        // Remove any URL prefixes if it's a full URL
        if (photoFileKey.startsWith('http://') || photoFileKey.startsWith('https://')) {
          // Extract the key from URL
          try {
            const urlObj = new URL(photoFileKey)
            const pathParts = urlObj.pathname.split('/').filter(p => p && p !== STORJ_BUCKET_NAME)
            photoFileKey = pathParts.join('/')
          } catch {
            // If URL parsing fails, try to extract key manually
            const match = photoFileKey.match(/nominations\/[^?]+/)
            if (match) {
              photoFileKey = match[0]
            }
          }
        }
        
        // Ensure it starts with nominations/ if it doesn't already
        if (!photoFileKey.startsWith('nominations/') && !photoFileKey.startsWith('kmselection/')) {
          // Construct path if we have parts
          if (photoFileKey.includes('photo') || photoFileKey.includes('nomination')) {
            photoFileKey = `nominations/${photoFileKey}`
          }
        }
      }
      
      // Log photoFileKey status with detailed info
      if (photoFileKey) {
        console.log(`✅ Yuva Pankh Candidate ${candidate.id} (${candidate.name}): photoFileKey =`, photoFileKey)
        console.log(`   Experience data keys:`, Object.keys(experienceData || {}))
      } else {
        console.log(`⚠️ Yuva Pankh Candidate ${candidate.id} (${candidate.name}): photoFileKey = null`)
        console.log(`   Experience data structure:`, JSON.stringify(experienceData).substring(0, 300))
      }
      
      const candidateName = candidate.user?.name || candidate.name
      // Get Gujarati name from mapping if available (for Raigad and Karnataka & Goa zones)
      const nameGujarati = candidate.zone?.code && ZONES_WITH_GUJARATI_NAMES.includes(candidate.zone.code) && CANDIDATE_NAMES_GUJARATI[candidateName]
        ? CANDIDATE_NAMES_GUJARATI[candidateName]
        : null

      return {
        id: candidate.id,
        name: candidateName,
        nameGujarati: nameGujarati,
        email: candidate.user?.email || candidate.email,
        phone: candidate.user?.phone || candidate.phone,
        party: candidate.party,
        position: candidate.position,
        region: candidate.region,
        manifesto: candidate.manifesto,
        experience: experienceData,
        education: educationData,
        photoUrl: photoUrl,
        photoFileKey: photoFileKey,
        age: candidateDetails.birthDate ? (() => {
          // Calculate age from birthDate
          try {
            const [day, month, year] = candidateDetails.birthDate.split('-').map(Number)
            const birthDate = new Date(year, month - 1, day)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            return age
          } catch {
            return null
          }
        })() : null,
        gender: candidateDetails.gender || null,
        birthDate: candidateDetails.birthDate || null,
        status: candidate.status,
        zone: candidate.zone ? {
          id: candidate.zone.id,
          name: candidate.zone.name,
          nameGujarati: candidate.zone.nameGujarati,
          code: candidate.zone.code,
          seats: candidate.zone.seats
        } : null
      }
    })

    // NOTA candidates should NOT be displayed as selectable options
    // They are only created in the backend when votes are submitted for unfilled seats
    // Filter out any NOTA candidates that might have been fetched
    const candidatesWithoutNota = formattedCandidates.filter(c => c.position !== 'NOTA')

    return NextResponse.json({
      candidates: candidatesWithoutNota
    })

  } catch (error) {
    console.error('Error fetching Yuva Pankh candidates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
