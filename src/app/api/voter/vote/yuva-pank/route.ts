import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isEligibleToVote } from '@/lib/age-validation'
import { verifyToken } from '@/lib/jwt'
import { handleError } from '@/lib/error-handler'
import { getOrCreateYuvaNotaCandidate } from '@/lib/nota'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0


export async function POST(request: NextRequest) {
  try {
    const { votes } = await request.json()
    
    if (!votes || typeof votes !== 'object' || Object.keys(votes).length === 0) {
      return NextResponse.json({ error: 'Invalid or empty vote data' }, { status: 400 })
    }

    // 1. AUTHENTICATION: Get voter from JWT token
    const token = request.cookies.get('voter-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    // 2. FETCH VOTER & ELECTION DATA
    const voter = await prisma.voter.findUnique({
      where: { id: decoded.userId }, // Use id instead of userId since token contains voter.id
      include: {
        user: true,
        votes: {
          include: {
            // No position table in our schema
          }
        }
      }
    })

    if (!voter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 })
    }

    const election = await prisma.election.findFirst({
      where: { type: 'YUVA_PANK' },
      orderBy: { createdAt: 'desc' }
    })

    if (!election) {
      console.error('Yuva Pankh election not found in database')
      return NextResponse.json({ 
        error: 'Yuva Pankh election not found. Please contact the administrator.' 
      }, { status: 404 })
    }
    
    console.log('Found Yuva Pankh election:', {
      id: election.id,
      type: election.type,
      status: election.status
    })

    const existingVotes = await prisma.vote.count({
      where: {
        voterId: voter.id,
        electionId: election.id
      }
    })

    if (existingVotes > 0) {
      return NextResponse.json({ error: 'You have already voted in the Yuva Pankh election' }, { status: 400 })
    }

    // 3. PRE-VOTE CHECKS (Eligibility, Has Voted)
    const hasVotedYuvaPank = voter.votes.some(vote => vote.yuvaPankhCandidateId !== null)
    if (hasVotedYuvaPank) {
      return NextResponse.json({ error: 'You have already voted in the Yuva Pankh election' }, { status: 400 })
    }

    // const eligibility = isEligibleToVote(
    //   { age: voter.user.age, dateOfBirth: voter.user.dateOfBirth, jurisdiction: voter.user.jurisdiction },
    //   { voterMinAge: election.voterMinAge, voterMaxAge: election.voterMaxAge, voterJurisdiction: election.voterJurisdiction }
    // )
    // if (!eligibility.eligible) {
    //   return NextResponse.json({ error: eligibility.reason || 'You are not eligible to vote in this election' }, { status: 403 })
    // }

    // 4. VALIDATE VOTE PAYLOAD (allowing NOTA selections)
    const processedSelections: Array<{ zoneId: string; candidateId?: string; isNota: boolean }> = []
    
    for (const [zoneId, selections] of Object.entries(votes)) {
      if (!Array.isArray(selections)) continue

      if (zoneId !== voter.yuvaPankZoneId) {
        return NextResponse.json({ error: 'You can only vote within your assigned Yuva Pankh zone.' }, { status: 400 })
      }

      selections.forEach(selectionId => {
        if (typeof selectionId !== 'string') return
        if (selectionId.startsWith('NOTA_')) {
          processedSelections.push({ zoneId, isNota: true })
        } else {
          processedSelections.push({ zoneId, candidateId: selectionId, isNota: false })
        }
      })
    }

    if (processedSelections.length === 0) {
      return NextResponse.json({ error: 'No selections were submitted.' }, { status: 400 })
    }

    const allSelectedCandidateIds = processedSelections
      .filter(selection => !selection.isNota && selection.candidateId)
      .map(selection => selection.candidateId!) // safe due to filter

    // Use yuvaPankZoneId for Yuva Pankh elections (not zoneId)
    if (!voter.yuvaPankZoneId) {
        return NextResponse.json({ error: 'You are not assigned to a Yuva Pankh zone.' }, { status: 403 })
    }

    const voterZone = await prisma.zone.findUnique({ 
      where: { id: voter.yuvaPankZoneId },
      include: { yuvaPankhCandidates: true }
    })
    
    if (!voterZone) {
        return NextResponse.json({ error: 'Voter\'s assigned Yuva Pankh zone not found.' }, { status: 404 })
    }

    // Check if the number of votes exceeds the allowed seats (total selections including NOTA)
    if (processedSelections.length > voterZone.seats) {
        return NextResponse.json({ 
            error: `Your zone allows a maximum of ${voterZone.seats} vote(s), but you selected ${processedSelections.length}.` 
        }, { status: 400 })
    }

    // Auto-fill missing selections with NOTA to meet seat requirement
    if (processedSelections.length < voterZone.seats) {
      const remaining = voterZone.seats - processedSelections.length
      for (let i = 0; i < remaining; i++) {
        processedSelections.push({ zoneId: voterZone.id, isNota: true })
      }
    }

    // Verify all selected candidates are valid and belong to the voter's Yuva Pankh zone
    // Check both zone membership and approval status
    const validCandidates = await prisma.yuvaPankhCandidate.findMany({
        where: {
            id: { in: allSelectedCandidateIds },
            zoneId: voter.yuvaPankZoneId,
            status: 'APPROVED' // Ensure candidates are approved
        }
    })

    if(validCandidates.length !== allSelectedCandidateIds.length) {
        console.error('Candidate validation failed:', {
          selectedCount: allSelectedCandidateIds.length,
          validCount: validCandidates.length,
          selectedIds: allSelectedCandidateIds,
          validIds: validCandidates.map(c => c.id),
          voterZoneId: voter.yuvaPankZoneId,
          invalidIds: allSelectedCandidateIds.filter(id => !validCandidates.some(c => c.id === id))
        })
        
        // Check if candidates exist but are not approved
        const allCandidates = await prisma.yuvaPankhCandidate.findMany({
          where: {
            id: { in: allSelectedCandidateIds },
            zoneId: voter.yuvaPankZoneId
          },
          select: { id: true, status: true, name: true }
        })
        
        const unapprovedCandidates = allCandidates.filter(c => c.status !== 'APPROVED')
        if (unapprovedCandidates.length > 0) {
          return NextResponse.json({ 
            error: `One or more selected candidates are not approved: ${unapprovedCandidates.map(c => c.name).join(', ')}` 
          }, { status: 400 })
        }
        
        return NextResponse.json({ 
          error: 'One or more selected candidates are invalid or do not belong to your Yuva Pankh zone.' 
        }, { status: 400 })
    }
    
    // 5. FIND THE CORRECT POSITION ID
    // No need for position lookup since we're using yuvaPankhCandidateId directly

    // 6. CREATE VOTE RECORDS IN A TRANSACTION
    // Use a transaction to ensure all votes are saved or none are.
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      ?? request.headers.get('x-real-ip') 
      ?? request.ip 
      ?? 'unknown'
    const userAgent = request.headers.get('user-agent') ?? 'unknown'
    
    const voteCreationData = []
    for (const selection of processedSelections) {
      if (selection.isNota) {
        const notaCandidateId = await getOrCreateYuvaNotaCandidate(selection.zoneId)
        voteCreationData.push({
          voterId: voter.id,
          yuvaPankhCandidateId: notaCandidateId,
          electionId: election.id,
          ipAddress,
          userAgent,
        })
      } else {
        voteCreationData.push({
          voterId: voter.id,
          yuvaPankhCandidateId: selection.candidateId!,
          electionId: election.id,
          ipAddress,
          userAgent,
        })
      }
    }
    
    // Use transaction to ensure all votes are saved atomically
    await prisma.$transaction(async (tx) => {
      await tx.vote.createMany({
        data: voteCreationData,
        skipDuplicates: true // Skip if duplicate votes exist
      })
    })

    const notaCount = processedSelections.filter(selection => selection.isNota).length
    console.log(`✅ Successfully saved ${voteCreationData.length} Yuva Pankh votes (${notaCount} NOTA) for voter ${voter.id}`)

    return NextResponse.json({ 
      message: 'Vote submitted successfully',
      votesCount: voteCreationData.length,
      notaCount
    })

  } catch (error) {
    return handleError(error, { 
      endpoint: request.nextUrl.pathname,
      method: request.method 
    })
  }
}
