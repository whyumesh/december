'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Search, User, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'

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

export default function OfflineVotesListPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, merged: 0, unmerged: 0 })
  const [offlineVotes, setOfflineVotes] = useState<OfflineVote[]>([])
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
      const response = await fetch('/api/admin/offline-votes/trustees')
      if (!response.ok) {
        throw new Error('Failed to fetch offline votes')
      }
      const data = await response.json()
      setOfflineVotes(data.offlineVotes || [])
      setStats({
        total: data.total ?? 0,
        merged: data.merged ?? 0,
        unmerged: data.unmerged ?? 0
      })
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
      vote.voter?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                  placeholder="Search by VID, voter name, or trustee name..."
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
                  filteredVotes.map((vote) => (
                    <Card key={vote.voterId} className="border-l-4 border-l-teal-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <CardTitle className="text-lg">
                                {vote.voter?.name || 'Unknown Voter'}
                              </CardTitle>
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
                            <CardDescription>
                              <div className="space-y-1 text-sm">
                                <div><strong>VID:</strong> {vote.voterId}</div>
                                {vote.voter && (
                                  <>
                                    <div><strong>Region:</strong> {vote.voter.region}</div>
                                    {vote.voter.trusteeZone && (
                                      <div><strong>Trustee Zone:</strong> {vote.voter.trusteeZone.name}</div>
                                    )}
                                  </>
                                )}
                                <div><strong>Entered by:</strong> {vote.admin.user.name} ({vote.admin.user.email})</div>
                                <div><strong>Date:</strong> {new Date(vote.timestamp).toLocaleString()}</div>
                                {vote.isMerged && vote.mergedAt && (
                                  <div><strong>Merged at:</strong> {new Date(vote.mergedAt).toLocaleString()}</div>
                                )}
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="font-semibold text-sm text-gray-700 mb-2">Votes Cast:</div>
                          {vote.votes.length === 0 || vote.votes.every(v => !v.trusteeCandidate) ? (
                            <div className="text-sm text-gray-600 pl-4">NOTA (No selection)</div>
                          ) : (
                            <div className="space-y-2">
                              {vote.votes
                                .filter(v => v.trusteeCandidate)
                                .map((v) => (
                                  <div key={v.id} className="pl-4 border-l-2 border-teal-200">
                                    <div className="font-medium text-sm text-gray-900">
                                      {v.trusteeCandidate?.name}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Zone: {v.trusteeCandidate?.zone.name}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                          {vote.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="font-semibold text-sm text-gray-700 mb-1">Notes:</div>
                              <div className="text-sm text-gray-600 whitespace-pre-wrap">{vote.notes}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
