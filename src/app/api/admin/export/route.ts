import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { encryptXlsxBuffer, getExcelExportPassword } from '@/lib/xlsx-encryption'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Dynamically import ExcelJS to reduce bundle size
    const ExcelJS = (await import('exceljs')).default
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const type = searchParams.get('type') || 'all'

    let data: any = {}

    if (type === 'all' || type === 'voters') {
      // Export voter data
      const voters = await prisma.voter.findMany({
        orderBy: { createdAt: 'desc' }
      })
      data.voters = voters.map(voter => ({
        'Voter ID': voter.voterId,
        'Name': voter.name,
        'Phone': voter.phone,
        'Email': voter.email || 'N/A',
        'Region': voter.region,
        'Age': voter.age || 'N/A',
        'Gender': voter.gender || 'N/A',
        'Status': voter.isActive ? 'Active' : 'Inactive',
        'Has Voted': voter.hasVoted ? 'Yes' : 'No',
        'Registered Date': voter.createdAt.toLocaleDateString()
      }))
    }

    if (type === 'all' || type === 'candidates') {
      // Export candidate data from all candidate tables
      const [yuvaPankhCandidates, karobariCandidates, trusteeCandidates] = await Promise.all([
        prisma.yuvaPankhCandidate.findMany({
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.karobariCandidate.findMany({
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.trusteeCandidate.findMany({
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Combine all candidates
      const candidates = [
        ...yuvaPankhCandidates.map(c => ({ ...c, candidateType: 'YUVA_PANKH' })),
        ...karobariCandidates.map(c => ({ ...c, candidateType: 'KAROBARI' })),
        ...trusteeCandidates.map(c => ({ ...c, candidateType: 'TRUSTEE' }))
      ];
      data.candidates = candidates.map(candidate => ({
        'Name': candidate.user?.name || 'Unknown',
        'Email': candidate.user?.email || 'Unknown',
        'Phone': candidate.user?.phone || 'Unknown',
        'Party': candidate.party,
        'Position': candidate.position,
        'Region': candidate.region,
        'Status': candidate.status,
        'Rejection Reason': candidate.rejectionReason || '',
        'Experience': candidate.experience,
        'Education': candidate.education,
        'Submitted Date': candidate.createdAt.toLocaleDateString()
      }))
    }

    if (type === 'all' || type === 'votes') {
      // Export vote data
      const votes = await prisma.vote.findMany({
        include: {
          voter: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
        },
        orderBy: { timestamp: 'desc' }
      })
      data.votes = votes.map(vote => ({
        'Voter Name': vote.voter.user?.name || 'Unknown',
        'Voter ID': vote.voter.voterId,
        'Candidate Name': 'N/A', // Will be populated separately if needed
        'Position': vote.yuvaPankhCandidateId ? 'Yuva Pankh' : 
                   vote.karobariCandidateId ? 'Karobari' : 
                   vote.trusteeCandidateId ? 'Trustee' : 'Unknown',
        'Vote Time': vote.timestamp.toLocaleString(),
        'IP Address': vote.ipAddress,
        'Latitude': vote.latitude,
        'Longitude': vote.longitude
      }))
    }

    if (type === 'all' || type === 'results') {
      // Export election results
      const results = await prisma.vote.groupBy({
        by: ['yuvaPankhCandidateId', 'karobariCandidateId', 'trusteeCandidateId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      const resultsWithDetails = await Promise.all(
        results.map(async (result) => {
          const candidateId = result.yuvaPankhCandidateId || result.karobariCandidateId || result.trusteeCandidateId;
          const position = result.yuvaPankhCandidateId ? 'Yuva Pankh' : 
                          result.karobariCandidateId ? 'Karobari' : 
                          result.trusteeCandidateId ? 'Trustee' : 'Unknown';

          if (!candidateId) {
            return {
              'Position': position,
              'Candidate Name': 'Unknown',
              'Vote Count': result._count.id
            }
          }

          // Try to find candidate in each table
          let candidate = null;
          try {
            if (result.yuvaPankhCandidateId) {
              candidate = await prisma.yuvaPankhCandidate.findUnique({
                where: { id: result.yuvaPankhCandidateId },
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              });
            } else if (result.karobariCandidateId) {
              candidate = await prisma.karobariCandidate.findUnique({
                where: { id: result.karobariCandidateId },
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              });
            } else if (result.trusteeCandidateId) {
              candidate = await prisma.trusteeCandidate.findUnique({
                where: { id: result.trusteeCandidateId },
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              });
            }
          } catch (error) {
            // Candidate not found
          }

          return {
            'Position': position,
            'Candidate Name': candidate?.user?.name || candidate?.name || 'Unknown',
            'Party': candidate?.party || 'Unknown',
            'Vote Count': result._count.id
          }
        })
      )

      data.results = resultsWithDetails
    }

    if (format === 'excel') {
      // Create Excel workbook using ExcelJS
      const workbook = new ExcelJS.Workbook()
      
      // Add metadata
      workbook.creator = 'SKMMMS Election 2026'
      workbook.created = new Date()
      workbook.modified = new Date()

      Object.entries(data).forEach(([sheetName, sheetData]) => {
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const worksheet = workbook.addWorksheet(sheetName)
          
          // Add headers
          const headers = Object.keys(sheetData[0])
          worksheet.columns = headers.map(header => ({
            header: header,
            key: header,
            width: 20
          }))
          
          // Add data rows
          worksheet.addRows(sheetData)
          
          // Style the header row
          worksheet.getRow(1).font = { bold: true }
          worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
          }
        }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const encrypted = await encryptXlsxBuffer(buffer, getExcelExportPassword())

      return new NextResponse(encrypted, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="election-data-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    } else if (format === 'csv') {
      // Create CSV
      const csvData = Object.entries(data)
        .map(([sheetName, sheetData]) => {
          if (!Array.isArray(sheetData) || sheetData.length === 0) return ''
          
          const headers = Object.keys(sheetData[0]).join(',')
          const rows = sheetData.map(row => 
            Object.values(row).map(value => 
              typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value
            ).join(',')
          )
          
          return `=== ${sheetName.toUpperCase()} ===\n${headers}\n${rows.join('\n')}\n`
        })
        .join('\n')

      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="election-data-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Return JSON
      return NextResponse.json({
        message: 'Election data exported successfully',
        data,
        exportedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
