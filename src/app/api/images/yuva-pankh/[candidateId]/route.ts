import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/db'
import { generateDownloadUrl, isStorjConfigured } from '@/lib/storj'

// Cache images for 1 year (immutable)
export const revalidate = 31536000

export async function GET(
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  try {
    const { candidateId } = params
    
    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // Get candidate and photo file key
    const candidate = await prisma.yuvaPankhCandidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        experience: true
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Extract photoFileKey from experience
    let photoFileKey: string | null = null
    try {
      if (candidate.experience) {
        const exp = JSON.parse(candidate.experience)
        photoFileKey = exp.photoFileKey || exp.filePaths?.candidatePhoto || null
      }
    } catch (error) {
      // Ignore parse errors
    }

    if (!photoFileKey) {
      return NextResponse.json(
        { error: 'Photo not found for candidate' },
        { status: 404 }
      )
    }

    // Try to serve from local file system first (for local development)
    if (process.env.NODE_ENV !== 'production') {
      const uploadsDir = process.env.UPLOAD_DIR || './uploads'
      let filePath = join(process.cwd(), uploadsDir, photoFileKey)
      
      // Normalize path
      filePath = filePath.replace(/\\/g, '/')
      
      if (existsSync(filePath)) {
        try {
          const fileBuffer = await readFile(filePath)
          const extension = photoFileKey.split('.').pop()?.toLowerCase() || 'png'
          let contentType = 'image/png'
          
          switch (extension) {
            case 'jpg':
            case 'jpeg':
              contentType = 'image/jpeg'
              break
            case 'png':
              contentType = 'image/png'
              break
            case 'webp':
              contentType = 'image/webp'
              break
          }

          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Content-Disposition': 'inline',
            },
          })
        } catch (error) {
          console.error('Error reading local file:', error)
        }
      }
    }

    // Use Storj for production/deployment
    if (isStorjConfigured()) {
      try {
        // Normalize file key for Storj - use same logic as view-document API
        let normalizedKey = photoFileKey.trim()
        const bucketName = process.env.STORJ_BUCKET_NAME || 'kmselection'
        
        // Remove bucket prefixes first (same as view-document API)
        normalizedKey = normalizedKey.replace(/^kmselection\/kmselection\//, '')
        normalizedKey = normalizedKey.replace(/^kmselection\/nominations\//, 'nominations/')
        normalizedKey = normalizedKey.replace(/^nominations\/nominations\//, 'nominations/')
        
        if (normalizedKey.startsWith(`${bucketName}/`)) {
          normalizedKey = normalizedKey.substring(bucketName.length + 1)
        }
        
        // Convert yuva-pankh/photos/... to nominations/yuva-pankh/photos/... format
        // Only if it doesn't already start with nominations/
        if (!normalizedKey.startsWith('nominations/') && normalizedKey.startsWith('yuva-pankh/')) {
          normalizedKey = `nominations/${normalizedKey}`
        }
        
        // Ensure it starts with nominations/ (if it already does, keep it)
        if (!normalizedKey.startsWith('nominations/')) {
          // Try to find nominations/ in the path
          const nominationsMatch = normalizedKey.match(/nominations\/.+/)
          if (nominationsMatch) {
            normalizedKey = nominationsMatch[0]
          } else {
            // Add nominations/ prefix if not present
            normalizedKey = `nominations/${normalizedKey}`
          }
        }
        
        console.log(`[Image Endpoint] Generating Storj URL for photo: ${photoFileKey} -> ${normalizedKey}`)
        
        // Generate Storj download URL (7 days expiry)
        // generateDownloadUrl will check if file exists and throw if not found
        const downloadUrl = await generateDownloadUrl(normalizedKey, 604800)
        
        console.log(`[Image Endpoint] ✅ Generated Storj URL successfully`)
        
        // Redirect to Storj URL
        return NextResponse.redirect(downloadUrl, {
          status: 302,
          headers: {
            'Cache-Control': 'public, max-age=604800', // Cache redirect for 7 days
          },
        })
      } catch (storjError) {
        const errorMessage = storjError instanceof Error ? storjError.message : String(storjError)
        console.error('[Image Endpoint] Error generating Storj URL:', errorMessage)
        console.error('[Image Endpoint] Error details:', {
          photoFileKey,
          error: errorMessage,
          isFileNotFound: errorMessage.includes('not found') || errorMessage.includes('NoSuchKey') || errorMessage.includes('does not exist')
        })
        
        // Always try fallback for file not found errors
        if (errorMessage.includes('not found') || errorMessage.includes('NoSuchKey') || errorMessage.includes('does not exist')) {
          console.log(`[Image Endpoint] File not found in Storj, trying fallback API`)
          // Fall through to fallback - don't return error, let fallback handle it
        } else {
          // For other errors (auth, config, etc), still try fallback but log the error
          console.warn(`[Image Endpoint] Storj error (non-file-not-found), trying fallback:`, errorMessage)
          // Fall through to fallback
        }
      }
    }

    // Fallback to view-document API (this handles Storj as well)
    console.log(`[Image Endpoint] Using fallback view-document API for: ${photoFileKey}`)
    try {
      const fallbackUrl = new URL(`/api/admin/view-document?path=${encodeURIComponent(photoFileKey)}`, request.url)
      return NextResponse.redirect(fallbackUrl)
    } catch (error) {
      console.error('[Image Endpoint] Error creating fallback URL:', error)
      return NextResponse.json(
        { 
          error: 'Failed to serve image',
          photoFileKey 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

