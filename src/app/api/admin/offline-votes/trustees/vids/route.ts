import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canEnterOfflineVotes, canMergeOfflineVotes } from '@/lib/offline-vote-auth'
import { handleError } from '@/lib/error-handler'
import { sortTrusteeZones } from '@/lib/trustee-zone-order'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Allow both offline vote admins and main admins
    const offlineAdmin = await canEnterOfflineVotes()
    const canMerge = await canMergeOfflineVotes()

    if (!offlineAdmin && !canMerge) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(500, Math.max(1, Number(limitParam || '200') || 200))

    // Get active trustee election (if present, scope to it)
    const election = await prisma.election.findFirst({
      where: { type: 'TRUSTEES', status: 'ACTIVE' },
      select: { id: true }
    })

    const where: any = {}
    if (election?.id) {
      where.electionId = election.id
    }

    // Trustee zones meta (ordered)
    const trusteeZonesRaw = await prisma.zone.findMany({
      where: { electionType: 'TRUSTEES', isActive: true },
      select: { id: true, code: true, name: true, seats: true }
    })
    const trusteeZones = sortTrusteeZones(trusteeZonesRaw)

    // Return VID-only list (no voter names) with timestamp + vote summary
    const groups = await prisma.offlineVote.groupBy({
      by: ['voterId'],
      where,
      _max: { timestamp: true },
      orderBy: { _max: { timestamp: 'desc' } },
      take: limit
    })

    const voterIds = groups.map((g) => g.voterId)
    const offlineVotes = voterIds.length
      ? await prisma.offlineVote.findMany({
          where: { ...where, voterId: { in: voterIds } },
          select: {
            id: true,
            voterId: true,
            timestamp: true,
            trusteeCandidate: {
              select: {
                id: true,
                name: true,
                zone: { select: { code: true } }
              }
            }
          }
        })
      : []

    const byVoter = new Map<
      string,
      {
        voterId: string
        timestamp: Date | null
        selectedByZone: Map<string, Set<string>>
      }
    >()

    for (const g of groups) {
      byVoter.set(g.voterId, {
        voterId: g.voterId,
        timestamp: g._max.timestamp ?? null,
        selectedByZone: new Map()
      })
    }

    for (const v of offlineVotes) {
      const entry = byVoter.get(v.voterId)
      if (!entry) continue
      const zoneCode = v.trusteeCandidate?.zone?.code
      const candidateName = v.trusteeCandidate?.name
      if (!zoneCode || !candidateName) continue
      const code = String(zoneCode).toUpperCase()
      if (!entry.selectedByZone.has(code)) entry.selectedByZone.set(code, new Set())
      entry.selectedByZone.get(code)!.add(candidateName)
    }

    const items = groups.map((g) => {
      const entry = byVoter.get(g.voterId)
      const votesByZone = trusteeZones.map((z) => {
        const picked = entry?.selectedByZone.get(String(z.code).toUpperCase())
        return {
          code: z.code,
          name: z.name,
          seats: z.seats,
          selectedCandidateNames: picked ? Array.from(picked) : []
        }
      })

      return {
        voterId: g.voterId,
        timestamp: g._max.timestamp ? g._max.timestamp.toISOString() : null,
        votesByZone
      }
    })

    return NextResponse.json({
      success: true,
      total: groups.length,
      zones: trusteeZones.map((z) => ({ code: z.code, name: z.name, seats: z.seats })),
      items
    })
  } catch (error) {
    return handleError(error, {
      endpoint: request.nextUrl.pathname,
      method: request.method
    })
  }
}

