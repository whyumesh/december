import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canEnterOfflineVotes, canMergeOfflineVotes } from '@/lib/offline-vote-auth'
import { handleError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Check authorization - allow both offline vote admins and main admins to view
    const offlineAdmin = await canEnterOfflineVotes()
    const canMerge = await canMergeOfflineVotes()
    
    if (!offlineAdmin && !canMerge) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isMerged = searchParams.get('isMerged')
    const voterId = searchParams.get('voterId')

    // Build where clause
    const where: any = {}
    
    if (isMerged !== null) {
      where.isMerged = isMerged === 'true'
    }
    
    if (voterId) {
      where.voterId = { contains: voterId, mode: 'insensitive' }
    }

    // Get active trustee election
    const election = await prisma.election.findFirst({
      where: {
        type: 'TRUSTEES',
        status: 'ACTIVE'
      }
    })

    if (election) {
      where.electionId = election.id
    }

    const offlineVotes = await prisma.offlineVote.findMany({
      where,
      include: {
        trusteeCandidate: {
          select: {
            id: true,
            name: true,
            nameGujarati: true,
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true
              }
            }
          }
        },
        admin: {
          select: {
            id: true,
            adminId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        election: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Group by voter for easier display
    const votesByVoter = new Map<string, any>()
    
    offlineVotes.forEach(vote => {
      if (!votesByVoter.has(vote.voterId)) {
        votesByVoter.set(vote.voterId, {
          voterId: vote.voterId,
          votes: [],
          admin: vote.admin,
          timestamp: vote.timestamp,
          isMerged: vote.isMerged,
          mergedAt: vote.mergedAt,
          notes: vote.notes
        })
      }
      votesByVoter.get(vote.voterId)!.votes.push({
        id: vote.id,
        trusteeCandidate: vote.trusteeCandidate,
        timestamp: vote.timestamp
      })
    })

    // Get voter details for each VID
    const voterIds = Array.from(votesByVoter.keys())
    const voters = await prisma.voter.findMany({
      where: {
        voterId: { in: voterIds }
      },
      select: {
        id: true,
        voterId: true,
        name: true,
        region: true,
        phone: true,
        email: true,
        trusteeZone: {
          select: {
            id: true,
            name: true,
            nameGujarati: true,
            code: true
          }
        }
      }
    })

    const voterMap = new Map(voters.map(v => [v.voterId, v]))

    // Combine voter info with votes
    const result = Array.from(votesByVoter.values()).map(voteGroup => ({
      ...voteGroup,
      voter: voterMap.get(voteGroup.voterId) || null
    }))

    return NextResponse.json({
      success: true,
      offlineVotes: result,
      total: result.length,
      merged: result.filter(v => v.isMerged).length,
      unmerged: result.filter(v => !v.isMerged).length
    })

  } catch (error) {
    return handleError(error, {
      endpoint: request.nextUrl.pathname,
      method: request.method
    })
  }
}
