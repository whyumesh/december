import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic'

// Gujarati name mappings for Karobari winners
const CANDIDATE_NAMES_GUJARATI: Record<string, string> = {
  // Garada-Lakhpat & Nakhatrana
  'Deepak Ladharam Sharda': 'દિપક લાધરામ શારદા',
  'Kishor Mangaldas Somani': 'કિશોર મંગળદાસ સોમાણી',
  
  // Abdasa
  'Jayesh Jagdishbhai Ladhad': 'જયેશ જગદીશભાઈ લાધડ',
  
  // Bhuj
  'Pankaj Shamji Bhedakiya': 'પંકજ શામજી ભેડાકિયા',
  'Hitesh Mangaldas Bhutada': 'હિતેશ મંગળદાસ ભૂતડા',
  'Jayantilal Chandrakant Mandan': 'જયંતિલાલ ચંદ્રકાંત મંડણ',
  
  // Anjar
  'Gautam Damodarbhai Gagdani': 'ગૌતમ દામોદરભાઈ ગગદાની',
  
  // Anya Gujarat
  'Mitaben Anil Bhutada': 'મીતાબેન અનિલ ભૂતડા',
  'Manilal Damodar Mall': 'મણિલાલ દામોદર મલ્લ',
  'Bhavesh Mohanbhai Bhutada': 'ભાવેશ મોહનભાઈ ભૂતડા',
  
  // Mumbai
  'Nandu Bhanji Gingal': 'નંદુ ભાનજી ગિંગલ',
  'Deepak Kishor Karwa': 'દિપક કિશોર કરવા',
  'Jaymin Ramji Mall': 'જયમીન રામજી મલ્લ',
  'Kiran Jamnadas Rathi': 'કિરણ જમનાદાસ રાઠી',
  'Raghuvir Kiritbhai Zaveri': 'રઘુવીર કિરીટભાઈ ઝવેરી',
  'Girish Jethalal Rathi': 'ગિરીશ જેઠાલાલ રાઠી',
  
  // Raigad
  'Latesh Bharat Mandan': 'લતેશ ભરત મંડણ',
  'Paresh Keshavji Karwa': 'પરેશ કેશવજી કરવા',
  'Anjana Ashwin Bhutada': 'અંજના અશ્વિન ભૂતડા',
  'Alpeshkumar Harilal Bhutada': 'અલ્પેશકુમાર હરિલાલ ભૂતડા',
  
  // Karnataka & Goa
  'Rajnikant Hirachand Ladhad': 'રાજનીકાંત હીરાચંદ લાધડ'
}

export async function GET(request: NextRequest) {
  try {
    // Get voter's zone from query parameter (optional)
    const { searchParams } = new URL(request.url)
    const voterZoneId = searchParams.get('zoneId')
    
    // Build where clause - always return all approved candidates (all winners visible to all voters)
    const whereClause: any = {
      status: 'APPROVED'
    }
    
    // Note: Removed zoneId filter - all winners are visible to all voters

    const candidates = await prisma.karobariCandidate.findMany({
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
      orderBy: { createdAt: 'desc' }
    })

    // Get all photo fileKeys from UploadedFile table (in case photoFileKey is missing from experience)
    // Note: For Karobari candidates uploaded by admin, photos may be linked to admin's userId
    let uploadedPhotos: any[] = []
    let allUploadedFiles: any[] = []
    let photoMap = new Map<string, string>()
    
    try {
      const candidateUserIds = candidates
        .filter(c => c.userId)
        .map(c => c.userId) as string[]
      
      // Also get all Karobari admin user IDs to find photos uploaded by them
      const karobariAdmins = await prisma.karobariAdmin.findMany({
        select: { userId: true }
      })
      const adminUserIds = karobariAdmins.map(admin => admin.userId)
      const allUserIds = [...candidateUserIds, ...adminUserIds]
      
      if (allUserIds.length > 0) {
        uploadedPhotos = await prisma.uploadedFile.findMany({
          where: {
            userId: { in: allUserIds },
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
      }
      
      // Also check for photos with fileKeys that match candidate experience photoFileKey
      // This handles cases where admin uploaded photos (stored with admin userId)
      // Get all recent photo uploads to match with candidates
      allUploadedFiles = await prisma.uploadedFile.findMany({
        where: {
          fileType: 'photo',
          OR: [
            { filePath: { contains: 'nominations/' } },
            { filePath: { contains: 'photo' } }
          ]
        },
        select: {
          userId: true,
          filePath: true,
          originalName: true,
          uploadedAt: true
        },
        orderBy: { uploadedAt: 'desc' },
        take: 2000 // Increased limit to find more photos
      })
      
      // Create a map of userId to photo fileKey (for candidates with userId)
      uploadedPhotos.forEach(photo => {
        if (photo.userId && photo.filePath) {
          photoMap.set(photo.userId, photo.filePath)
        }
      })
    } catch (photoError) {
      console.error('Error fetching photo metadata (non-critical, continuing):', photoError)
      // Continue without photo metadata - photos will still work if photoFileKey is in experience JSON
    }
    
    console.log(`Fetched ${candidates.length} candidates, ${photoMap.size} photos mapped`)
    
    const formattedCandidates = candidates.map(candidate => {
      // Parse experience and education fields
      let experienceData = null
      let educationData = null
      let photoUrl = null
      
      try {
        if (candidate.experience) {
          experienceData = typeof candidate.experience === 'string' 
            ? JSON.parse(candidate.experience)
            : candidate.experience
          photoUrl = experienceData?.filePaths?.candidatePhoto || null
          console.log(`📋 Experience data for ${candidate.id}:`, JSON.stringify(experienceData).substring(0, 200))
        } else {
          console.log(`⚠️ No experience data for candidate ${candidate.id}`)
        }
      } catch (error) {
        console.error('Error parsing experience data:', error)
        experienceData = candidate.experience
      }

      try {
        if (candidate.education) {
          educationData = typeof candidate.education === 'string'
            ? JSON.parse(candidate.education)
            : candidate.education
        }
      } catch (error) {
        console.error('Error parsing education data:', error)
        educationData = candidate.education
      }

      // Extract additional candidate info from experience JSON
      const candidateDetails = experienceData?.candidateDetails || {}
      
      // Get photoFileKey from experience JSON (primary source)
      let photoFileKey = experienceData?.photoFileKey || null
      
      // Handle empty string as null
      if (photoFileKey === '' || (typeof photoFileKey === 'string' && photoFileKey.trim() === '')) {
        photoFileKey = null
      }
      
      // Normalize photoFileKey if it exists
      if (photoFileKey) {
        // Ensure it starts with nominations/ if it doesn't already
        if (!photoFileKey.startsWith('nominations/') && !photoFileKey.startsWith('kmselection/')) {
          // Check if it contains photo identifier
          if (photoFileKey.includes('photo') || photoFileKey.match(/nominations/i)) {
            // Try to extract or construct proper path
            const match = photoFileKey.match(/(nominations\/[^\/]+\/photo[^\/]*)/i)
            if (match) {
              photoFileKey = match[1]
            } else {
              // Construct path if we have parts
              photoFileKey = `nominations/${photoFileKey}`
            }
          }
        }
      }
      
      // If no photoFileKey in experience, try to find it from UploadedFile table
      if (!photoFileKey && candidate.userId) {
        photoFileKey = photoMap.get(candidate.userId) || null
      }
      
      // If still no photoFileKey, try to find by matching filePath patterns
      // This handles cases where admin uploaded photos before candidate record existed
      if (!photoFileKey && allUploadedFiles.length > 0) {
        // Try multiple strategies to find the photo:
        
        // Strategy 1: Find photos uploaded around the same time as candidate creation
        const candidateCreatedTime = new Date(candidate.createdAt).getTime()
        const timeWindow = 5 * 60 * 1000 // 5 minutes window
        
        const timeBasedMatch = allUploadedFiles.find(file => {
          const fileTime = new Date(file.createdAt).getTime()
          const timeDiff = Math.abs(fileTime - candidateCreatedTime)
          return timeDiff < timeWindow && file.filePath && file.filePath.includes('photo')
        })
        
        if (timeBasedMatch) {
          photoFileKey = timeBasedMatch.filePath
          console.log(`Found photo for ${candidate.id} by time-based matching:`, photoFileKey)
        } else {
          // Strategy 2: Check if photo filePath contains candidate name or ID
          const candidateNameForSearch = (candidate.user?.name || candidate.name).toLowerCase()
          const candidateIdShort = candidate.id.substring(0, 12)
          
          const nameBasedMatch = allUploadedFiles.find(file => {
            if (!file.filePath) return false
            const filePathLower = file.filePath.toLowerCase()
            return (
              filePathLower.includes('photo') && (
                filePathLower.includes(candidateNameForSearch.split(' ')[0]) ||
                filePathLower.includes(candidateIdShort)
              )
            )
          })
          
          if (nameBasedMatch) {
            photoFileKey = nameBasedMatch.filePath
            console.log(`Found photo for ${candidate.id} by name-based matching:`, photoFileKey)
          } else {
            // Strategy 3: Get the most recent photo that looks like a candidate photo
            const recentPhoto = allUploadedFiles.find(file => 
              file.filePath && file.filePath.includes('photo') && file.filePath.includes('nominations/')
            )
            if (recentPhoto) {
              photoFileKey = recentPhoto.filePath
              console.log(`Found photo for ${candidate.id} by recent photo matching:`, photoFileKey)
            }
          }
        }
      }
      
      // Log photoFileKey status
      if (photoFileKey) {
        console.log(`✅ Candidate ${candidate.id} (${candidate.name}): photoFileKey =`, photoFileKey)
      } else {
        console.log(`⚠️ Candidate ${candidate.id} (${candidate.name}): photoFileKey = null (no photo found)`)
      }
      
      const candidateName = candidate.user?.name || candidate.name
      const nameGujarati = CANDIDATE_NAMES_GUJARATI[candidateName] || null
      
      // Fix Karnataka zone nameGujarati if needed
      let zoneNameGujarati = candidate.zone?.nameGujarati
      if (candidate.zone?.code === 'KARNATAKA_GOA' && zoneNameGujarati !== 'કર્ણાટક અને ગોવા') {
        zoneNameGujarati = 'કર્ણાટક અને ગોવા'
      }
      
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
        age: candidateDetails.dateOfBirth ? (() => {
          // Calculate age from dateOfBirth (DD-MM-YYYY format)
          try {
            const [day, month, year] = candidateDetails.dateOfBirth.split('-').map(Number)
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
        dateOfBirth: candidateDetails.dateOfBirth || null,
        status: candidate.status,
        zone: candidate.zone ? {
          id: candidate.zone.id,
          name: candidate.zone.name,
          nameGujarati: zoneNameGujarati,
          code: candidate.zone.code,
          seats: candidate.zone.seats
        } : null
      }
    })

      console.log(`Returning ${formattedCandidates.length} candidates for zone ${voterZoneId || 'all'}`)
      return NextResponse.json({
        candidates: formattedCandidates
      })

    } catch (error) {
      console.error('Error fetching Karobari Members candidates:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ 
        error: 'Failed to fetch candidates',
        details: errorMessage
      }, { status: 500 })
    }
  }
