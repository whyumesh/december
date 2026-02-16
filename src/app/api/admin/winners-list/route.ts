import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTrusteeZoneSortKey } from '@/lib/trustee-zone-order'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export interface WinnerItem {
  name: string
  zoneName: string
  zoneCode: string
  rank: number
  votes: number
  election: string
}

/** GET: Flat list of all winners (Yuva Pankh + Trustee) from Vote table, same logic as export. */
export async function GET() {
  try {
    // Yuva Pankh: groupBy and take top N per zone
    const yuvaPankhVoteCounts = await prisma.vote.groupBy({
      by: ['yuvaPankhCandidateId'],
      where: { yuvaPankhCandidateId: { not: null } },
      _count: { id: true }
    })
    const yuvaPankhCandidateIds = yuvaPankhVoteCounts.map(v => v.yuvaPankhCandidateId!).filter(Boolean)
    const yuvaPankhCandidates = yuvaPankhCandidateIds.length > 0
      ? await prisma.yuvaPankhCandidate.findMany({
          where: { id: { in: yuvaPankhCandidateIds } },
          include: {
            user: { select: { name: true } },
            zone: { select: { id: true, name: true, code: true, seats: true } }
          }
        })
      : []

    const yuvaPankhByZone = new Map<string, Array<{ name: string; votes: number }>>()
    yuvaPankhVoteCounts.forEach(vc => {
      if (!vc.yuvaPankhCandidateId) return
      const candidate = yuvaPankhCandidates.find(c => c.id === vc.yuvaPankhCandidateId)
      if (!candidate?.zone) return
      const zoneId = candidate.zoneId
      const name = candidate.user?.name || candidate.name || 'Unknown'
      const votes = vc._count.id
      if (!yuvaPankhByZone.has(zoneId)) yuvaPankhByZone.set(zoneId, [])
      yuvaPankhByZone.get(zoneId)!.push({ name, votes })
    })

    const yuvaPankhWinners: WinnerItem[] = []
    const yuvaPankhZones = await prisma.zone.findMany({
      where: { id: { in: Array.from(yuvaPankhByZone.keys()) } },
      select: { id: true, name: true, code: true, seats: true }
    })
    const yuvaZoneMap = new Map(yuvaPankhZones.map(z => [z.id, z]))
    yuvaPankhByZone.forEach((candidates, zoneId) => {
      const zone = yuvaZoneMap.get(zoneId)
      const zoneName = zone?.name || zoneId
      const zoneCode = zone?.code || ''
      const seats = Math.max(0, zone?.seats ?? 0)
      const sorted = [...candidates].sort((a, b) => b.votes - a.votes)
      sorted.slice(0, seats).forEach((c, i) => {
        yuvaPankhWinners.push({
          name: c.name,
          zoneName,
          zoneCode,
          rank: i + 1,
          votes: c.votes,
          election: 'Yuva Pankh Samiti'
        })
      })
    })

    // Trustee: groupBy and take top N per zone
    const trusteeVoteCounts = await prisma.vote.groupBy({
      by: ['trusteeCandidateId'],
      where: { trusteeCandidateId: { not: null } },
      _count: { id: true }
    })
    const trusteeCandidateIds = trusteeVoteCounts.map(v => v.trusteeCandidateId!).filter(Boolean)
    const trusteeCandidates = trusteeCandidateIds.length > 0
      ? await prisma.trusteeCandidate.findMany({
          where: { id: { in: trusteeCandidateIds } },
          include: {
            user: { select: { name: true } },
            zone: { select: { id: true, name: true, code: true, seats: true } }
          }
        })
      : []

    const trusteeByZone = new Map<string, Array<{ name: string; votes: number }>>()
    trusteeVoteCounts.forEach(vc => {
      if (!vc.trusteeCandidateId) return
      const candidate = trusteeCandidates.find(c => c.id === vc.trusteeCandidateId)
      if (!candidate?.zone) return
      const zoneId = candidate.zoneId
      const name = candidate.user?.name || candidate.name || 'Unknown'
      const votes = vc._count.id
      if (!trusteeByZone.has(zoneId)) trusteeByZone.set(zoneId, [])
      trusteeByZone.get(zoneId)!.push({ name, votes })
    })

    const trusteeZones = await prisma.zone.findMany({
      where: { id: { in: Array.from(trusteeByZone.keys()) } },
      select: { id: true, name: true, code: true, seats: true }
    })
    const trusteeZoneMap = new Map(trusteeZones.map(z => [z.id, z]))
    const trusteeWinnersUnsorted: WinnerItem[] = []
    trusteeByZone.forEach((candidates, zoneId) => {
      const zone = trusteeZoneMap.get(zoneId)
      const zoneName = zone?.name || zoneId
      const zoneCode = zone?.code || ''
      const seats = Math.max(0, zone?.seats ?? 0)
      const sorted = [...candidates].sort((a, b) => b.votes - a.votes)
      sorted.slice(0, seats).forEach((c, i) => {
        trusteeWinnersUnsorted.push({
          name: c.name,
          zoneName,
          zoneCode,
          rank: i + 1,
          votes: c.votes,
          election: 'Trust Mandal'
        })
      })
    })
    const trusteeWinners = trusteeWinnersUnsorted.sort(
      (a, b) => getTrusteeZoneSortKey({ code: a.zoneCode }) - getTrusteeZoneSortKey({ code: b.zoneCode }) || a.rank - b.rank
    )

    const all: WinnerItem[] = [...yuvaPankhWinners, ...trusteeWinners]

    return NextResponse.json({
      yuvaPankh: yuvaPankhWinners,
      trustee: trusteeWinners,
      all
    })
  } catch (e) {
    console.error('Winners list error:', e)
    return NextResponse.json(
      { error: 'Failed to load winners list', yuvaPankh: [], trustee: [], all: [] },
      { status: 500 }
    )
  }
}
