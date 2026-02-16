import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canMergeOfflineVotes } from '@/lib/offline-vote-auth'
import { getOrCreateTrusteeNotaCandidateForSeat } from '@/lib/nota'

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

    // Process each voter in a separate short transaction to avoid "Transaction not found"
    // (long single transactions can time out or lose the connection in serverless/pooled envs)
    for (const [voterId, votes] of votesByVoter.entries()) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const voter = await tx.voter.findUnique({
              where: { voterId }
            })

            if (!voter) {
              errors.push(`Voter not found for VID: ${voterId}`)
              throw new Error('VOTER_NOT_FOUND') // no writes; exit tx and count as error
            }

            const existingVotes = await tx.vote.count({
              where: {
                voterId: voter.id,
                electionId: election.id
              }
            })

            if (existingVotes > 0) {
              errors.push(`Voter ${voterId} already has online votes. Skipping merge.`)
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
              return // commit tx so offline votes are marked merged
            }

            const seenCandidateIds = new Set<string>()
            for (const offlineVote of votes) {
              if (!offlineVote.trusteeCandidateId || !offlineVote.trusteeCandidate) continue
              if (seenCandidateIds.has(offlineVote.trusteeCandidateId)) continue
              seenCandidateIds.add(offlineVote.trusteeCandidateId)

              await tx.vote.create({
                data: {
                  voterId: voter.id,
                  electionId: election.id,
                  trusteeCandidateId: offlineVote.trusteeCandidateId,
                  timestamp: offlineVote.timestamp,
                  ipAddress: null,
                  userAgent: 'Offline Vote Entry',
                  latitude: null,
                  longitude: null
                }
              })
            }

            // Merge offline NOTA into master: "all NOTA" placeholder (trusteeCandidateId null)
            let notaVotesCreated = 0
            const hasAllNotaPlaceholder = votes.some((v) => !v.trusteeCandidateId)
            if (hasAllNotaPlaceholder && seenCandidateIds.size === 0 && voter.trusteeZoneId) {
              const zone = await tx.zone.findUnique({
                where: { id: voter.trusteeZoneId },
                select: { seats: true }
              })
              if (zone && zone.seats > 0) {
                const firstOfflineTs = votes.find((v) => v.timestamp)?.timestamp ?? new Date()
                for (let i = 1; i <= zone.seats; i++) {
                  const notaCandidateId = await getOrCreateTrusteeNotaCandidateForSeat(
                    voter.trusteeZoneId,
                    String(i)
                  )
                  await tx.vote.create({
                    data: {
                      voterId: voter.id,
                      electionId: election.id,
                      trusteeCandidateId: notaCandidateId,
                      timestamp: firstOfflineTs,
                      ipAddress: null,
                      userAgent: 'Offline Vote Entry (NOTA)',
                      latitude: null,
                      longitude: null
                    }
                  })
                  notaVotesCreated++
                }
              } else if (!zone || zone.seats < 1) {
                errors.push(`Voter ${voterId}: all NOTA but zone missing or has no seats; NOTA votes not merged.`)
              }
            } else if (hasAllNotaPlaceholder && seenCandidateIds.size === 0 && !voter.trusteeZoneId) {
              errors.push(`Voter ${voterId}: all NOTA but no trustee zone; NOTA votes not merged.`)
            }

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

            mergedCount += seenCandidateIds.size + notaVotesCreated
          },
          { timeout: 15000 }
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'VOTER_NOT_FOUND') {
          errorCount++
        } else if (msg) {
          errors.push(`Error merging votes for ${voterId}: ${msg}`)
          errorCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Merged ${mergedCount} offline vote(s) from ${votesByVoter.size} voter(s)`,
      mergedCount,
      voterCount: votesByVoter.size,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Merge failed'
    const code = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined
    console.error('Offline votes merge error:', error)
    return NextResponse.json(
      {
        error: message,
        code: code || 'MERGE_ERROR',
        details: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
