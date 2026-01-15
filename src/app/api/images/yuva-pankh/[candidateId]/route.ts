import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/db'

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

    // Try to serve from local file system first (fastest)
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

    // Fallback to view-document API
    return NextResponse.redirect(
      new URL(`/api/admin/view-document?path=${encodeURIComponent(photoFileKey)}`, request.url)
    )

  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

