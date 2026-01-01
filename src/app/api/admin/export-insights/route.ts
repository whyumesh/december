import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Extend timeout to 60 seconds (Vercel Pro plan limit)
// For Next.js 14.2+, maxDuration is supported for API routes
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let timeoutWarning: NodeJS.Timeout | undefined
  
  // Gracefully handle missing database URL (e.g., during build)
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not available, returning empty export')
    return NextResponse.json({
      error: 'Database not available',
      message: 'Export functionality requires database connection'
    }, { status: 503 })
  }

  try {
    console.log('Exporting election insights...')
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Timestamp:', new Date().toISOString())
    console.log('Fetching fresh data from database...')
    
    // Set a timeout warning for long operations
    timeoutWarning = setTimeout(() => {
      console.warn('⚠️ Export operation taking longer than expected (>5 seconds)')
    }, 5000)

    // Dynamically import ExcelJS to reduce bundle size
    const ExcelJS = (await import('exceljs')).default

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SKMMMS Election 2026'
    workbook.created = new Date()
    workbook.modified = new Date()

    // ============================================
    // SHEET 1: ELECTION OVERVIEW (Merged: Summary Statistics, Voters by Region, Zone-wise Turnout)
    // ============================================
    const overviewSheet = workbook.addWorksheet('Election Overview')
    
    // Get all statistics - split into two Promise.all calls to avoid hoisting issues
    const [
      totalVoters,
      activeVoters,
      totalVotes,
      totalYuvaPankhCandidates,
      totalYuvaPankhNominees,
      totalKarobariCandidates,
      totalTrusteeCandidates,
      pendingYuvaPankhCandidates,
      pendingYuvaPankhNominees,
      approvedYuvaPankhCandidates,
      approvedYuvaPankhNominees,
      rejectedYuvaPankhCandidates,
      rejectedYuvaPankhNominees,
      pendingKarobari,
      approvedKarobari,
      rejectedKarobari,
      pendingTrustee,
      approvedTrustee,
      rejectedTrustee,
      yuvaPankhVotes,
      karobariVotes,
      trusteeVotes
    ] = await Promise.all([
      prisma.voter.count(),
      prisma.voter.count({ where: { isActive: true } }),
      prisma.vote.count(),
      prisma.yuvaPankhCandidate.count(),
      prisma.yuvaPankhNominee.count(),
      prisma.karobariCandidate.count(),
      prisma.trusteeCandidate.count(),
      prisma.yuvaPankhCandidate.count({ where: { status: 'PENDING' } }),
      prisma.yuvaPankhNominee.count({ where: { status: 'PENDING' } }),
      prisma.yuvaPankhCandidate.count({ where: { status: 'APPROVED' } }),
      prisma.yuvaPankhNominee.count({ where: { status: 'APPROVED' } }),
      prisma.yuvaPankhCandidate.count({ where: { status: 'REJECTED' } }),
      prisma.yuvaPankhNominee.count({ where: { status: 'REJECTED' } }),
      prisma.karobariCandidate.count({ where: { status: 'PENDING' } }),
      prisma.karobariCandidate.count({ where: { status: 'APPROVED' } }),
      prisma.karobariCandidate.count({ where: { status: 'REJECTED' } }),
      prisma.trusteeCandidate.count({ where: { status: 'PENDING' } }),
      prisma.trusteeCandidate.count({ where: { status: 'APPROVED' } }),
      prisma.trusteeCandidate.count({ where: { status: 'REJECTED' } }),
      prisma.vote.count({ where: { yuvaPankhCandidateId: { not: null } } }),
      prisma.vote.count({ where: { karobariCandidateId: { not: null } } }),
      prisma.vote.count({ where: { trusteeCandidateId: { not: null } } })
    ])

    // Count NOTA votes separately to avoid hoisting issues
    const [yuvaPankhNotaCandidates, karobariNotaCandidates, trusteeNotaCandidates] = await Promise.all([
      prisma.yuvaPankhCandidate.findMany({
        where: { position: 'NOTA' },
        select: { id: true }
      }),
      prisma.karobariCandidate.findMany({
        where: { position: 'NOTA' },
        select: { id: true }
      }),
      prisma.trusteeCandidate.findMany({
        where: { position: 'NOTA' },
        select: { id: true }
      })
    ])

    // Extract IDs before Promise.all to avoid hoisting issues
    const yuvaPankhNotaIds = yuvaPankhNotaCandidates.map(c => c.id)
    const karobariNotaIds = karobariNotaCandidates.map(c => c.id)
    const trusteeNotaIds = trusteeNotaCandidates.map(c => c.id)

    const [yuvaPankhNotaVotes, karobariNotaVotes, trusteeNotaVotes] = await Promise.all([
      yuvaPankhNotaIds.length > 0
        ? prisma.vote.count({ where: { yuvaPankhCandidateId: { in: yuvaPankhNotaIds } } })
        : Promise.resolve(0),
      karobariNotaIds.length > 0
        ? prisma.vote.count({ where: { karobariCandidateId: { in: karobariNotaIds } } })
        : Promise.resolve(0),
      trusteeNotaIds.length > 0
        ? prisma.vote.count({ where: { trusteeCandidateId: { in: trusteeNotaIds } } })
        : Promise.resolve(0)
    ])
    
    console.log('Database counts fetched:', {
      totalVoters,
      activeVoters,
      totalVotes,
      yuvaPankhVotes,
      karobariVotes,
      trusteeVotes,
      timestamp: new Date().toISOString()
    })

    const pendingYuvaPankh = pendingYuvaPankhCandidates + pendingYuvaPankhNominees
    const approvedYuvaPankh = approvedYuvaPankhCandidates + approvedYuvaPankhNominees
    const rejectedYuvaPankh = rejectedYuvaPankhCandidates + rejectedYuvaPankhNominees

    // Voter statistics - optimized with parallel queries
    const [votersWithYuvaPankZone, votersWithKarobariZone, votersWithTrusteeZone] = await Promise.all([
      prisma.voter.count({ where: { yuvaPankZoneId: { not: null } } }),
      prisma.voter.count({ where: { karobariZoneId: { not: null } } }),
      prisma.voter.count({ where: { trusteeZoneId: { not: null } } })
    ])
    
    // Voters who have voted (count distinct voters) - optimized with parallel queries
    // Note: Prisma distinct doesn't work with select, so we fetch and deduplicate
    const [yuvaPankhVotesForCount, karobariVotesForCount, trusteeVotesForCount] = await Promise.all([
      prisma.vote.findMany({
        where: { election: { type: 'YUVA_PANK' } },
        select: { voterId: true }
      }),
      prisma.vote.findMany({
        where: { election: { type: 'KAROBARI_MEMBERS' } },
        select: { voterId: true }
      }),
      prisma.vote.findMany({
        where: { election: { type: 'TRUSTEES' } },
        select: { voterId: true }
      })
    ])
    
    // Deduplicate by voterId
    const votersVotedYuvaPankh = new Set(yuvaPankhVotesForCount.map(v => v.voterId)).size
    const votersVotedKarobari = new Set(karobariVotesForCount.map(v => v.voterId)).size
    const votersVotedTrustee = new Set(trusteeVotesForCount.map(v => v.voterId)).size

    // Get voters by region data
    const votersByRegion = await prisma.voter.groupBy({
      by: ['region'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    // Get zone-wise turnout data
    const allZones = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ electionType: 'asc' }, { name: 'asc' }]
    })

    // Process zones for turnout data
    const zonePromises = allZones.map(async (zone) => {
      let voterCount = 0
      let voteCount = 0

      try {
        if (zone.electionType === 'YUVA_PANK') {
          voterCount = await prisma.voter.count({ where: { yuvaPankZoneId: zone.id } })
          const uniqueVoters = await prisma.vote.findMany({
            where: {
              yuvaPankhCandidate: { zoneId: zone.id }
            },
            select: { voterId: true },
            distinct: ['voterId']
          })
          voteCount = uniqueVoters.length
        } else if (zone.electionType === 'KAROBARI_MEMBERS') {
          voterCount = await prisma.voter.count({ where: { karobariZoneId: zone.id } })
          const uniqueVoters = await prisma.vote.findMany({
            where: {
              karobariCandidate: { zoneId: zone.id }
            },
            select: { voterId: true },
            distinct: ['voterId']
          })
          voteCount = uniqueVoters.length
        } else if (zone.electionType === 'TRUSTEES') {
          voterCount = await prisma.voter.count({ where: { trusteeZoneId: zone.id } })
          const uniqueVoters = await prisma.vote.findMany({
            where: {
              trusteeCandidate: { zoneId: zone.id }
            },
            select: { voterId: true },
            distinct: ['voterId']
          })
          voteCount = uniqueVoters.length
        }

        const turnout = voterCount > 0 ? ((voteCount / voterCount) * 100).toFixed(2) + '%' : '0%'

        return {
          electionType: zone.electionType,
          zoneName: zone.name,
          totalVoters: voterCount,
          votesCast: voteCount,
          turnout,
          seats: zone.seats
        }
      } catch (zoneError) {
        console.error(`Error processing zone ${zone.id}:`, zoneError)
        return {
          electionType: zone.electionType,
          zoneName: zone.name,
          totalVoters: 0,
          votesCast: 0,
          turnout: 'Error',
          seats: zone.seats
        }
      }
    })

    const zoneResults = await Promise.all(zonePromises)

    // Set column widths for all sections
    overviewSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Region', key: 'region', width: 25 },
      { header: 'Total Voters', key: 'total', width: 15 },
      { header: 'With Yuva Pankh Zone', key: 'yuvaPank', width: 20 },
      { header: 'With Karobari Zone', key: 'karobari', width: 20 },
      { header: 'With Trustee Zone', key: 'trustee', width: 20 },
      { header: 'Election Type', key: 'electionType', width: 20 },
      { header: 'Zone Name', key: 'zoneName', width: 25 },
      { header: 'Total Voters (Zone)', key: 'totalVoters', width: 15 },
      { header: 'Votes Cast', key: 'votesCast', width: 15 },
      { header: 'Turnout %', key: 'turnout', width: 15 },
      { header: 'Seats', key: 'seats', width: 10 }
    ]

    // SECTION 1: Summary Statistics

    const summaryStartRow = 1
    overviewSheet.addRows([
      { metric: 'Total Voters', value: totalVoters },
      { metric: 'Active Voters', value: activeVoters },
      { metric: 'Inactive Voters', value: totalVoters - activeVoters },
      { metric: '', value: '' },
      { metric: 'Voters with Yuva Pankh Zone', value: votersWithYuvaPankZone },
      { metric: 'Voters with Karobari Zone', value: votersWithKarobariZone },
      { metric: 'Voters with Trustee Zone', value: votersWithTrusteeZone },
      { metric: '', value: '' },
      { metric: 'Total Votes Cast', value: totalVotes },
      { metric: 'Yuva Pankh Votes', value: yuvaPankhVotes },
      { metric: 'Karobari Votes', value: karobariVotes },
      { metric: 'Trustee Votes', value: trusteeVotes },
      { metric: 'Yuva Pankh NOTA Votes', value: yuvaPankhNotaVotes },
      { metric: 'Karobari NOTA Votes', value: karobariNotaVotes },
      { metric: 'Trustee NOTA Votes', value: trusteeNotaVotes },
      { metric: '', value: '' },
      { metric: 'Voters Voted - Yuva Pankh', value: votersVotedYuvaPankh },
      { metric: 'Voters Voted - Karobari', value: votersVotedKarobari },
      { metric: 'Voters Voted - Trustee', value: votersVotedTrustee },
      { metric: '', value: '' },
      { metric: 'Yuva Pankh Turnout %', value: votersWithYuvaPankZone > 0 ? ((votersVotedYuvaPankh / votersWithYuvaPankZone) * 100).toFixed(2) + '%' : '0%' },
      { metric: 'Karobari Turnout %', value: votersWithKarobariZone > 0 ? ((votersVotedKarobari / votersWithKarobariZone) * 100).toFixed(2) + '%' : '0%' },
      { metric: 'Trustee Turnout %', value: votersWithTrusteeZone > 0 ? ((votersVotedTrustee / votersWithTrusteeZone) * 100).toFixed(2) + '%' : '0%' },
      { metric: '', value: '' },
      { metric: 'Yuva Pankh Candidates (Total)', value: totalYuvaPankhCandidates + totalYuvaPankhNominees },
      { metric: 'Yuva Pankh - Pending', value: pendingYuvaPankh },
      { metric: 'Yuva Pankh - Approved', value: approvedYuvaPankh },
      { metric: 'Yuva Pankh - Rejected', value: rejectedYuvaPankh },
      { metric: '', value: '' },
      { metric: 'Karobari Candidates (Total)', value: totalKarobariCandidates },
      { metric: 'Karobari - Pending', value: pendingKarobari },
      { metric: 'Karobari - Approved', value: approvedKarobari },
      { metric: 'Karobari - Rejected', value: rejectedKarobari },
      { metric: '', value: '' },
      { metric: 'Trustee Candidates (Total)', value: totalTrusteeCandidates },
      { metric: 'Trustee - Pending', value: pendingTrustee },
      { metric: 'Trustee - Approved', value: approvedTrustee },
      { metric: 'Trustee - Rejected', value: rejectedTrustee }
    ])

    // Style summary section header
    overviewSheet.getRow(summaryStartRow).font = { bold: true, size: 12 }
    overviewSheet.getRow(summaryStartRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    overviewSheet.getRow(summaryStartRow).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // SECTION 2: Voters by Region
    const regionStartRow = overviewSheet.rowCount + 3 // Add 3 rows spacing
    overviewSheet.getCell(`A${regionStartRow}`).value = 'VOTERS BY REGION'
    overviewSheet.getCell(`A${regionStartRow}`).font = { bold: true, size: 14 }
    overviewSheet.mergeCells(`A${regionStartRow}:E${regionStartRow}`)

    const regionHeaderRow = regionStartRow + 1
    overviewSheet.getRow(regionHeaderRow).values = ['Region', 'Total Voters', 'With Yuva Pankh Zone', 'With Karobari Zone', 'With Trustee Zone']
    overviewSheet.getRow(regionHeaderRow).font = { bold: true, size: 12 }
    overviewSheet.getRow(regionHeaderRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    overviewSheet.getRow(regionHeaderRow).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Batch all region queries in parallel for better performance
    const regionQueries = votersByRegion.map(async (regionGroup) => {
      const region = regionGroup.region
      const [yuvaPank, karobari, trustee] = await Promise.all([
        prisma.voter.count({ where: { region, yuvaPankZoneId: { not: null } } }),
        prisma.voter.count({ where: { region, karobariZoneId: { not: null } } }),
        prisma.voter.count({ where: { region, trusteeZoneId: { not: null } } })
      ])
      return {
        region: region || 'Unknown',
        total: regionGroup._count.id,
        yuvaPank,
        karobari,
        trustee
      }
    })
    
    const regionResults = await Promise.all(regionQueries)
    regionResults.forEach(result => {
      overviewSheet.addRow([
        result.region,
        result.total,
        result.yuvaPank,
        result.karobari,
        result.trustee
      ])
    })

    // SECTION 3: Zone-wise Turnout
    const turnoutStartRow = overviewSheet.rowCount + 3 // Add 3 rows spacing
    overviewSheet.getCell(`A${turnoutStartRow}`).value = 'ZONE-WISE TURNOUT'
    overviewSheet.getCell(`A${turnoutStartRow}`).font = { bold: true, size: 14 }
    overviewSheet.mergeCells(`A${turnoutStartRow}:F${turnoutStartRow}`)

    const turnoutHeaderRow = turnoutStartRow + 1
    overviewSheet.getRow(turnoutHeaderRow).values = ['Election Type', 'Zone Name', 'Total Voters', 'Votes Cast', 'Turnout %', 'Seats']
    overviewSheet.getRow(turnoutHeaderRow).font = { bold: true, size: 12 }
    overviewSheet.getRow(turnoutHeaderRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    }
    overviewSheet.getRow(turnoutHeaderRow).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    zoneResults.forEach(result => {
      overviewSheet.addRow([
        result.electionType,
        result.zoneName,
        result.totalVoters,
        result.votesCast,
        result.turnout,
        result.seats
      ])
    })

    // ============================================
    // SHEET 3: ELECTION RESULTS - YUVA PANKH
    // ============================================
    const yuvaPankhResultsSheet = workbook.addWorksheet('Yuva Pankh Results')
    
    // Use aggregation query instead of fetching all votes
    const yuvaPankhVoteCounts = await prisma.vote.groupBy({
      by: ['yuvaPankhCandidateId'],
      where: { yuvaPankhCandidateId: { not: null } },
      _count: { id: true }
    })

    // Get candidate and zone info in parallel
    const yuvaPankhCandidateIds = yuvaPankhVoteCounts.map(v => v.yuvaPankhCandidateId!).filter(Boolean)
    const candidates = await prisma.yuvaPankhCandidate.findMany({
      where: { id: { in: yuvaPankhCandidateIds } },
      select: {
        id: true,
        name: true,
        zoneId: true,
        user: { select: { name: true } }
      }
    })

    // Get zones in one query
    const zoneIds = [...new Set(candidates.map(c => c.zoneId).filter(Boolean) as string[])]
    const zones = await prisma.zone.findMany({
      where: { id: { in: zoneIds } },
      select: { id: true, name: true }
    })
    const zoneMap = new Map(zones.map(z => [z.id, z.name]))

    // Build results map
    const yuvaPankhResults = new Map<string, Array<{ name: string; votes: number }>>()
    
    yuvaPankhVoteCounts.forEach(voteCount => {
      if (!voteCount.yuvaPankhCandidateId) return
      const candidate = candidates.find(c => c.id === voteCount.yuvaPankhCandidateId)
      if (!candidate) return
      
      const zoneId = candidate.zoneId || 'Unknown'
      const candidateName = candidate.user?.name || candidate.name || 'Unknown'
      const voteCountNum = voteCount._count.id

      if (!yuvaPankhResults.has(zoneId)) {
        yuvaPankhResults.set(zoneId, [])
      }
      yuvaPankhResults.get(zoneId)!.push({ name: candidateName, votes: voteCountNum })
    })

    yuvaPankhResultsSheet.columns = [
      { header: 'Zone', key: 'zone', width: 25 },
      { header: 'Candidate Name', key: 'candidate', width: 30 },
      { header: 'Vote Count', key: 'votes', width: 15 },
      { header: 'Rank', key: 'rank', width: 10 }
    ]

    for (const [zoneId, candidates] of yuvaPankhResults.entries()) {
      const zoneName = zoneMap.get(zoneId) || zoneId
      const sortedCandidates = candidates.sort((a, b) => b.votes - a.votes)
      
      sortedCandidates.forEach((candidate, index) => {
        yuvaPankhResultsSheet.addRow({
          zone: zoneName,
          candidate: candidate.name,
          votes: candidate.votes,
          rank: index + 1
        })
      })
      
      // Add empty row between zones
      yuvaPankhResultsSheet.addRow({ zone: '', candidate: '', votes: '', rank: '' })
    }

    yuvaPankhResultsSheet.getRow(1).font = { bold: true, size: 12 }
    yuvaPankhResultsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }
    yuvaPankhResultsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // ============================================
    // SHEET 4: ELECTION RESULTS - TRUSTEE
    // ============================================
    const trusteeResultsSheet = workbook.addWorksheet('Trustee Results')
    
    // Use aggregation query instead of fetching all votes
    const trusteeVoteCounts = await prisma.vote.groupBy({
      by: ['trusteeCandidateId'],
      where: { trusteeCandidateId: { not: null } },
      _count: { id: true }
    })

    // Get candidate and zone info in parallel
    const trusteeCandidateIds = trusteeVoteCounts.map(v => v.trusteeCandidateId!).filter(Boolean)
    const trusteeCandidates = await prisma.trusteeCandidate.findMany({
      where: { id: { in: trusteeCandidateIds } },
      select: {
        id: true,
        name: true,
        zoneId: true,
        user: { select: { name: true } }
      }
    })

    // Build results map
    const trusteeResults = new Map<string, Array<{ name: string; votes: number }>>()
    
    trusteeVoteCounts.forEach(voteCount => {
      if (!voteCount.trusteeCandidateId) return
      const candidate = trusteeCandidates.find(c => c.id === voteCount.trusteeCandidateId)
      if (!candidate) return
      
      const zoneId = candidate.zoneId || 'Unknown'
      const candidateName = candidate.user?.name || candidate.name || 'Unknown'
      const voteCountNum = voteCount._count.id

      if (!trusteeResults.has(zoneId)) {
        trusteeResults.set(zoneId, [])
      }
      trusteeResults.get(zoneId)!.push({ name: candidateName, votes: voteCountNum })
    })

    trusteeResultsSheet.columns = [
      { header: 'Zone', key: 'zone', width: 25 },
      { header: 'Trustee Name', key: 'candidate', width: 30 },
      { header: 'Vote Count', key: 'votes', width: 15 },
      { header: 'Rank', key: 'rank', width: 10 }
    ]

    // Get zones for trustee
    const trusteeZoneIds = [...new Set(trusteeCandidates.map(c => c.zoneId).filter(Boolean) as string[])]
    const trusteeZones = await prisma.zone.findMany({
      where: { id: { in: trusteeZoneIds } },
      select: { id: true, name: true }
    })
    const trusteeZoneMap = new Map(trusteeZones.map(z => [z.id, z.name]))

    for (const [zoneId, candidates] of trusteeResults.entries()) {
      const zoneName = trusteeZoneMap.get(zoneId) || zoneId
      const sortedCandidates = candidates.sort((a, b) => b.votes - a.votes)
      
      sortedCandidates.forEach((candidate, index) => {
        trusteeResultsSheet.addRow({
          zone: zoneName,
          candidate: candidate.name,
          votes: candidate.votes,
          rank: index + 1
        })
      })
      
      trusteeResultsSheet.addRow({ zone: '', candidate: '', votes: '', rank: '' })
    }

    trusteeResultsSheet.getRow(1).font = { bold: true, size: 12 }
    trusteeResultsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7030A0' }
    }
    trusteeResultsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }


    // ============================================
    // SHEET 4: VOTER PARTICIPATION STATUS
    // ============================================
    
    // Fetch votes to determine who has voted (without revealing who they voted for)
    console.log('Fetching votes from database (for participation tracking only)...')
    const allVotes = await prisma.vote.findMany({
      select: {
        id: true,
        voterId: true,
        yuvaPankhCandidateId: true,
        karobariCandidateId: true,
        trusteeCandidateId: true,
        ipAddress: true,
        timestamp: true,
        election: {
          select: {
            type: true,
            title: true
          }
        }
      }
    })
    
    console.log(`Fetched ${allVotes.length} votes from database at ${new Date().toISOString()}`)

    // Fetch voters who have voted (for participation tracking)
    const voterIds = [...new Set(allVotes.map(v => v.voterId).filter((id): id is string => Boolean(id)))]
    const voters = voterIds.length > 0 ? await prisma.voter.findMany({
      where: { id: { in: voterIds } },
      select: {
        id: true,
        voterId: true,
        name: true,
        phone: true,
        region: true,
        yuvaPankZone: { select: { name: true } },
        karobariZone: { select: { name: true } },
        trusteeZone: { select: { name: true } }
      }
    }) : []

    // Create lookup maps for participation tracking only (not for showing who voted to whom)
    const voterMap = new Map(voters.map(v => [v.id, v]))
    
    // Fetch candidate info only for NOTA detection (not for showing who voted to whom)
    const voteCandidateIds = {
      yuvaPankh: [...new Set(allVotes.map(v => v.yuvaPankhCandidateId).filter((id): id is string => Boolean(id)))],
      karobari: [...new Set(allVotes.map(v => v.karobariCandidateId).filter((id): id is string => Boolean(id)))],
      trustee: [...new Set(allVotes.map(v => v.trusteeCandidateId).filter((id): id is string => Boolean(id)))]
    }

    const [yuvaCandidatesForVotes, karobariCandidatesForVotes, trusteeCandidatesForVotes] = await Promise.all([
      voteCandidateIds.yuvaPankh.length > 0 ? prisma.yuvaPankhCandidate.findMany({
        where: { id: { in: voteCandidateIds.yuvaPankh } },
        select: {
          id: true,
          name: true,
          position: true
        }
      }) : Promise.resolve([]),
      voteCandidateIds.karobari.length > 0 ? prisma.karobariCandidate.findMany({
        where: { id: { in: voteCandidateIds.karobari } },
        select: {
          id: true,
          name: true,
          position: true
        }
      }) : Promise.resolve([]),
      voteCandidateIds.trustee.length > 0 ? prisma.trusteeCandidate.findMany({
        where: { id: { in: voteCandidateIds.trustee } },
        select: {
          id: true,
          name: true
        }
      }) : Promise.resolve([])
    ])

    // Create lookup maps for NOTA detection only
    const yuvaCandidateMap = new Map(yuvaCandidatesForVotes.map(c => [c.id, c]))
    const karobariCandidateMap = new Map(karobariCandidatesForVotes.map(c => [c.id, c]))
    const trusteeCandidateMap = new Map(trusteeCandidatesForVotes.map(c => [c.id, c]))

    // ============================================
    // NOTE: Detailed Voting Data sheet removed for privacy
    // This sheet would show who voted to whom, which violates voter privacy
    // All insights are available in other sheets without revealing individual vote choices
    // ============================================
    
    const voterParticipationSheet = workbook.addWorksheet('Voter Participation')
    voterParticipationSheet.columns = [
      { header: 'Voter ID', key: 'voterId', width: 18 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Region', key: 'region', width: 20 },
      { header: 'Yuva Pankh Status', key: 'yuvaStatus', width: 30 },
      { header: 'Karobari Status', key: 'karobariStatus', width: 30 },
      { header: 'Trustee Status', key: 'trusteeStatus', width: 30 }
    ]

    // Create lookup maps for NOTA detection only (already created above, but ensuring they're available)
    // Maps are created on lines 776-778, so they're available here

    // Helper type for vote meta (used for participation stats only, not for showing who voted to whom)
    type VoteType = {
      id: string
      voterId: string | null
      yuvaPankhCandidateId: string | null
      karobariCandidateId: string | null
      trusteeCandidateId: string | null
      timestamp: Date
      election: {
        type: string | null
        title: string | null
      } | null
    }

    // Helper function for vote meta (used for participation stats only, not for showing who voted to whom)
    // Must be defined before forEach loop that uses it
    const getVoteMeta = (vote: VoteType) => {
      if (vote.trusteeCandidateId) {
        const candidate = trusteeCandidateMap.get(vote.trusteeCandidateId)
        if (candidate) {
          const isNota = candidate.name?.startsWith('NOTA') || false
          return { isNota }
        }
      }
      if (vote.karobariCandidateId) {
        const candidate = karobariCandidateMap.get(vote.karobariCandidateId)
        if (candidate) {
          const isNota = candidate.position === 'NOTA' || candidate.name?.startsWith('NOTA') || false
          return { isNota }
        }
      }
      if (vote.yuvaPankhCandidateId) {
        const candidate = yuvaCandidateMap.get(vote.yuvaPankhCandidateId)
        if (candidate) {
          const isNota = candidate.position === 'NOTA' || candidate.name?.startsWith('NOTA') || false
          return { isNota }
        }
      }
      return { isNota: false }
    }

    // Use already fetched voters instead of querying again
    const voterRecords = voters

    const voteParticipationMap = new Map<string, Record<string, { total: number; nota: number }>>()
    allVotes.forEach(vote => {
      const electionType = vote.election?.type
      if (!electionType || !vote.voterId) return
      if (!voteParticipationMap.has(vote.voterId)) {
        voteParticipationMap.set(vote.voterId, {})
      }
      const electionStats = voteParticipationMap.get(vote.voterId)!
      if (!electionStats[electionType]) {
        electionStats[electionType] = { total: 0, nota: 0 }
      }
      electionStats[electionType].total += 1
      const meta = getVoteMeta(vote)
      if (meta.isNota) {
        electionStats[electionType].nota += 1
      }
    })

    const formatParticipationStatus = (hasZone: boolean, stats?: { total: number; nota: number }) => {
      if (!hasZone) return 'Not Eligible'
      if (!stats || stats.total === 0) return 'Not Voted'
      if (stats.total === stats.nota) return `Voted (NOTA only - ${stats.nota})`
      if (stats.nota > 0) {
        return `Voted (${stats.total - stats.nota} candidate, ${stats.nota} NOTA)`
      }
      return `Voted (${stats.total} selections)`
    }

    voterRecords.forEach(voter => {
      const participation = voteParticipationMap.get(voter.id) || {}
      voterParticipationSheet.addRow({
        voterId: voter.voterId,
        name: voter.name,
        phone: voter.phone || 'N/A',
        region: voter.region || 'N/A',
        yuvaStatus: formatParticipationStatus(!!voter.yuvaPankZone, participation['YUVA_PANK']),
        karobariStatus: formatParticipationStatus(!!voter.karobariZone, participation['KAROBARI_MEMBERS']),
        trusteeStatus: formatParticipationStatus(!!voter.trusteeZone, participation['TRUSTEES'])
      })
    })

    voterParticipationSheet.getRow(1).font = { bold: true, size: 12 }
    voterParticipationSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9B59B6' }
    }
    voterParticipationSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    
    // ============================================
    // SHEET: VOTER VOTE DETAILS (IP Address, Timestamp, MAC ID, Browser Details)
    // ============================================
    const voterVoteDetailsSheet = workbook.addWorksheet('Voter Vote Details')
    
    // Fetch all votes with voter information, IP, timestamp, and user agent
    const votesWithDetails = await prisma.vote.findMany({
      include: {
        voter: {
          select: {
            voterId: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })
    
    voterVoteDetailsSheet.columns = [
      { header: 'Voter ID', key: 'voterId', width: 18 },
      { header: 'Voter Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'IP Address', key: 'ipAddress', width: 18 },
      { header: 'Browser Details', key: 'userAgent', width: 50 },
      { header: 'Vote Timestamp', key: 'timestamp', width: 25 }
    ]
    
    votesWithDetails.forEach(vote => {
      voterVoteDetailsSheet.addRow({
        voterId: vote.voter.voterId,
        name: vote.voter.name,
        phone: vote.voter.phone || 'N/A',
        ipAddress: vote.ipAddress || 'N/A',
        userAgent: vote.userAgent || 'N/A',
        timestamp: vote.timestamp.toLocaleString('en-US', { 
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      })
    })
    
    voterVoteDetailsSheet.getRow(1).font = { bold: true, size: 12 }
    voterVoteDetailsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E75B6' }
    }
    voterVoteDetailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    
    // ============================================
    // SHEET: VOTER ELECTION STATUS (All Voters with Eligibility & Voting Status)
    // This sheet includes ALL voters with their eligibility and voting status (Yes/No)
    // Does NOT show who voted to whom - only shows if they voted or not
    // ============================================
    const voterVotingStatusSheet = workbook.addWorksheet('Voter Election Status')
    voterVotingStatusSheet.columns = [
      { header: 'Voter ID', key: 'voterId', width: 18 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Region', key: 'region', width: 20 },
      { header: 'Yuva Pankh Eligible', key: 'yuvaEligible', width: 22 },
      { header: 'Karobari Eligible', key: 'karobariEligible', width: 20 },
      { header: 'Trustee Eligible', key: 'trusteeEligible', width: 20 },
      { header: 'Yuva Pankh Voted', key: 'yuvaVoted', width: 20 },
      { header: 'Karobari Voted', key: 'karobariVoted', width: 20 },
      { header: 'Trustee Voted', key: 'trusteeVoted', width: 20 }
    ]

    // Create a map of voters who have voted in each election type
    const votersVotedMap = new Map<string, Set<string>>()
    allVotes.forEach(vote => {
      const electionType = vote.election?.type
      if (!electionType || !vote.voterId) return
      if (!votersVotedMap.has(electionType)) {
        votersVotedMap.set(electionType, new Set())
      }
      votersVotedMap.get(electionType)!.add(vote.voterId)
    })

    // Helper function to calculate age as of a specific date
    const calculateAgeAsOf = (dob: Date | string | null | undefined, referenceDate: Date): number | null => {
      if (!dob) return null
      
      try {
        let birthDate: Date
        if (dob instanceof Date) {
          birthDate = dob
        } else if (typeof dob === 'string') {
          // Handle DD/MM/YYYY format
          const parts = dob.split('/')
          if (parts.length !== 3) return null
          const day = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10) - 1
          const year = parseInt(parts[2], 10)
          if (isNaN(day) || isNaN(month) || isNaN(year)) return null
          birthDate = new Date(year, month, day)
        } else {
          return null
        }
        
        let age = referenceDate.getFullYear() - birthDate.getFullYear()
        const monthDiff = referenceDate.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
          age--
        }
        
        return age
      } catch {
        return null
      }
    }

    // Helper function to check Yuva Pankh eligibility (18-39 as of Aug 31, 2025)
    const isEligibleForYuvaPankh = (dob: Date | string | null | undefined, yuvaPankZoneId: string | null): boolean => {
      if (!yuvaPankZoneId) return false
      const cutoffDate = new Date('2025-08-31T23:59:59')
      const age = calculateAgeAsOf(dob, cutoffDate)
      return age !== null && age >= 18 && age <= 39
    }

    // Helper function to check Trustee eligibility (45+ as of Aug 31, 2025)
    const isEligibleForTrustee = (dob: Date | string | null | undefined, trusteeZoneId: string | null): boolean => {
      if (!trusteeZoneId) return false
      const cutoffDate = new Date('2025-08-31T23:59:59')
      const age = calculateAgeAsOf(dob, cutoffDate)
      return age !== null && age >= 45
    }

    // Fetch ALL voters (not just those who voted) for this sheet
    const allVoters = await prisma.voter.findMany({
      select: {
        id: true,
        voterId: true,
        name: true,
        phone: true,
        region: true,
        dob: true,
        yuvaPankZoneId: true,
        karobariZoneId: true,
        trusteeZoneId: true,
        user: {
          select: {
            dateOfBirth: true
          }
        }
      },
      orderBy: { voterId: 'asc' }
    })

    // Add all voters with Yes/No voting status and eligibility
    allVoters.forEach(voter => {
      const yuvaVoted = votersVotedMap.get('YUVA_PANK')?.has(voter.id) ? 'Yes' : 'No'
      const karobariVoted = votersVotedMap.get('KAROBARI_MEMBERS')?.has(voter.id) ? 'Yes' : 'No'
      const trusteeVoted = votersVotedMap.get('TRUSTEES')?.has(voter.id) ? 'Yes' : 'No'

      // Check eligibility
      const dob = voter.user?.dateOfBirth || voter.dob
      const yuvaEligible = isEligibleForYuvaPankh(dob, voter.yuvaPankZoneId) ? 'Yes' : 'No'
      const karobariEligible = voter.karobariZoneId ? 'Yes' : 'No'
      const trusteeEligible = isEligibleForTrustee(dob, voter.trusteeZoneId) ? 'Yes' : 'No'

      voterVotingStatusSheet.addRow({
        voterId: voter.voterId,
        name: voter.name,
        phone: voter.phone || 'N/A',
        region: voter.region || 'N/A',
        yuvaEligible,
        karobariEligible,
        trusteeEligible,
        yuvaVoted,
        karobariVoted,
        trusteeVoted
      })
    })

    // Style the header row
    voterVotingStatusSheet.getRow(1).font = { bold: true, size: 12 }
    voterVotingStatusSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A085' }
    }
    voterVotingStatusSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Note: Conditional formatting removed for performance optimization
    // The Yes/No values are still clearly visible without color coding
    
    // NOTE: Detailed Voting Data sheet removed for privacy - does not show who voted to whom
    // All voting insights are available in other sheets without revealing individual vote choices

    // ============================================
    // SHEET: ZONE-WISE VOTER STATUS (Members Voted/Not Voted by Zone)
    // This sheet groups voters by zone and shows their eligibility and voting status
    // ============================================
    const zoneWiseVoterStatusSheet = workbook.addWorksheet('Zone-Wise Voter Status')
    zoneWiseVoterStatusSheet.columns = [
      { header: 'Election Type', key: 'electionType', width: 20 },
      { header: 'Zone Name', key: 'zoneName', width: 25 },
      { header: 'Voter ID', key: 'voterId', width: 18 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Region', key: 'region', width: 20 },
      { header: 'Eligible', key: 'eligible', width: 15 },
      { header: 'Voted', key: 'voted', width: 15 }
    ]

    // Get all zones
    const allZonesForStatus = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ electionType: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        electionType: true
      }
    })

    // Process each zone
    for (const zone of allZonesForStatus) {
      let voters: any[] = []

      // Fetch voters for this zone based on election type
      if (zone.electionType === 'YUVA_PANK') {
        voters = await prisma.voter.findMany({
          where: { yuvaPankZoneId: zone.id },
          select: {
            id: true,
            voterId: true,
            name: true,
            phone: true,
            region: true,
            dob: true,
            user: {
              select: {
                dateOfBirth: true
              }
            }
          },
          orderBy: { voterId: 'asc' }
        })
      } else if (zone.electionType === 'KAROBARI_MEMBERS') {
        voters = await prisma.voter.findMany({
          where: { karobariZoneId: zone.id },
          select: {
            id: true,
            voterId: true,
            name: true,
            phone: true,
            region: true,
            dob: true,
            user: {
              select: {
                dateOfBirth: true
              }
            }
          },
          orderBy: { voterId: 'asc' }
        })
      } else if (zone.electionType === 'TRUSTEES') {
        voters = await prisma.voter.findMany({
          where: { trusteeZoneId: zone.id },
          select: {
            id: true,
            voterId: true,
            name: true,
            phone: true,
            region: true,
            dob: true,
            user: {
              select: {
                dateOfBirth: true
              }
            }
          },
          orderBy: { voterId: 'asc' }
        })
      }

      // Process each voter in this zone
      for (const voter of voters) {
        // Check eligibility
        let eligible = 'No'
        const dob = voter.user?.dateOfBirth || voter.dob

        if (zone.electionType === 'YUVA_PANK') {
          eligible = isEligibleForYuvaPankh(dob, zone.id) ? 'Yes' : 'No'
        } else if (zone.electionType === 'KAROBARI_MEMBERS') {
          eligible = 'Yes' // All voters with karobariZoneId are eligible
        } else if (zone.electionType === 'TRUSTEES') {
          eligible = isEligibleForTrustee(dob, zone.id) ? 'Yes' : 'No'
        }

        // Check if voted
        const voted = votersVotedMap.get(zone.electionType)?.has(voter.id) ? 'Yes' : 'No'

        zoneWiseVoterStatusSheet.addRow({
          electionType: zone.electionType,
          zoneName: zone.name,
          voterId: voter.voterId,
          name: voter.name,
          phone: voter.phone || 'N/A',
          region: voter.region || 'N/A',
          eligible,
          voted
        })
      }

      // Add empty row between zones for better readability
      if (voters.length > 0) {
        zoneWiseVoterStatusSheet.addRow({
          electionType: '',
          zoneName: '',
          voterId: '',
          name: '',
          phone: '',
          region: '',
          eligible: '',
          voted: ''
        })
      }
    }

    // Style the header row
    zoneWiseVoterStatusSheet.getRow(1).font = { bold: true, size: 12 }
    zoneWiseVoterStatusSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE67E22' }
    }
    zoneWiseVoterStatusSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Clear timeout before generating buffer
    if (timeoutWarning) {
      clearTimeout(timeoutWarning)
    }

    // Generate Excel buffer
    console.log('Generating Excel buffer...')
    const buffer = await workbook.xlsx.writeBuffer()
    console.log(`Excel buffer generated: ${buffer.byteLength} bytes`)

    clearTimeout(timeoutWarning)
    
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `election-insights-${timestamp}.xlsx`
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    console.log(`Export completed in ${duration} seconds`)
    console.log(`Buffer size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`)

    // Validate buffer before sending
    if (!buffer) {
      throw new Error('Failed to generate Excel buffer')
    }

    // Get buffer length (handle different buffer types)
    const bufferLength = buffer.byteLength || (buffer as any).length || 0
    
    if (bufferLength === 0) {
      throw new Error('Generated Excel file is empty')
    }

    console.log(`Sending Excel file: ${filename}, size: ${(bufferLength / 1024 / 1024).toFixed(2)} MB`)

    // Convert buffer to Uint8Array if needed for better compatibility
    let responseBody: BodyInit
    if (buffer instanceof Uint8Array) {
      responseBody = buffer
    } else if (buffer instanceof ArrayBuffer) {
      responseBody = new Uint8Array(buffer)
    } else if (Buffer.isBuffer(buffer)) {
      // Node.js Buffer - convert to Uint8Array for better browser compatibility
      responseBody = new Uint8Array(buffer)
    } else {
      // Fallback: try to use as-is
      responseBody = buffer as any
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': bufferLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Export-Timestamp': new Date().toISOString(),
        'X-Export-Duration': duration,
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    // Clear timeout if it exists
    if (timeoutWarning) {
      clearTimeout(timeoutWarning)
    }
    
    console.error('Error exporting election insights:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString()
    })
    
    // Return JSON error response with proper headers
    return NextResponse.json({ 
      error: 'Failed to export election insights',
      details: errorMessage,
      message: `Export failed: ${errorMessage}. This might be due to a timeout (Netlify has a 10-second limit) or database connection issues.`,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      timestamp: new Date().toISOString(),
      suggestion: 'If this is a timeout issue, try exporting during off-peak hours or contact support to increase the timeout limit.'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

