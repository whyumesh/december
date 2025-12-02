import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import ExcelJS from 'exceljs'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Note: maxDuration is only available in Next.js 15+
// For Next.js 14, Netlify has a default timeout of 10 seconds for serverless functions
// For longer operations, consider using Netlify Background Functions

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

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'KMS Election 2026'
    workbook.created = new Date()
    workbook.modified = new Date()

    // ============================================
    // SHEET 1: SUMMARY STATISTICS
    // ============================================
    const summarySheet = workbook.addWorksheet('Summary Statistics')
    
    // Get all statistics
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
      trusteeVotes,
      yuvaPankhNotaVotes,
      karobariNotaVotes,
      trusteeNotaVotes
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
      prisma.vote.count({ where: { trusteeCandidateId: { not: null } } }),
      prisma.vote.count({ where: { yuvaPankhCandidate: { position: 'NOTA' } } }),
      prisma.vote.count({ where: { karobariCandidate: { position: 'NOTA' } } }),
      prisma.vote.count({ where: { trusteeCandidate: { position: 'NOTA' } } })
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

    // Voter statistics
    const votersWithYuvaPankZone = await prisma.voter.count({ where: { yuvaPankZoneId: { not: null } } })
    const votersWithKarobariZone = await prisma.voter.count({ where: { karobariZoneId: { not: null } } })
    const votersWithTrusteeZone = await prisma.voter.count({ where: { trusteeZoneId: { not: null } } })
    
    // Voters who have voted (count distinct voters)
    // Note: Prisma distinct doesn't work with select, so we fetch and deduplicate
    const yuvaPankhVotesForCount = await prisma.vote.findMany({
      where: { election: { type: 'YUVA_PANK' } },
      select: { voterId: true }
    })
    const karobariVotesForCount = await prisma.vote.findMany({
      where: { election: { type: 'KAROBARI_MEMBERS' } },
      select: { voterId: true }
    })
    const trusteeVotesForCount = await prisma.vote.findMany({
      where: { election: { type: 'TRUSTEES' } },
      select: { voterId: true }
    })
    
    // Deduplicate by voterId
    const votersVotedYuvaPankh = new Set(yuvaPankhVotesForCount.map(v => v.voterId)).size
    const votersVotedKarobari = new Set(karobariVotesForCount.map(v => v.voterId)).size
    const votersVotedTrustee = new Set(trusteeVotesForCount.map(v => v.voterId)).size

    // Add summary data
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ]

    summarySheet.addRows([
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

    // Style summary sheet
    summarySheet.getRow(1).font = { bold: true, size: 12 }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // ============================================
    // SHEET 2: VOTER STATISTICS BY REGION
    // ============================================
    const voterRegionSheet = workbook.addWorksheet('Voters by Region')
    
    const votersByRegion = await prisma.voter.groupBy({
      by: ['region'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    voterRegionSheet.columns = [
      { header: 'Region', key: 'region', width: 25 },
      { header: 'Total Voters', key: 'total', width: 15 },
      { header: 'With Yuva Pankh Zone', key: 'yuvaPank', width: 20 },
      { header: 'With Karobari Zone', key: 'karobari', width: 20 },
      { header: 'With Trustee Zone', key: 'trustee', width: 20 }
    ]

    for (const regionGroup of votersByRegion) {
      const region = regionGroup.region
      const [yuvaPank, karobari, trustee] = await Promise.all([
        prisma.voter.count({ where: { region, yuvaPankZoneId: { not: null } } }),
        prisma.voter.count({ where: { region, karobariZoneId: { not: null } } }),
        prisma.voter.count({ where: { region, trusteeZoneId: { not: null } } })
      ])

      voterRegionSheet.addRow({
        region: region || 'Unknown',
        total: regionGroup._count.id,
        yuvaPank,
        karobari,
        trustee
      })
    }

    voterRegionSheet.getRow(1).font = { bold: true, size: 12 }
    voterRegionSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    voterRegionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // ============================================
    // SHEET 3: ELECTION RESULTS - YUVA PANKH
    // ============================================
    const yuvaPankhResultsSheet = workbook.addWorksheet('Yuva Pankh Results')
    
    const yuvaPankhVoteRecords = await prisma.vote.findMany({
      where: { yuvaPankhCandidateId: { not: null } },
      include: {
        yuvaPankhCandidate: {
          include: {
            user: { select: { name: true } },
            zone: { select: { name: true, nameGujarati: true, code: true } }
          }
        }
      }
    })

    // Group by zone and candidate
    const yuvaPankhResults = new Map<string, Map<string, { name: string; votes: number }>>()
    
    yuvaPankhVoteRecords.forEach(vote => {
      if (vote.yuvaPankhCandidate) {
        const zoneId = vote.yuvaPankhCandidate.zoneId || 'Unknown'
        const candidateId = vote.yuvaPankhCandidateId || ''
        const candidateName = vote.yuvaPankhCandidate.user?.name || vote.yuvaPankhCandidate.name || 'Unknown'
        const zoneName = vote.yuvaPankhCandidate.zone?.name || 'Unknown'

        if (!yuvaPankhResults.has(zoneId)) {
          yuvaPankhResults.set(zoneId, new Map())
        }
        
        const zoneCandidates = yuvaPankhResults.get(zoneId)!
        if (!zoneCandidates.has(candidateId)) {
          zoneCandidates.set(candidateId, { name: candidateName, votes: 0 })
        }
        zoneCandidates.get(candidateId)!.votes++
      }
    })

    yuvaPankhResultsSheet.columns = [
      { header: 'Zone', key: 'zone', width: 25 },
      { header: 'Candidate Name', key: 'candidate', width: 30 },
      { header: 'Vote Count', key: 'votes', width: 15 },
      { header: 'Rank', key: 'rank', width: 10 }
    ]

    for (const [zoneId, candidates] of yuvaPankhResults.entries()) {
      const zone = await prisma.zone.findUnique({ where: { id: zoneId }, select: { name: true } })
      const sortedCandidates = Array.from(candidates.values()).sort((a, b) => b.votes - a.votes)
      
      sortedCandidates.forEach((candidate, index) => {
        yuvaPankhResultsSheet.addRow({
          zone: zone?.name || zoneId,
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
    // SHEET 4: ELECTION RESULTS - KAROBARI
    // ============================================
    const karobariResultsSheet = workbook.addWorksheet('Karobari Results')
    
    const karobariVoteRecords = await prisma.vote.findMany({
      where: { karobariCandidateId: { not: null } },
      include: {
        karobariCandidate: {
          include: {
            user: { select: { name: true } },
            zone: { select: { name: true, nameGujarati: true, code: true } }
          }
        }
      }
    })

    const karobariResults = new Map<string, Map<string, { name: string; position: string; votes: number }>>()
    
    karobariVoteRecords.forEach(vote => {
      if (vote.karobariCandidate) {
        const zoneId = vote.karobariCandidate.zoneId || 'Unknown'
        const candidateId = vote.karobariCandidateId || ''
        const candidateName = vote.karobariCandidate.user?.name || vote.karobariCandidate.name || 'Unknown'
        const position = vote.karobariCandidate.position || 'Unknown'

        if (!karobariResults.has(zoneId)) {
          karobariResults.set(zoneId, new Map())
        }
        
        const zoneCandidates = karobariResults.get(zoneId)!
        if (!zoneCandidates.has(candidateId)) {
          zoneCandidates.set(candidateId, { name: candidateName, position, votes: 0 })
        }
        zoneCandidates.get(candidateId)!.votes++
      }
    })

    karobariResultsSheet.columns = [
      { header: 'Zone', key: 'zone', width: 25 },
      { header: 'Position', key: 'position', width: 25 },
      { header: 'Candidate Name', key: 'candidate', width: 30 },
      { header: 'Vote Count', key: 'votes', width: 15 },
      { header: 'Rank', key: 'rank', width: 10 }
    ]

    for (const [zoneId, candidates] of karobariResults.entries()) {
      const zone = await prisma.zone.findUnique({ where: { id: zoneId }, select: { name: true } })
      const sortedCandidates = Array.from(candidates.values()).sort((a, b) => b.votes - a.votes)
      
      sortedCandidates.forEach((candidate, index) => {
        karobariResultsSheet.addRow({
          zone: zone?.name || zoneId,
          position: candidate.position,
          candidate: candidate.name,
          votes: candidate.votes,
          rank: index + 1
        })
      })
      
      karobariResultsSheet.addRow({ zone: '', position: '', candidate: '', votes: '', rank: '' })
    }

    karobariResultsSheet.getRow(1).font = { bold: true, size: 12 }
    karobariResultsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' }
    }
    karobariResultsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // ============================================
    // SHEET 5: ELECTION RESULTS - TRUSTEE
    // ============================================
    const trusteeResultsSheet = workbook.addWorksheet('Trustee Results')
    
    const trusteeVoteRecords = await prisma.vote.findMany({
      where: { trusteeCandidateId: { not: null } },
      include: {
        trusteeCandidate: {
          include: {
            user: { select: { name: true } },
            zone: { select: { name: true, nameGujarati: true, code: true } }
          }
        }
      }
    })

    const trusteeResults = new Map<string, Map<string, { name: string; votes: number }>>()
    
    trusteeVoteRecords.forEach(vote => {
      if (vote.trusteeCandidate) {
        const zoneId = vote.trusteeCandidate.zoneId || 'Unknown'
        const candidateId = vote.trusteeCandidateId || ''
        const candidateName = vote.trusteeCandidate.user?.name || vote.trusteeCandidate.name || 'Unknown'

        if (!trusteeResults.has(zoneId)) {
          trusteeResults.set(zoneId, new Map())
        }
        
        const zoneCandidates = trusteeResults.get(zoneId)!
        if (!zoneCandidates.has(candidateId)) {
          zoneCandidates.set(candidateId, { name: candidateName, votes: 0 })
        }
        zoneCandidates.get(candidateId)!.votes++
      }
    })

    trusteeResultsSheet.columns = [
      { header: 'Zone', key: 'zone', width: 25 },
      { header: 'Trustee Name', key: 'candidate', width: 30 },
      { header: 'Vote Count', key: 'votes', width: 15 },
      { header: 'Rank', key: 'rank', width: 10 }
    ]

    for (const [zoneId, candidates] of trusteeResults.entries()) {
      const zone = await prisma.zone.findUnique({ where: { id: zoneId }, select: { name: true } })
      const sortedCandidates = Array.from(candidates.values()).sort((a, b) => b.votes - a.votes)
      
      sortedCandidates.forEach((candidate, index) => {
        trusteeResultsSheet.addRow({
          zone: zone?.name || zoneId,
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
    // SHEET 6: ZONE-WISE TURNOUT
    // ============================================
    const turnoutSheet = workbook.addWorksheet('Zone-wise Turnout')
    
    const allZones = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ electionType: 'asc' }, { name: 'asc' }]
    })

    turnoutSheet.columns = [
      { header: 'Election Type', key: 'electionType', width: 20 },
      { header: 'Zone Name', key: 'zoneName', width: 25 },
      { header: 'Total Voters', key: 'totalVoters', width: 15 },
      { header: 'Votes Cast', key: 'votesCast', width: 15 },
      { header: 'Turnout %', key: 'turnout', width: 15 },
      { header: 'Seats', key: 'seats', width: 10 }
    ]

    // Process zones in batches to avoid timeout
    for (const zone of allZones) {
      let voterCount = 0
      let voteCount = 0

      try {
        if (zone.electionType === 'YUVA_PANK') {
          voterCount = await prisma.voter.count({ where: { yuvaPankZoneId: zone.id } })
          const votes = await prisma.vote.findMany({
            where: {
              yuvaPankhCandidate: { zoneId: zone.id }
            },
            select: { voterId: true }
          })
          // Deduplicate by voterId
          voteCount = new Set(votes.map(v => v.voterId)).size
        } else if (zone.electionType === 'KAROBARI_MEMBERS') {
          voterCount = await prisma.voter.count({ where: { karobariZoneId: zone.id } })
          const votes = await prisma.vote.findMany({
            where: {
              karobariCandidate: { zoneId: zone.id }
            },
            select: { voterId: true }
          })
          // Deduplicate by voterId
          voteCount = new Set(votes.map(v => v.voterId)).size
        } else if (zone.electionType === 'TRUSTEES') {
          voterCount = await prisma.voter.count({ where: { trusteeZoneId: zone.id } })
          const votes = await prisma.vote.findMany({
            where: {
              trusteeCandidate: { zoneId: zone.id }
            },
            select: { voterId: true }
          })
          // Deduplicate by voterId
          voteCount = new Set(votes.map(v => v.voterId)).size
        }

        const turnout = voterCount > 0 ? ((voteCount / voterCount) * 100).toFixed(2) + '%' : '0%'

        turnoutSheet.addRow({
          electionType: zone.electionType,
          zoneName: zone.name,
          totalVoters: voterCount,
          votesCast: voteCount,
          turnout,
          seats: zone.seats
        })
      } catch (zoneError) {
        console.error(`Error processing zone ${zone.id}:`, zoneError)
        // Continue with next zone even if one fails
        turnoutSheet.addRow({
          electionType: zone.electionType,
          zoneName: zone.name,
          totalVoters: 0,
          votesCast: 0,
          turnout: 'Error',
          seats: zone.seats
        })
      }
    }

    turnoutSheet.getRow(1).font = { bold: true, size: 12 }
    turnoutSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    }
    turnoutSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // ============================================
    // SHEET 7: CANDIDATE STATUS BREAKDOWN
    // ============================================
    const candidateStatusSheet = workbook.addWorksheet('Candidate Status')
    
    candidateStatusSheet.columns = [
      { header: 'Election Type', key: 'electionType', width: 20 },
      { header: 'Zone', key: 'zone', width: 25 },
      { header: 'Candidate Name', key: 'name', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Region', key: 'region', width: 20 },
      { header: 'Submitted Date', key: 'submitted', width: 20 }
    ]

    // Yuva Pankh Candidates
    const yuvaPankhCandidates = await prisma.yuvaPankhCandidate.findMany({
      include: {
        user: { select: { name: true } },
        zone: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    yuvaPankhCandidates.forEach(candidate => {
      candidateStatusSheet.addRow({
        electionType: 'YUVA_PANKH',
        zone: candidate.zone?.name || 'N/A',
        name: candidate.user?.name || candidate.name || 'Unknown',
        status: candidate.status,
        position: 'Member',
        region: candidate.region || 'N/A',
        submitted: candidate.createdAt.toLocaleDateString()
      })
    })

    // Karobari Candidates
    const karobariCandidates = await prisma.karobariCandidate.findMany({
      include: {
        user: { select: { name: true } },
        zone: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    karobariCandidates.forEach(candidate => {
      candidateStatusSheet.addRow({
        electionType: 'KAROBARI',
        zone: candidate.zone?.name || 'N/A',
        name: candidate.user?.name || candidate.name || 'Unknown',
        status: candidate.status,
        position: candidate.position || 'N/A',
        region: candidate.region || 'N/A',
        submitted: candidate.createdAt.toLocaleDateString()
      })
    })

    // Trustee Candidates
    const trusteeCandidates = await prisma.trusteeCandidate.findMany({
      include: {
        user: { select: { name: true } },
        zone: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    trusteeCandidates.forEach(candidate => {
      candidateStatusSheet.addRow({
        electionType: 'TRUSTEE',
        zone: candidate.zone?.name || 'N/A',
        name: candidate.user?.name || candidate.name || 'Unknown',
        status: candidate.status,
        position: 'Trustee',
        region: candidate.region || 'N/A',
        submitted: candidate.createdAt.toLocaleDateString()
      })
    })

    candidateStatusSheet.getRow(1).font = { bold: true, size: 12 }
    candidateStatusSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE74C3C' }
    }
    candidateStatusSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // ============================================
    // SHEET 4: VOTER PARTICIPATION STATUS
    // ============================================
    
    // Get all votes with related data - fetch fresh from database
    console.log('Fetching all votes from database...')
    const allVotes = await prisma.vote.findMany({
      include: {
        voter: {
          select: {
            id: true,
            voterId: true,
            name: true,
            phone: true,
            region: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            },
            yuvaPankZone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            },
            karobariZone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            },
            trusteeZone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            }
          }
        },
        election: {
          select: {
            type: true,
            title: true
          }
        },
        yuvaPankhCandidate: {
          include: {
            zone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            }
          }
        },
        yuvaPankhNominee: {
          include: {
            zone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            }
          }
        },
        karobariCandidate: {
          include: {
            zone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            }
          }
        },
        trusteeCandidate: {
          include: {
            zone: {
              select: {
                name: true,
                nameGujarati: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    
    console.log(`Fetched ${allVotes.length} votes from database at ${new Date().toISOString()}`)

    // ============================================
    // SHEET 5: DETAILED VOTING DATA
    // ============================================
    const votingDataSheet = workbook.addWorksheet('Detailed Voting Data')

    // Add headers
    votingDataSheet.columns = [
      { header: 'Vote ID', key: 'voteId', width: 25 },
      { header: 'Voter ID', key: 'voterId', width: 20 },
      { header: 'Voter Name', key: 'voterName', width: 30 },
      { header: 'Voter Phone', key: 'voterPhone', width: 18 },
      { header: 'Voter Region', key: 'voterRegion', width: 20 },
      { header: 'Election Type', key: 'electionType', width: 20 },
      { header: 'Election Title', key: 'electionTitle', width: 30 },
      { header: 'Vote Category', key: 'voteCategory', width: 18 },
      { header: 'Selection Type', key: 'candidateType', width: 22 },
      { header: 'Zone Name', key: 'zoneName', width: 30 },
      { header: 'Zone Code', key: 'zoneCode', width: 15 },
      { header: 'Vote Timestamp', key: 'timestamp', width: 25 },
      { header: 'IP Address', key: 'ipAddress', width: 20 },
      { header: 'User Agent', key: 'userAgent', width: 50 },
      { header: 'Latitude', key: 'latitude', width: 15 },
      { header: 'Longitude', key: 'longitude', width: 15 }
    ]

    // Log sample data to verify freshness
    const getVoteMeta = (vote: any) => {
      const sources = [
        { candidate: vote.trusteeCandidate, type: 'Trustee Candidate' },
        { candidate: vote.karobariCandidate, type: 'Karobari Candidate' },
        { candidate: vote.yuvaPankhCandidate, type: 'Yuva Pankh Candidate' },
        { candidate: vote.yuvaPankhNominee, type: 'Yuva Pankh Nominee' }
      ]
      for (const source of sources) {
        if (source.candidate) {
          const isNota = source.candidate.position === 'NOTA' || source.candidate.name?.startsWith('NOTA')
          return {
            candidateType: source.type,
            zoneName: source.candidate.zone?.name || 'N/A',
            zoneCode: source.candidate.zone?.code || 'N/A',
            voteCategory: isNota ? 'NOTA' : 'Candidate',
            isNota
          }
        }
      }
      return {
        candidateType: 'N/A',
        zoneName: 'N/A',
        zoneCode: 'N/A',
        voteCategory: 'Candidate',
        isNota: false
      }
    }

    if (allVotes.length > 0) {
      console.log('Sample vote data (first 3 votes):', allVotes.slice(0, 3).map(v => {
        const meta = getVoteMeta(v)
        return {
          id: v.id,
          voterId: v.voterId,
          timestamp: v.timestamp.toISOString(),
          candidateType: meta.candidateType,
          voteCategory: meta.voteCategory
        }
      }))
      console.log('Latest vote timestamp:', allVotes[0]?.timestamp.toISOString())
      console.log('Oldest vote timestamp:', allVotes[allVotes.length - 1]?.timestamp.toISOString())
    } else {
      console.log('No votes found in database')
    }
    
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

    const voteParticipationMap = new Map<string, Record<string, { total: number; nota: number }>>()
    allVotes.forEach(vote => {
      const electionType = vote.election?.type
      if (!electionType) return
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

    const voterRecords = await prisma.voter.findMany({
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
    
    // Process each vote
    allVotes.forEach(vote => {
      const electionType = vote.election?.type || 'UNKNOWN'
      const electionTitle = vote.election?.title || 'N/A'
      const meta = getVoteMeta(vote)

      const voterName = vote.voter?.name || vote.voter?.user?.name || 'Unknown'
      const voterPhone = vote.voter?.phone || vote.voter?.user?.phone || 'N/A'
      const voterRegion = vote.voter?.region || 'N/A'

      votingDataSheet.addRow({
        voteId: vote.id,
        voterId: vote.voter?.voterId || vote.voterId,
        voterName,
        voterPhone,
        voterRegion,
        electionType,
        electionTitle,
        voteCategory: meta.voteCategory,
        candidateType: meta.candidateType,
        zoneName: meta.zoneName,
        zoneCode: meta.zoneCode,
        timestamp: vote.timestamp.toISOString(),
        ipAddress: vote.ipAddress || 'N/A',
        userAgent: vote.userAgent || 'N/A',
        latitude: vote.latitude ?? 'N/A',
        longitude: vote.longitude ?? 'N/A'
      })
    })

    // Style the header row
    votingDataSheet.getRow(1).font = { bold: true, size: 12 }
    votingDataSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3498DB' }
    }
    votingDataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

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
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Generated Excel file is empty')
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Export-Timestamp': new Date().toISOString(),
        'X-Export-Duration': duration
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

