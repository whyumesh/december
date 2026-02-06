import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canEnterOfflineVotes } from '@/lib/offline-vote-auth'
import { handleError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const admin = await canEnterOfflineVotes()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only offline vote admins can access this endpoint.' },
        { status: 403 }
      )
    }

    const { voterId, votes, notes } = await request.json()

    if (!voterId || typeof voterId !== 'string') {
      return NextResponse.json(
        { error: 'Voter ID (VID) is required' },
        { status: 400 }
      )
    }

    if (!votes || typeof votes !== 'object' || Array.isArray(votes)) {
      return NextResponse.json(
        { error: 'Votes must be an object (can be empty for all NOTA)' },
        { status: 400 }
      )
    }

    const trimmedVoterId = typeof voterId === 'string' ? voterId.trim() : ''

    const voter = await prisma.voter.findUnique({
      where: { voterId: trimmedVoterId },
      include: {
        trusteeZone: true
      }
    })

    if (!voter) {
      return NextResponse.json(
        { error: 'Voter not found with the provided VID' },
        { status: 404 }
      )
    }

    // Get active trustee election
    const election = await prisma.election.findFirst({
      where: {
        type: 'TRUSTEES',
        status: 'ACTIVE'
      }
    })

    if (!election) {
      return NextResponse.json(
        { error: 'No active trustee election found' },
        { status: 404 }
      )
    }

    // Check if voter already has online vote
    const onlineVoteCount = await prisma.vote.count({
      where: {
        voterId: voter.id,
        electionId: election.id
      }
    })

    if (onlineVoteCount > 0) {
      return NextResponse.json(
        { error: 'This voter has already voted online. Cannot submit offline vote.' },
        { status: 400 }
      )
    }

    // Check if voter already has any offline vote (merged or unmerged)
    const existingOfflineVote = await prisma.offlineVote.findFirst({
      where: {
        voterId: voter.voterId,
        electionId: election.id
      }
    })

    if (existingOfflineVote) {
      return NextResponse.json(
        { error: existingOfflineVote.isMerged ? 'This voter has already submitted an offline vote (merged).' : 'This voter already has an unmerged offline vote. Please merge or delete existing vote first.' },
        { status: 400 }
      )
    }

    // Simplified validation: verify trustee candidates exist and enforce per-zone seat limit
    const validationErrors: string[] = []
    const validatedVotes: Array<{ trusteeCandidateId: string; zoneId: string }> = []

    for (const [voteKey, trusteeId] of Object.entries(votes)) {
      if (!trusteeId || typeof trusteeId !== 'string') {
        continue
      }

      // Handle NOTA votes
      if (trusteeId.startsWith('NOTA_')) {
        // For offline votes, we can skip NOTA or create a placeholder
        // For now, skip NOTA votes in offline entry
        continue
      }

      // Try to find as TrusteeCandidate first
      let trustee = await prisma.trusteeCandidate.findUnique({
        where: { id: trusteeId },
        include: { zone: true }
      })

      // If not found as TrusteeCandidate, try as Voter and find/create corresponding TrusteeCandidate
      if (!trustee) {
        const voterAsTrustee = await prisma.voter.findUnique({
          where: { id: trusteeId },
          include: { trusteeZone: true }
        })

        if (voterAsTrustee && voterAsTrustee.trusteeZoneId) {
          // Try to find existing TrusteeCandidate for this voter
          trustee = await prisma.trusteeCandidate.findFirst({
            where: {
              userId: voterAsTrustee.userId || voterAsTrustee.id,
              zoneId: voterAsTrustee.trusteeZoneId
            },
            include: { zone: true }
          })

          // If no TrusteeCandidate exists, create one on the fly (for offline votes)
          if (!trustee && voterAsTrustee.trusteeZoneId) {
            trustee = await prisma.trusteeCandidate.create({
              data: {
                userId: voterAsTrustee.userId || voterAsTrustee.id,
                name: voterAsTrustee.name,
                nameGujarati: voterAsTrustee.name,
                region: voterAsTrustee.region,
                position: 'Trustee',
                status: 'APPROVED',
                zoneId: voterAsTrustee.trusteeZoneId,
                isOnlineRegistration: false
              },
              include: { zone: true }
            })
          }
        }
      }

      if (!trustee) {
        validationErrors.push(`Trustee candidate ${trusteeId} not found`)
        continue
      }

      // Basic validation: trustee should be approved (optional for offline, but prefer approved)
      if (trustee.status !== 'APPROVED') {
        // For offline votes, we can still allow non-approved, but log it
        console.warn(`Trustee "${trustee.name}" is not approved (Status: ${trustee.status}), but allowing for offline vote`)
      }

      if (trustee.zone?.id) {
        validatedVotes.push({ trusteeCandidateId: trustee.id, zoneId: trustee.zone.id })
      }
    }

    // Dedupe by trusteeCandidateId (same candidate must not appear twice for this voter)
    const seenCandidateIds = new Set<string>()
    const dedupedVotes = validatedVotes.filter((v) => {
      if (seenCandidateIds.has(v.trusteeCandidateId)) return false
      seenCandidateIds.add(v.trusteeCandidateId)
      return true
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', errors: validationErrors },
        { status: 400 }
      )
    }

    // Per-zone seat limit: count votes per zone and check against zone.seats
    const zoneCounts = new Map<string, number>()
    for (const v of dedupedVotes) {
      zoneCounts.set(v.zoneId, (zoneCounts.get(v.zoneId) || 0) + 1)
    }
    const trusteeZones = await prisma.zone.findMany({
      where: { electionType: 'TRUSTEES' },
      select: { id: true, name: true, seats: true }
    })
    for (const zone of trusteeZones) {
      const count = zoneCounts.get(zone.id) || 0
      const maxSeats = Math.max(1, zone.seats ?? 1)
      if (count > maxSeats) {
        return NextResponse.json(
          { error: `Zone "${zone.name}": at most ${maxSeats} trustee(s) allowed, got ${count}.` },
          { status: 400 }
        )
      }
    }

    // Allow 0 votes (all NOTA) - create one placeholder so voter is marked as submitted
    if (dedupedVotes.length === 0) {
      await prisma.offlineVote.create({
        data: {
          voterId: voter.voterId,
          trusteeCandidateId: null,
          electionId: election.id,
          adminId: admin.id,
          notes: (notes || null) ? `${notes || ''} (all NOTA)`.trim() : 'All NOTA',
          timestamp: new Date(),
          isMerged: false
        }
      })
      return NextResponse.json({
        success: true,
        message: `Offline vote recorded for voter ${voter.name} (${voter.voterId}) with no selections (all NOTA).`,
        votesSubmitted: 0
      })
    }

    // Create offline votes in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        for (const vote of dedupedVotes) {
          await tx.offlineVote.create({
            data: {
              voterId: voter.voterId,
              trusteeCandidateId: vote.trusteeCandidateId,
              electionId: election.id,
              adminId: admin.id,
              notes: notes || null,
              timestamp: new Date(),
              isMerged: false
            }
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: `Successfully submitted ${dedupedVotes.length} offline vote(s) for voter ${voter.name} (${voter.voterId})`,
        votesSubmitted: dedupedVotes.length
      })

    } catch (transactionError: any) {
      return NextResponse.json(
        { error: transactionError.message || 'Error submitting offline votes. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    return handleError(error, {
      endpoint: request.nextUrl.pathname,
      method: request.method
    })
  }
}
