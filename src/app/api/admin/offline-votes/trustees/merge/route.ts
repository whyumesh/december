import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canMergeOfflineVotes } from '@/lib/offline-vote-auth'
import { handleError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // Check authorization - only main admin can merge
    const canMerge = await canMergeOfflineVotes()
    if (!canMerge) {
      return NextResponse.json(
        { error: 'Unauthorized. Only main admin can merge offline votes.' },
        { status: 403 }
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

    // Get all unmerged offline votes
    const unmergedVotes = await prisma.offlineVote.findMany({
      where: {
        electionId: election.id,
        isMerged: false
      },
      include: {
        trusteeCandidate: true
      }
    })

    if (unmergedVotes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unmerged offline votes to merge',
        mergedCount: 0
      })
    }

    // Group votes by voterId (VID)
    const votesByVoter = new Map<string, typeof unmergedVotes>()
    unmergedVotes.forEach(vote => {
      if (!votesByVoter.has(vote.voterId)) {
        votesByVoter.set(vote.voterId, [])
      }
      votesByVoter.get(vote.voterId)!.push(vote)
    })

    let mergedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Merge votes in a transaction
    await prisma.$transaction(async (tx) => {
      for (const [voterId, votes] of votesByVoter.entries()) {
        try {
          // Find voter by VID
          const voter = await tx.voter.findUnique({
            where: { voterId }
          })

          if (!voter) {
            errors.push(`Voter not found for VID: ${voterId}`)
            errorCount++
            continue
          }

          // Check if voter already has online votes
          const existingVotes = await tx.vote.count({
            where: {
              voterId: voter.id,
              electionId: election.id
            }
          })

          if (existingVotes > 0) {
            errors.push(`Voter ${voterId} already has online votes. Skipping merge.`)
            errorCount++
            // Still mark offline votes as merged to prevent retry
            await tx.offlineVote.updateMany({
              where: {
                voterId,
                electionId: election.id,
                isMerged: false
              },
              data: {
                isMerged: true,
                mergedAt: new Date()
              }
            })
            continue
          }

          // Create Vote records for each offline vote
          for (const offlineVote of votes) {
            if (!offlineVote.trusteeCandidateId) {
              continue // Skip votes without trustee candidate
            }

            await tx.vote.create({
              data: {
                voterId: voter.id,
                electionId: election.id,
                trusteeCandidateId: offlineVote.trusteeCandidateId,
                timestamp: offlineVote.timestamp,
                ipAddress: null, // Offline votes don't have IP
                userAgent: 'Offline Vote Entry',
                latitude: null,
                longitude: null
              }
            })
          }

          // Mark offline votes as merged
          await tx.offlineVote.updateMany({
            where: {
              voterId,
              electionId: election.id,
              isMerged: false
            },
            data: {
              isMerged: true,
              mergedAt: new Date()
            }
          })

          mergedCount += votes.length
        } catch (error: any) {
          errors.push(`Error merging votes for ${voterId}: ${error.message}`)
          errorCount++
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Merged ${mergedCount} offline vote(s) from ${votesByVoter.size} voter(s)`,
      mergedCount,
      voterCount: votesByVoter.size,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    return handleError(error, {
      endpoint: request.nextUrl.pathname,
      method: request.method
    })
  }
}
