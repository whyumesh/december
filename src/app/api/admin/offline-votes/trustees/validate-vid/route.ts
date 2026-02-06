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

    const { voterId } = await request.json()

    if (!voterId || typeof voterId !== 'string') {
      return NextResponse.json(
        { error: 'Voter ID (VID) is required' },
        { status: 400 }
      )
    }

    const trimmed = voterId.trim()
    const include = {
      trusteeZone: {
        select: {
          id: true,
          name: true,
          nameGujarati: true,
          code: true,
          seats: true
        }
      }
    } as const

    // 1) Exact match
    let voter = await prisma.voter.findUnique({
      where: { voterId: trimmed },
      include
    })

    // 2) If not found, try common VID formats (e.g. VID-0001, V0000411)
    if (!voter) {
      const digits = trimmed.replace(/\D/g, '')
      const num = digits ? parseInt(digits, 10) : NaN
      const pad4 = !isNaN(num) && num >= 0 && num <= 9999 ? num.toString().padStart(4, '0') : ''
      const pad6 = !isNaN(num) && num >= 0 && num <= 999999 ? num.toString().padStart(6, '0') : ''
      const variants: string[] = [trimmed]
      if (pad4) {
        variants.push(`VID-${pad4}`, `VID-${num}`, `V${pad6}`, `V${pad4}`, `V${num}`)
      }
      const unique = [...new Set(variants)].filter(Boolean)

      const matches = await prisma.voter.findMany({
        where: { voterId: { in: unique } },
        include
      })
      if (matches.length === 1) voter = matches[0]
      else if (matches.length > 1) {
        // Ambiguous: multiple voters match (e.g. 425 could match VID-0425 and V000425 if both exist)
        return NextResponse.json(
          { error: 'Multiple voters match this VID. Please enter the full VID (e.g. VID-0425 or V000425).' },
          { status: 400 }
        )
      }
    }

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

    // Check if voter already has offline vote
    const offlineVoteCount = await prisma.offlineVote.count({
      where: {
        voterId: voter.voterId,
        electionId: election.id
      }
    })

    return NextResponse.json({
      success: true,
      voter: {
        id: voter.id,
        voterId: voter.voterId,
        name: voter.name,
        region: voter.region,
        trusteeZone: voter.trusteeZone ? {
          id: voter.trusteeZone.id,
          name: voter.trusteeZone.name,
          nameGujarati: voter.trusteeZone.nameGujarati,
          code: voter.trusteeZone.code,
          seats: voter.trusteeZone.seats
        } : null,
        phone: voter.phone,
        email: voter.email
      },
      election: {
        id: election.id,
        title: election.title,
        type: election.type
      },
      hasOnlineVote: onlineVoteCount > 0,
      hasOfflineVote: offlineVoteCount > 0,
      canVote: onlineVoteCount === 0 && offlineVoteCount === 0
    })

  } catch (error) {
    return handleError(error, {
      endpoint: request.nextUrl.pathname,
      method: request.method
    })
  }
}
