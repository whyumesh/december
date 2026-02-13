import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTrusteeZoneSortKey } from '@/lib/trustee-zone-order'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Public API: returns winners per zone only when results are declared. */
export async function GET() {
  try {
    const config = await prisma.electionConfig.findUnique({
      where: { key: 'resultsDeclaredAt' },
      select: { value: true }
    })
    if (!config?.value) {
      return NextResponse.json({
        declared: false,
        yuvaPankh: { name: 'Yuva Pankh Samiti', zones: [] },
        trustee: { name: 'Trust Mandal', zones: [] }
      })
    }

    const votes = await prisma.vote.findMany({
      where: {
        voter: { voterId: { not: { startsWith: 'TEST_' } } }
      },
      include: {
        yuvaPankhCandidate: {
          include: {
            user: { select: { name: true } },
            zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
          }
        },
        trusteeCandidate: {
          include: {
            user: { select: { name: true } },
            zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
          }
        }
      }
    })

    const trusteeElection = await prisma.election.findFirst({
      where: { type: 'TRUSTEES', status: 'ACTIVE' }
    })
    const offlineTrusteeVotes = trusteeElection
      ? await prisma.offlineVote.findMany({
          where: { electionId: trusteeElection.id, trusteeCandidateId: { not: null } },
          include: {
            trusteeCandidate: {
              include: {
                user: { select: { name: true } },
                zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
              }
            }
          }
        })
      : []

    const yuvaMap = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>()
    votes.forEach((v) => {
      if (!v.yuvaPankhCandidate?.zone) return
      const z = v.yuvaPankhCandidate.zone
      const zoneId = v.yuvaPankhCandidate.zoneId!
      const cid = v.yuvaPankhCandidateId!
      const name = v.yuvaPankhCandidate.user?.name || v.yuvaPankhCandidate.name || 'Unknown'
      if (!yuvaMap.has(zoneId)) yuvaMap.set(zoneId, { zone: z, candidates: new Map() })
      const entry = yuvaMap.get(zoneId)!
      if (!entry.candidates.has(cid)) entry.candidates.set(cid, { id: cid, name, votes: 0 })
      entry.candidates.get(cid)!.votes++
    })

    const trusteeOnline = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>()
    votes.forEach((v) => {
      if (!v.trusteeCandidate?.zone) return
      const z = v.trusteeCandidate.zone
      const zoneId = v.trusteeCandidate.zoneId!
      const cid = v.trusteeCandidateId!
      const name = v.trusteeCandidate.user?.name || v.trusteeCandidate.name || 'Unknown'
      if (!trusteeOnline.has(zoneId)) trusteeOnline.set(zoneId, { zone: z, candidates: new Map() })
      const entry = trusteeOnline.get(zoneId)!
      if (!entry.candidates.has(cid)) entry.candidates.set(cid, { id: cid, name, votes: 0 })
      entry.candidates.get(cid)!.votes++
    })

    const trusteeOffline = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>()
    offlineTrusteeVotes.forEach((v) => {
      if (!v.trusteeCandidate?.zone) return
      const z = v.trusteeCandidate.zone
      const zoneId = v.trusteeCandidate.zoneId!
      const cid = v.trusteeCandidateId!
      const name = v.trusteeCandidate.user?.name || v.trusteeCandidate.name || 'Unknown'
      if (!trusteeOffline.has(zoneId)) trusteeOffline.set(zoneId, { zone: z, candidates: new Map() })
      const entry = trusteeOffline.get(zoneId)!
      if (!entry.candidates.has(cid)) entry.candidates.set(cid, { id: cid, name, votes: 0 })
      entry.candidates.get(cid)!.votes++
    })

    const mergeTrustee = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>()
    new Set([...trusteeOnline.keys(), ...trusteeOffline.keys()]).forEach((zoneId) => {
      const onZ = trusteeOnline.get(zoneId)
      const offZ = trusteeOffline.get(zoneId)
      const zone = onZ?.zone || offZ?.zone
      if (!zone) return
      mergeTrustee.set(zoneId, { zone, candidates: new Map() })
      const out = mergeTrustee.get(zoneId)!
      ;[onZ, offZ].forEach((src) => {
        src?.candidates.forEach((c, id) => {
          if (!out.candidates.has(id)) out.candidates.set(id, { id: c.id, name: c.name, votes: 0 })
          out.candidates.get(id)!.votes += c.votes
        })
      })
    })

    const toWinners = (
      zoneMap: Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>,
      sortZones?: (a: any, b: any) => number
    ) => {
      let zones = Array.from(zoneMap.entries()).map(([zoneId, data]) => {
        const seats = Math.max(0, data.zone?.seats ?? 0)
        const candidates = Array.from(data.candidates.values()).sort((a, b) => b.votes - a.votes)
        const winners = candidates.slice(0, seats).map((c, i) => ({ ...c, rank: i + 1 }))
        return {
          zoneId,
          zone: data.zone,
          winners
        }
      })
      if (sortZones) zones = zones.sort((a, b) => sortZones(a.zone, b.zone))
      return zones
    }

    const yuvaZones = toWinners(yuvaMap)
    const trusteeZones = toWinners(mergeTrustee, (a, b) => getTrusteeZoneSortKey(a) - getTrusteeZoneSortKey(b))

    return NextResponse.json({
      declared: true,
      declaredAt: config.value,
      yuvaPankh: { name: 'Yuva Pankh Samiti', zones: yuvaZones },
      trustee: { name: 'Trust Mandal', zones: trusteeZones }
    })
  } catch (e) {
    console.error('Public winners error:', e)
    return NextResponse.json(
      { declared: false, yuvaPankh: { name: 'Yuva Pankh Samiti', zones: [] }, trustee: { name: 'Trust Mandal', zones: [] } }
    )
  }
}
