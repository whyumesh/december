import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canMergeOfflineVotes } from '@/lib/offline-vote-auth'
import { AuthorizationError, handleError } from '@/lib/error-handler'
import { sortTrusteeZones } from '@/lib/trustee-zone-order'
import { encryptXlsxBuffer, getExcelExportPassword } from '@/lib/xlsx-encryption'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

function toExcelResponse(buffer: unknown, filename: string) {
  let body: BodyInit
  // exceljs can return Buffer | ArrayBuffer | Uint8Array depending on runtime
  if (buffer instanceof Uint8Array) {
    body = buffer
  } else if (buffer instanceof ArrayBuffer) {
    body = new Uint8Array(buffer)
  } else if (Buffer.isBuffer(buffer)) {
    body = new Uint8Array(buffer)
  } else {
    body = buffer as any
  }

  const len = (buffer as any)?.byteLength || (buffer as any)?.length || 0

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(len),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

function normalizePick(name: string | null | undefined) {
  if (!name) return null
  const t = String(name).trim()
  if (!t) return null
  if (t.toUpperCase().startsWith('NOTA')) return 'NOTA'
  return t
}

export async function GET(request: NextRequest) {
  try {
    const isMainAdmin = await canMergeOfflineVotes()
    if (!isMainAdmin) {
      throw new AuthorizationError('Unauthorized. Only main admin can export votes.')
    }

    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SKMMMS Election 2026'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Active trustee election (preferred) – if missing, export across all trustee offline votes
    const election = await prisma.election.findFirst({
      where: { type: 'TRUSTEES', status: 'ACTIVE' },
      select: { id: true }
    })

    const where: any = {}
    if (election?.id) where.electionId = election.id

    // Zones meta (ordered)
    const trusteeZonesRaw = await prisma.zone.findMany({
      where: { electionType: 'TRUSTEES', isActive: true },
      select: { code: true, name: true, seats: true }
    })
    const trusteeZones = sortTrusteeZones(trusteeZonesRaw).map((z) => ({
      code: String(z.code).toUpperCase(),
      name: z.name,
      seats: Math.max(1, Number(z.seats) || 1)
    }))

    // Fetch offline votes (VID + candidate + zone + admin + timestamp)
    const offlineRows = await prisma.offlineVote.findMany({
      where,
      select: {
        voterId: true,
        timestamp: true,
        admin: { select: { user: { select: { email: true } } } },
        trusteeCandidate: {
          select: {
            name: true,
            zone: { select: { code: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    // Group by VID
    const perVoter = new Map<
      string,
      {
        voterId: string
        timestamp: Date | null
        addedBy: string | null
        picksByZone: Map<string, string[]>
      }
    >()

    for (const row of offlineRows) {
      const vid = String(row.voterId || '').trim()
      if (!vid || vid.toUpperCase().startsWith('TEST_')) continue

      if (!perVoter.has(vid)) {
        perVoter.set(vid, {
          voterId: vid,
          timestamp: row.timestamp ?? null,
          addedBy: row.admin?.user?.email || null,
          picksByZone: new Map()
        })
      }

      const entry = perVoter.get(vid)!
      // Keep max timestamp
      if (row.timestamp && (!entry.timestamp || row.timestamp > entry.timestamp)) {
        entry.timestamp = row.timestamp
      }
      if (!entry.addedBy && row.admin?.user?.email) {
        entry.addedBy = row.admin.user.email
      }

      const zoneCode = String(row.trusteeCandidate?.zone?.code || '').toUpperCase()
      const pick = normalizePick(row.trusteeCandidate?.name)
      if (!zoneCode || !pick) continue
      const current = entry.picksByZone.get(zoneCode) || []
      if (!current.includes(pick)) current.push(pick)
      entry.picksByZone.set(zoneCode, current)
    }

    const voters = Array.from(perVoter.values()).sort((a, b) => {
      const at = a.timestamp ? a.timestamp.getTime() : 0
      const bt = b.timestamp ? b.timestamp.getTime() : 0
      if (bt !== at) return bt - at
      return a.voterId.localeCompare(b.voterId)
    })

    // Sheet 1: Offline Votes (VID + who voted to whom)
    const votesSheet = workbook.addWorksheet('Offline Votes')

    const zoneSeatColumns = trusteeZones.flatMap((z) => {
      const cols: Array<{ header: string; key: string; width: number }> = []
      for (let i = 1; i <= z.seats; i++) {
        cols.push({
          header: `${z.name} (${i})`,
          key: `${z.code}_${i}`,
          width: 28
        })
      }
      return cols
    })

    votesSheet.columns = [
      { header: 'VID', key: 'vid', width: 18 },
      { header: 'Timestamp', key: 'timestamp', width: 22 },
      { header: 'Vote added by', key: 'addedBy', width: 26 },
      ...zoneSeatColumns
    ]

    voters.forEach((v) => {
      const row: Record<string, any> = {
        vid: v.voterId,
        timestamp: v.timestamp ? v.timestamp.toISOString() : '',
        addedBy: v.addedBy || ''
      }

      trusteeZones.forEach((z) => {
        const picks = (v.picksByZone.get(z.code) || []).map((p) => normalizePick(p) || '').filter(Boolean)
        const seatValues = picks.slice(0, z.seats)
        while (seatValues.length < z.seats) seatValues.push('NOTA')
        for (let i = 1; i <= z.seats; i++) {
          row[`${z.code}_${i}`] = seatValues[i - 1] || 'NOTA'
        }
      })

      votesSheet.addRow(row)
    })

    votesSheet.getRow(1).font = { bold: true }

    // Sheet 2: Leading candidates (offline)
    const leadingSheet = workbook.addWorksheet('Offline Leading')
    leadingSheet.columns = [
      { header: 'Zone', key: 'zone', width: 26 },
      { header: 'Candidate', key: 'candidate', width: 32 },
      { header: 'Votes', key: 'votes', width: 12 },
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Is NOTA', key: 'isNota', width: 10 },
      { header: 'Is Leading', key: 'isLeading', width: 12 }
    ]

    trusteeZones.forEach((z) => {
      const counts = new Map<string, number>()
      voters.forEach((v) => {
        const picks = (v.picksByZone.get(z.code) || []).map((p) => normalizePick(p) || '').filter(Boolean)
        const seatValues = picks.slice(0, z.seats)
        while (seatValues.length < z.seats) seatValues.push('NOTA')
        seatValues.forEach((name) => {
          counts.set(name, (counts.get(name) || 0) + 1)
        })
      })

      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
      sorted.forEach(([candidate, votes], idx) => {
        const rank = idx + 1
        const isNota = candidate === 'NOTA'
        const isLeading = !isNota && rank <= z.seats
        leadingSheet.addRow({
          zone: z.name,
          candidate,
          votes,
          rank,
          isNota: isNota ? 'Yes' : 'No',
          isLeading: isLeading ? 'Yes' : 'No'
        })
      })

      leadingSheet.addRow({ zone: '', candidate: '', votes: '', rank: '', isNota: '', isLeading: '' })
    })

    leadingSheet.getRow(1).font = { bold: true }

    const ts = new Date().toISOString().split('T')[0]
    const filename = `offline-votes-${ts}.xlsx`
    const buffer = await workbook.xlsx.writeBuffer()
    const encrypted = await encryptXlsxBuffer(buffer, getExcelExportPassword())
    return toExcelResponse(encrypted, filename)
  } catch (error) {
    return handleError(error, { endpoint: request.nextUrl.pathname, method: request.method })
  }
}

