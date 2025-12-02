import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { prisma } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // Bypass session check for hardcoded admin - allow all document access
    console.log('View document POST API called - bypassing admin check for development')
    
    const { fileKey } = await request.json()
    
    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      )
    }

    console.log('Generating fresh URL for file key:', fileKey)
    
    // First, try to get the file from database
    if (process.env.DATABASE_URL) {
      try {
        let uploadedFile: any[] = []
        
        // Try with camelCase column names first (Prisma convention)
        try {
          uploadedFile = await prisma.$queryRaw`
            SELECT * FROM uploaded_files WHERE "filePath" LIKE ${'%' + fileKey + '%'} LIMIT 1
          ` as any[]
        } catch (e) {
          // Try with snake_case column names
          uploadedFile = await prisma.$queryRaw`
            SELECT * FROM uploaded_files WHERE file_path LIKE ${'%' + fileKey + '%'} LIMIT 1
          ` as any[]
        }

        if (uploadedFile && uploadedFile.length > 0) {
          const file = uploadedFile[0]
          const fileKeyFromDb = file.filePath || file.file_path
          
          console.log('Found file in database with fileKey:', fileKeyFromDb)
          
          // If file has base64 data, return it directly
          if ((file.fileData && file.fileData.trim() !== '') || (file.file_data && file.file_data.trim() !== '')) {
            const base64Data = file.fileData || file.file_data
            const dataUrl = `data:${file.mimeType || file.mime_type || 'application/octet-stream'};base64,${base64Data}`
            
            return NextResponse.json({
              success: true,
              downloadUrl: dataUrl,
              permanent: true,
              hasData: true,
              source: 'database'
            })
          }
          
          // Otherwise, treat fileKeyFromDb as a Storj fileKey and generate URL
          if (fileKeyFromDb && (fileKeyFromDb.includes('nominations/') || fileKeyFromDb.startsWith('nominations/'))) {
            try {
              // Normalize file key
              let normalizedKey = fileKeyFromDb;
              const bucketName = process.env.STORJ_BUCKET_NAME || 'kmselection';
              
              // Remove bucket prefixes
              normalizedKey = normalizedKey.replace(/^kmselection\/kmselection\//, 'kmselection/');
              normalizedKey = normalizedKey.replace(/^kmselection\/nominations\//, 'nominations/');
              normalizedKey = normalizedKey.replace(/^nominations\/nominations\//, 'nominations/');
              if (normalizedKey.startsWith(`${bucketName}/`)) {
                normalizedKey = normalizedKey.substring(bucketName.length + 1);
              }
              
              const { generateDownloadUrl } = require('@/lib/storj')
              const downloadUrl = await generateDownloadUrl(normalizedKey, 604800)
              
              return NextResponse.json({
                success: true,
                downloadUrl: downloadUrl,
                source: 'storj',
                fileKey: normalizedKey
              })
            } catch (storjError) {
              console.error('Failed to generate Storj URL from database fileKey:', storjError)
              // Fall through to try with the provided fileKey
            }
          }
        }
      } catch (dbError) {
        console.error('Database lookup failed:', dbError)
      }
    }
    
    // PRIORITY 1: Try Storj first (for all files that look like Storj files)
    if (fileKey && (fileKey.includes('nominations/') || fileKey.includes('kmselection/')) && !fileKey.includes('_serverless') && !fileKey.includes('_mock')) {
      // Check if Storj is configured
      if (!process.env.STORJ_ACCESS_KEY_ID || !process.env.STORJ_SECRET_ACCESS_KEY) {
        return NextResponse.json(
          { 
            error: 'Storj storage is not configured. Please contact the administrator.',
            details: 'STORJ_ACCESS_KEY_ID and STORJ_SECRET_ACCESS_KEY environment variables are required.'
          },
          { status: 503 }
        )
      }
      
      let normalizedKey = '';
      try {
        // Normalize file key - remove bucket prefix patterns
        normalizedKey = fileKey.trim();
        const bucketName = process.env.STORJ_BUCKET_NAME || 'kmselection';
        
        // Remove double bucket prefixes first
        normalizedKey = normalizedKey.replace(/^kmselection\/kmselection\//, '');
        normalizedKey = normalizedKey.replace(/^kmselection\/nominations\//, 'nominations/');
        normalizedKey = normalizedKey.replace(/^nominations\/nominations\//, 'nominations/');
        
        // Remove single bucket prefix if still present
        if (normalizedKey.startsWith(`${bucketName}/`)) {
          normalizedKey = normalizedKey.substring(bucketName.length + 1);
        }
        
        // Ensure it starts with nominations/ (correct format)
        if (!normalizedKey.startsWith('nominations/')) {
          // Try to extract just the nominations part
          const nominationsMatch = normalizedKey.match(/nominations\/.+/);
          if (nominationsMatch) {
            normalizedKey = nominationsMatch[0];
          } else if (normalizedKey.includes('nomination_')) {
            // Reconstruct from parts
            const parts = normalizedKey.split('/');
            const nominationsIndex = parts.findIndex((p: string) => p.includes('nomination_'));
            if (nominationsIndex >= 0) {
              normalizedKey = 'nominations/' + parts.slice(nominationsIndex).join('/');
            }
          }
        }
        
        console.log(`Normalized file key: ${fileKey} -> ${normalizedKey}`);
        
        // Import storj functions dynamically
        const { generateDownloadUrl, fileExistsInStorj } = require('@/lib/storj')
        
        // Check if file exists first
        const exists = await fileExistsInStorj(normalizedKey);
        if (!exists) {
          console.error(`❌ File does not exist in Storj: ${normalizedKey} (original: ${fileKey})`);
          return NextResponse.json(
            { 
              error: 'File not found in Storj',
              details: `The file "${normalizedKey}" does not exist. Original key: "${fileKey}"`,
              originalKey: fileKey,
              normalizedKey: normalizedKey
            },
            { status: 404 }
          )
        }
        
        const downloadUrl = await generateDownloadUrl(normalizedKey, 604800) // 7 days expiry
        
        console.log(`✅ Generated download URL for ${normalizedKey}:`, downloadUrl.substring(0, 100) + '...');
        
        return NextResponse.json({
          success: true,
          downloadUrl: downloadUrl,
          source: 'storj',
          fileKey: normalizedKey,
          originalKey: fileKey
        })
      } catch (storjError) {
        console.error('Error generating Storj URL:', storjError)
        const errorMessage = storjError instanceof Error ? storjError.message : 'Unknown error';
        
        // Check if it's a NoSuchKey error - provide helpful message
        if (errorMessage.includes('NoSuchKey') || errorMessage.includes('does not exist')) {
          return NextResponse.json(
            { 
              error: 'File not found in Storj',
              details: `The file key "${normalizedKey || fileKey}" does not exist in Storj. This may be due to incorrect file path or the file was not uploaded correctly.`,
              originalKey: fileKey,
              normalizedKey: normalizedKey || 'not normalized'
            },
            { status: 404 }
          )
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to generate Storj URL',
            details: errorMessage
          },
          { status: 500 }
        )
      }
    }
    
    // File not found in any storage
    return NextResponse.json(
      { error: 'File not found in any storage backend' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error in POST /api/admin/view-document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Bypass session check for hardcoded admin - allow all document access
    console.log('View document GET API called - bypassing admin check for development')
    
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    console.log('Admin view-document requested for path:', filePath)
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // ALWAYS check database first for permanent access
    if (process.env.DATABASE_URL) {
      try {
        const fileName = filePath.split('/').pop() || ''
        const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.')
        
        let uploadedFile: any[] = []
        
        try {
          uploadedFile = await prisma.$queryRaw`
            SELECT * FROM uploaded_files 
            WHERE "filePath" = ${filePath} 
               OR "filePath" = ${fileName}
               OR "originalName" = ${fileName}
               OR "originalName" LIKE ${'%' + fileNameWithoutExt + '%'}
            ORDER BY "uploadedAt" DESC
            LIMIT 1
          ` as any[]
        } catch (e) {
          uploadedFile = await prisma.$queryRaw`
            SELECT * FROM uploaded_files 
            WHERE file_path = ${filePath} 
               OR file_path = ${fileName}
               OR original_name = ${fileName}
               OR original_name LIKE ${'%' + fileNameWithoutExt + '%'}
            ORDER BY uploaded_at DESC
            LIMIT 1
          ` as any[]
        }

        if (uploadedFile && uploadedFile.length > 0) {
          const file = uploadedFile[0]
          const fileKeyFromDb = file.filePath || file.file_path
          
          console.log('Found file in database with fileKey:', fileKeyFromDb)
          
          // If file has base64 data, serve it directly
          if ((file.fileData && file.fileData.trim() !== '') || (file.file_data && file.file_data.trim() !== '')) {
            console.log('Serving file from database:', file.originalName || file.original_name)
            const fileBuffer = Buffer.from(file.fileData || file.file_data, 'base64')
            return new NextResponse(fileBuffer as BodyInit, {
              headers: {
                'Content-Type': file.mimeType || file.mime_type || 'application/octet-stream',
                'Cache-Control': 'private, max-age=31536000, immutable',
                'Content-Disposition': `inline; filename="${file.originalName || file.original_name}"`,
              },
            })
          }
          
          // Otherwise, treat fileKeyFromDb as a Storj fileKey and generate URL
          if (fileKeyFromDb && (fileKeyFromDb.includes('nominations/') || fileKeyFromDb.startsWith('nominations/'))) {
            try {
              // Normalize file key
              let normalizedKey = fileKeyFromDb.trim();
              const bucketName = process.env.STORJ_BUCKET_NAME || 'kmselection';
              
              // Remove bucket prefixes
              normalizedKey = normalizedKey.replace(/^kmselection\/kmselection\//, '');
              normalizedKey = normalizedKey.replace(/^kmselection\/nominations\//, 'nominations/');
              normalizedKey = normalizedKey.replace(/^nominations\/nominations\//, 'nominations/');
              if (normalizedKey.startsWith(`${bucketName}/`)) {
                normalizedKey = normalizedKey.substring(bucketName.length + 1);
              }
              
              // Ensure it starts with nominations/
              if (!normalizedKey.startsWith('nominations/')) {
                const nominationsMatch = normalizedKey.match(/nominations\/.+/);
                if (nominationsMatch) {
                  normalizedKey = nominationsMatch[0];
                } else if (normalizedKey.includes('nomination_')) {
                  const parts = normalizedKey.split('/');
                  const nominationsIndex = parts.findIndex((p: string) => p.includes('nomination_'));
                  if (nominationsIndex >= 0) {
                    normalizedKey = 'nominations/' + parts.slice(nominationsIndex).join('/');
                  }
                }
              }
              
              const { generateDownloadUrl } = require('@/lib/storj')
              const downloadUrl = await generateDownloadUrl(normalizedKey, 604800)
              
              // Redirect to Storj URL
              return NextResponse.redirect(downloadUrl)
            } catch (storjError) {
              console.error('Failed to generate Storj URL from database fileKey:', storjError)
              // Fall through to try with the provided filePath
            }
          }
        }
      } catch (dbError) {
        console.log('File not in database, trying other sources:', dbError)
      }
    }

    // Normalize file path - remove bucket prefixes
    const bucketName = process.env.STORJ_BUCKET_NAME || 'kmselection';
    let normalizedPath = filePath.trim();
    
    // Remove double bucket prefixes first
    normalizedPath = normalizedPath.replace(/^kmselection\/kmselection\//, '');
    normalizedPath = normalizedPath.replace(/^kmselection\/nominations\//, 'nominations/');
    normalizedPath = normalizedPath.replace(/^nominations\/nominations\//, 'nominations/');
    
    // Remove single bucket prefix if still present
    if (normalizedPath.startsWith(`${bucketName}/`)) {
      normalizedPath = normalizedPath.substring(bucketName.length + 1);
    }
    
    // Ensure it starts with nominations/ if it contains nomination folders
    if (!normalizedPath.startsWith('nominations/') && normalizedPath.includes('nomination_')) {
      const parts = normalizedPath.split('/');
      const nominationsIndex = parts.findIndex(p => p.includes('nomination_'));
      if (nominationsIndex >= 0) {
        normalizedPath = 'nominations/' + parts.slice(nominationsIndex).join('/');
      }
    }

    // First, check if this is a cloud URL (starting with http), redirect to it
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      console.log('Redirecting to cloud URL:', normalizedPath)
      
      // If it's a Storj URL that may be expired, try to fetch and see if it works
      if (normalizedPath.includes('storjshare.io')) {
        try {
          const testResponse = await fetch(normalizedPath, { method: 'HEAD' })
          if (testResponse.ok) {
            return NextResponse.redirect(normalizedPath)
          } else {
            console.log('Storj URL expired, trying to regenerate...')
            // Extract the key from the URL
            const urlMatch = normalizedPath.match(/nominations\/([^?]+)/)
            if (urlMatch) {
              const key = urlMatch[1]
              // Try to get from database and regenerate URL
              let uploadedFile: any[] = []
              
              try {
                uploadedFile = await prisma.$queryRaw`
                  SELECT * FROM uploaded_files WHERE "filePath" LIKE ${'%' + key + '%'} LIMIT 1
                ` as any[]
              } catch (e) {
                uploadedFile = await prisma.$queryRaw`
                  SELECT * FROM uploaded_files WHERE file_path LIKE ${'%' + key + '%'} LIMIT 1
                ` as any[]
              }
              
              if (uploadedFile && uploadedFile.length > 0) {
                const file = uploadedFile[0]
                console.log('Found file in database, serving directly:', file.originalName || file.original_name)
                const fileBuffer = Buffer.from(file.fileData || file.file_data, 'base64')
                return new NextResponse(fileBuffer as BodyInit, {
                  headers: {
                    'Content-Type': file.mimeType || file.mime_type,
                    'Cache-Control': 'private, max-age=3600',
                    'Content-Disposition': `inline; filename="${file.originalName || file.original_name}"`,
                  },
                })
              }
            }
          }
        } catch (fetchError) {
          console.error('Error checking Storj URL:', fetchError)
          // Fall through to try database
        }
      } else {
        // Not a Storj URL, just redirect
        return NextResponse.redirect(filePath)
      }
    }

    // PRIORITY: Try Storj first if path suggests Storj file
    if ((normalizedPath.includes('nominations/') || normalizedPath.includes('kmselection/')) && !normalizedPath.includes('_serverless') && !normalizedPath.includes('_mock')) {
      if (!process.env.STORJ_ACCESS_KEY_ID || !process.env.STORJ_SECRET_ACCESS_KEY) {
        return NextResponse.json(
          { 
            error: 'Storj storage is not configured',
            details: 'STORJ_ACCESS_KEY_ID and STORJ_SECRET_ACCESS_KEY environment variables are required.'
          },
          { status: 503 }
        )
      }
      
      try {
        const { generateDownloadUrl } = require('@/lib/storj');
        
        // Final normalization - remove all bucket prefixes
        let storjKey = normalizedPath;
        
        // Remove double bucket prefixes
        storjKey = storjKey.replace(/^kmselection\/kmselection\//, '');
        storjKey = storjKey.replace(/^kmselection\/nominations\//, 'nominations/');
        storjKey = storjKey.replace(/^nominations\/nominations\//, 'nominations/');
        
        // Remove single bucket prefix
        if (storjKey.startsWith(`${bucketName}/`)) {
          storjKey = storjKey.substring(bucketName.length + 1);
        }
        
        // Ensure it starts with nominations/
        if (!storjKey.startsWith('nominations/')) {
          const nominationsMatch = storjKey.match(/nominations\/.+/);
          if (nominationsMatch) {
            storjKey = nominationsMatch[0];
          } else if (storjKey.includes('nomination_')) {
            const parts = storjKey.split('/');
            const nominationsIndex = parts.findIndex(p => p.includes('nomination_'));
            if (nominationsIndex >= 0) {
              storjKey = 'nominations/' + parts.slice(nominationsIndex).join('/');
            }
          }
        }
        
        console.log(`GET endpoint - Normalized key: ${filePath} -> ${storjKey}`);
        
        const downloadUrl = await generateDownloadUrl(storjKey, 604800);
        console.log(`Storj URL generated for: ${storjKey}`);
        return NextResponse.redirect(downloadUrl);
      } catch (storjError) {
        console.error('Storj error:', storjError);
        const errorMessage = storjError instanceof Error ? storjError.message : 'Unknown error';
        
        if (errorMessage.includes('NoSuchKey') || errorMessage.includes('does not exist')) {
          return NextResponse.json(
            {
              error: 'File not found in Storj',
              details: `The file key "${normalizedPath}" does not exist in Storj. This may be due to incorrect file path or the file was not uploaded correctly.`,
              originalPath: filePath
            },
            { status: 404 }
          )
        }
        
        // Continue to try database/local storage
      }
    }

    // Second, check if this is a data URL, serve it directly
    if (normalizedPath.startsWith('data:')) {
      console.log('Serving data URL')
      // Extract base64 data and content type
      const matches = normalizedPath.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const [, mimeType, base64Data] = matches
        const fileBuffer = Buffer.from(base64Data, 'base64')
        return new NextResponse(fileBuffer as BodyInit, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'private, max-age=3600',
            'Content-Disposition': 'inline',
          },
        })
      }
    }

    // Third, check database for files stored in database using correct column names
    if (normalizedPath.includes('_cloud') || normalizedPath.includes('nominations/')) {
      try {
        let uploadedFile: any[] = []
        
        // Try matching with normalized path and original path
        try {
          uploadedFile = await prisma.$queryRaw`
            SELECT * FROM uploaded_files 
            WHERE "filePath" = ${normalizedPath} 
               OR "filePath" = ${filePath}
               OR "filePath" LIKE ${'%' + normalizedPath.split('/').pop() + '%'}
            LIMIT 1
          ` as any[]
        } catch (e) {
          uploadedFile = await prisma.$queryRaw`
            SELECT * FROM uploaded_files 
            WHERE file_path = ${normalizedPath}
               OR file_path = ${filePath}
               OR file_path LIKE ${'%' + normalizedPath.split('/').pop() + '%'}
            LIMIT 1
          ` as any[]
        }

        if (uploadedFile && uploadedFile.length > 0) {
          const file = uploadedFile[0]
          console.log('Found file in database (cloud):', file.originalName || file.original_name)
          const fileBuffer = Buffer.from(file.fileData || file.file_data, 'base64')
          return new NextResponse(fileBuffer as BodyInit, {
            headers: {
              'Content-Type': file.mimeType || file.mime_type,
              'Cache-Control': 'private, max-age=3600',
              'Content-Disposition': `inline; filename="${file.originalName || file.original_name}"`,
            },
          })
        }
      } catch (dbError) {
        console.error('Error retrieving file from database (exact match):', dbError)
      }

      // Try with _cloud suffix removed
      if (filePath.includes('_cloud')) {
        try {
          const fileNameWithoutSuffix = filePath.replace('_cloud', '').replace('.pdf', '').replace('.jpeg', '').replace('.png', '')
          let uploadedFile: any[] = []
          
          try {
            uploadedFile = await prisma.$queryRaw`
              SELECT * FROM uploaded_files WHERE "filePath" LIKE ${'%' + fileNameWithoutSuffix + '%'} LIMIT 1
            ` as any[]
          } catch (e) {
            uploadedFile = await prisma.$queryRaw`
              SELECT * FROM uploaded_files WHERE file_path LIKE ${'%' + fileNameWithoutSuffix + '%'} LIMIT 1
            ` as any[]
          }

          if (uploadedFile && uploadedFile.length > 0) {
            const file = uploadedFile[0]
            console.log('Found file in database (without _cloud):', file.originalName || file.original_name)
            const fileBuffer = Buffer.from(file.fileData || file.file_data, 'base64')
            return new NextResponse(fileBuffer as BodyInit, {
              headers: {
                'Content-Type': file.mimeType || file.mime_type,
                'Cache-Control': 'private, max-age=3600',
                'Content-Disposition': `inline; filename="${file.originalName || file.original_name}"`,
              },
            })
          }
        } catch (dbError) {
          console.error('Error retrieving file from database (without _cloud):', dbError)
        }
      }
    }

    // Fourth, try to read from local file system
    const uploadsDir = process.env.UPLOAD_DIR || './uploads'
    let actualFilePath = filePath.trim()
    
    // First normalize all slashes to forward slashes
    actualFilePath = actualFilePath.replace(/\\/g, '/')
    
    // Handle paths with "nominations/" (database format) vs "nominations_" (filesystem format)
    // Convert "nominations/folder/file" to "nominations_folder/file"
    if (actualFilePath.includes('nominations/') && !actualFilePath.includes('nominations_')) {
      actualFilePath = actualFilePath.replace(/nominations\//g, 'nominations_')
    }
    
    // Remove 'uploads/' or 'uploads\' prefix if present
    if (actualFilePath.startsWith('uploads/')) {
      actualFilePath = actualFilePath.substring(7) // Remove 'uploads/' (7 characters)
    }
    
    // Remove leading slashes
    actualFilePath = actualFilePath.replace(/^\/+/, '')
    
    if (actualFilePath.includes('..') || actualFilePath.includes('~')) {
      return NextResponse.json(
        { error: 'Invalid file path - potential security risk' },
        { status: 403 }
      )
    }
    
    const fullPath = join(process.cwd(), uploadsDir, actualFilePath)
    const normalizedLocalPath = fullPath.replace(/\\/g, '/')
    const normalizedUploadsDir = join(process.cwd(), uploadsDir).replace(/\\/g, '/')

    console.log('Full path:', fullPath)
    console.log('Normalized path:', normalizedLocalPath)
    console.log('Uploads dir:', normalizedUploadsDir)

    if (!normalizedLocalPath.startsWith(normalizedUploadsDir)) {
      console.error('Path outside uploads directory:', normalizedLocalPath)
      return NextResponse.json(
        { error: 'Invalid file path - outside uploads directory' },
        { status: 403 }
      )
    }

    if (filePath.includes('_serverless') || filePath.includes('_mock')) {
      // Attempt recovery: look for a real file in the same nomination folder that matches the prefix
      try {
        const dirRel = dirname(actualFilePath).replace(/\\/g, '/');
        const dirAbs = join(process.cwd(), uploadsDir, dirRel);
        const baseName = actualFilePath.split('/').pop() || ''
        const prefix = baseName
          .replace('_serverless', '')
          .replace('_mock', '')
          .replace(/\.[^/.]+$/, '') // remove extension if any
          .split('_').slice(0, 2).join('_') // e.g., aadhaar_1760...

        const entries = await readdir(dirAbs).catch(() => [] as string[])
        const candidateName = entries.find(name => {
          // Look for a file that starts with the type+timestamp prefix
          return name.startsWith(prefix)
        })

        if (candidateName) {
          const recoveredPath = join(dirAbs, candidateName)
          const buffer = await readFile(recoveredPath)
          const ext = candidateName.split('.').pop()?.toLowerCase()
          const contentType = ext === 'pdf' ? 'application/pdf'
            : ext === 'png' ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
            : 'application/octet-stream'

          return new NextResponse(buffer as BodyInit, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'private, max-age=3600',
              'Content-Disposition': `inline; filename="${candidateName}"`,
            },
          })
        }
      } catch (recoveryError) {
        console.error('Serverless recovery failed:', recoveryError)
      }

      const placeholderText = 'File uploaded in serverless environment - actual file not stored'
      const buffer = Buffer.from(placeholderText, 'utf-8')
      return new NextResponse(buffer as BodyInit, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    try {
      const fileBuffer = await readFile(fullPath)
      const extension = filePath.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (extension) {
        case 'pdf':
          contentType = 'application/pdf'
          break
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
        case 'gif':
          contentType = 'image/gif'
          break
        default:
          contentType = 'application/octet-stream'
      }

      return new NextResponse(fileBuffer as BodyInit, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
          'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
        },
      })
    } catch (error) {
      console.error('Error reading file from:', fullPath)
      console.error('Error details:', error)
      
      // Try alternative path formats
      const alternativePaths = [
        join(process.cwd(), uploadsDir, actualFilePath.replace(/nominations_/g, 'nominations/')),
        join(process.cwd(), 'uploads', filePath),
        join(process.cwd(), filePath)
      ]
      
      for (const altPath of alternativePaths) {
        try {
          const fileBuffer = await readFile(altPath)
          const extension = altPath.split('.').pop()?.toLowerCase()
          let contentType = 'application/octet-stream'
          
          switch (extension) {
            case 'pdf':
              contentType = 'application/pdf'
              break
            case 'jpg':
            case 'jpeg':
              contentType = 'image/jpeg'
              break
            case 'png':
              contentType = 'image/png'
              break
            case 'gif':
              contentType = 'image/gif'
              break
            default:
              contentType = 'application/octet-stream'
          }
          
          console.log('Found file at alternative path:', altPath)
          return new NextResponse(fileBuffer as BodyInit, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'private, max-age=3600',
              'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
            },
          })
        } catch (altError) {
          // Continue to next alternative
          console.log('Alternative path failed:', altPath)
        }
      }
      
      return NextResponse.json(
        { error: 'File not found in any storage location' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/admin/view-document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
