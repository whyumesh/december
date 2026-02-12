'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Search, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { sortTrusteeZones } from '@/lib/trustee-zone-order'

interface OfflineVote {
  voterId: string
  votes: Array<{
    id: string
    trusteeCandidate: {
      id: string
      name: string
      nameGujarati?: string
      zone: {
        id: string
        name: string
        nameGujarati: string
        code: string
      }
    } | null
    timestamp: string
  }>
  admin: {
    id: string
    adminId: string
    user: {
      name: string
      email: string
    }
  }
  timestamp: string
  isMerged: boolean
  mergedAt: string | null
  notes: string | null
  voter: {
    id: string
    voterId: string
    name: string
    region: string
    phone: string | null
    email: string | null
    trusteeZone: {
      id: string
      name: string
      nameGujarati: string
      code: string
    } | null
  } | null
}

interface TrusteeZoneMeta {
  code: string
  name: string
  seats: number
}

export default function OfflineVotesListPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, merged: 0, unmerged: 0 })
  const [offlineVotes, setOfflineVotes] = useState<OfflineVote[]>([])
  const [trusteeZones, setTrusteeZones] = useState<TrusteeZoneMeta[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMerged, setFilterMerged] = useState<string>('all') // 'all', 'merged', 'unmerged'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/offline-votes/trustees/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    fetchOfflineVotes()
  }, [])

  const fetchOfflineVotes = async () => {
    setIsLoading(true)
    try {
      const [votesRes, zonesRes] = await Promise.all([
        fetch('/api/admin/offline-votes/trustees'),
        fetch('/api/zones?electionType=TRUSTEES')
      ])

      if (!votesRes.ok) throw new Error('Failed to fetch offline votes')
      const votesData = await votesRes.json()
      setOfflineVotes(votesData.offlineVotes || [])
      setStats({
        total: votesData.total ?? 0,
        merged: votesData.merged ?? 0,
        unmerged: votesData.unmerged ?? 0
      })

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        const zones = Array.isArray(zonesData?.zones) ? zonesData.zones : []
        setTrusteeZones(
          sortTrusteeZones(
            zones.map((z: any) => ({
              code: z.code,
              name: z.name,
              seats: z.seats
            }))
          )
        )
      } else {
        setTrusteeZones([])
      }
    } catch (error: unknown) {
      console.error('Error fetching offline votes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVotes = offlineVotes.filter(vote => {
    // Search filter
    const matchesSearch = !searchTerm || 
      vote.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vote.votes.some(v => 
        v.trusteeCandidate?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.trusteeCandidate?.zone.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    // Merge status filter
    const matchesFilter = filterMerged === 'all' ||
      (filterMerged === 'merged' && vote.isMerged) ||
      (filterMerged === 'unmerged' && !vote.isMerged)
    
    return matchesSearch && matchesFilter
  })

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Logo />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Offline Votes List</CardTitle>
            <CardDescription>
              View all offline votes for trustee elections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Offline Votes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{stats.merged}</div>
                  <div className="text-sm text-gray-600">Merged</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{stats.unmerged}</div>
                  <div className="text-sm text-gray-600">Unmerged</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by VID or trustee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterMerged === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMerged('all')}
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={filterMerged === 'merged' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMerged('merged')}
                >
                  Merged ({stats.merged})
                </Button>
                <Button
                  variant={filterMerged === 'unmerged' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMerged('unmerged')}
                >
                  Unmerged ({stats.unmerged})
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No offline votes found{searchTerm ? ` matching "${searchTerm}"` : ''}.
                  </div>
                ) : (
                  filteredVotes.map((vote) => {
                    const pickedByZoneCode = new Map<string, string[]>()
                    vote.votes.forEach((v) => {
                      const zc = v.trusteeCandidate?.zone?.code
                      const name = v.trusteeCandidate?.name
                      if (!zc || !name) return
                      const code = String(zc).toUpperCase()
                      const current = pickedByZoneCode.get(code) || []
                      if (!current.includes(name)) current.push(name)
                      pickedByZoneCode.set(code, current)
                    })

                    const zonesToRender = trusteeZones.length
                      ? trusteeZones
                      : sortTrusteeZones(
                          Array.from(
                            new Map(
                              vote.votes
                                .map((v) => v.trusteeCandidate?.zone)
                                .filter(Boolean)
                                .map((z: any) => [z.code, { code: z.code, name: z.name, seats: 1 }])
                            ).values()
                          )
                        )

                    return (
                      <details key={vote.voterId} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <summary className="cursor-pointer list-none">
                          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <div className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">VID:</span> {vote.voterId}
                              </div>
                              <div className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Timestamp:</span> {new Date(vote.timestamp).toLocaleString()}
                              </div>
                              <div className="text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Vote added by:</span> {vote.admin.user.email}
                              </div>
                            </div>
                            <Badge variant={vote.isMerged ? 'default' : 'secondary'}>
                              {vote.isMerged ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Merged
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Unmerged
                                </>
                              )}
                            </Badge>
                          </div>
                        </summary>
                        <div className="px-4 py-4 space-y-3">
                          <div className="text-sm font-semibold text-slate-900">Votes (Zone-wise)</div>
                          <div className="space-y-3">
                            {zonesToRender.map((z) => {
                              const seats = Math.max(1, Number((z as any).seats) || 1)
                              const picked = pickedByZoneCode.get(String(z.code).toUpperCase()) || []
                              const seatValues = picked.slice(0, seats)
                              while (seatValues.length < seats) seatValues.push('NOTA')
                              return (
                                <div key={z.code} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{z.name}</div>
                                    <Badge variant="outline" className="bg-white">
                                      {seats} seat{seats !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  <ul className="mt-2 space-y-1">
                                    {seatValues.map((val, idx) => (
                                      <li key={`${z.code}_${idx}`} className="text-sm text-slate-800">
                                        <span className="font-medium">{idx + 1}.</span> {val}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            })}
                          </div>
                          {vote.notes && (
                            <div className="pt-3 border-t border-slate-200">
                              <div className="text-sm font-semibold text-slate-900 mb-1">Notes</div>
                              <div className="text-sm text-slate-700 whitespace-pre-wrap">{vote.notes}</div>
                            </div>
                          )}
                        </div>
                      </details>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
