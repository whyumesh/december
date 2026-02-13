'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, Users, Search } from 'lucide-react'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { sortTrusteeZones } from '@/lib/trustee-zone-order'

interface Trustee {
  id: string
  name: string
  nameGujarati?: string
  phone?: string
  email?: string
  region: string
  zone: {
    id: string
    name: string
    nameGujarati: string
    code: string
    seats: number
  }
}

interface Zone {
  id: string
  name: string
  nameGujarati: string
  code: string
  seats: number
  trustees: Trustee[]
}

interface VoterInfo {
  id: string
  voterId: string
  name: string
  region: string
  trusteeZone: {
    id: string
    name: string
    nameGujarati: string
    code: string
    seats: number
  } | null
  phone?: string
  email?: string
}

interface UploadedVoteItem {
  voterId: string
  timestamp: string | null
  votesByZone: Array<{
    code: string
    name: string
    seats: number
    selectedCandidateNames: string[]
  }>
}

export default function OfflineVoteEntryPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAdminAuth()
  const router = useRouter()
  
  const [step, setStep] = useState<'vid' | 'form'>('vid')
  const [vid, setVid] = useState('')
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedTrustees, setSelectedTrustees] = useState<Record<string, string[]>>({})
  const [zoneSearchTerms, setZoneSearchTerms] = useState<Record<string, string>>({})
  const [zoneSearchTerms2, setZoneSearchTerms2] = useState<Record<string, string>>({}) // Second search box for Mumbai
  const [showPreview, setShowPreview] = useState(false)
  const [showPickerByZone, setShowPickerByZone] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadedVotes, setUploadedVotes] = useState<UploadedVoteItem[]>([])
  const [isLoadingUploadedVids, setIsLoadingUploadedVids] = useState(false)
  const [uploadedVidsError, setUploadedVidsError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/offline-votes/trustees/login')
    }
  }, [isAuthenticated, authLoading, router])

  const fetchUploadedVids = async () => {
    setIsLoadingUploadedVids(true)
    setUploadedVidsError('')
    try {
      const response = await fetch('/api/admin/offline-votes/trustees/vids')
      const data = await response.json()
      if (!response.ok) {
        setUploadedVotes([])
        setUploadedVidsError(data.error || 'Failed to load uploaded VIDs')
        return
      }
      const items = Array.isArray(data?.items) ? data.items : []
      setUploadedVotes(
        items.filter((it: any) => typeof it?.voterId === 'string' && it.voterId.trim().length > 0)
      )
    } catch (err: any) {
      setUploadedVotes([])
      setUploadedVidsError(err?.message || 'Failed to load uploaded VIDs')
    } finally {
      setIsLoadingUploadedVids(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated && step === 'vid') {
      fetchUploadedVids()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, step])

  const handleValidateVID = async () => {
    if (!vid.trim()) {
      setError('Please enter a Voter ID (VID)')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const response = await fetch('/api/admin/offline-votes/trustees/validate-vid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: vid.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to validate VID')
        setVoterInfo(null)
        return
      }

      if (!data.canVote) {
        if (data.hasOnlineVote) {
          setError('This voter has already voted online. Cannot submit offline vote.')
        } else if (data.hasOfflineVote) {
          setError('This voter already has an offline vote. Please merge or delete existing vote first.')
        } else {
          setError('This voter cannot vote at this time.')
        }
        setVoterInfo(null)
        return
      }

      setVoterInfo(data.voter)
      setError('')
      
      // Fetch trustees for the form
      await fetchTrustees()
      
      // Move to form step
      setStep('form')
    } catch (err: any) {
      setError(err.message || 'Failed to validate VID')
      setVoterInfo(null)
    } finally {
      setIsValidating(false)
    }
  }

  const fetchTrustees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/trustees')
      if (!response.ok) {
        throw new Error('Failed to load trustees')
      }

      const data = await response.json()
      
      // Group trustees by zone
      const zoneMap: Record<string, Zone> = {}
      const seenTrusteeIds = new Set<string>()

      data.trustees.forEach((trustee: Trustee) => {
        if (seenTrusteeIds.has(trustee.id)) {
          return
        }
        seenTrusteeIds.add(trustee.id)

        if (!zoneMap[trustee.zone.id]) {
          zoneMap[trustee.zone.id] = {
            id: trustee.zone.id,
            name: trustee.zone.name,
            nameGujarati: trustee.zone.nameGujarati,
            code: trustee.zone.code,
            seats: trustee.zone.seats,
            trustees: []
          }
        }
        zoneMap[trustee.zone.id].trustees.push(trustee)
      })

      setZones(sortTrusteeZones(Object.values(zoneMap)))
    } catch (err: any) {
      setError(err.message || 'Failed to load trustees')
    } finally {
      setIsLoading(false)
    }
  }

  /** Match search term: partial name (any word) or initials e.g. ASM for Alka Sudhik Madan */
  const trusteeMatchesSearch = (trustee: Trustee, term: string): boolean => {
    if (!term || !term.trim()) return false
    const t = term.trim().toLowerCase()
    const name = (trustee.name || '').toLowerCase()
    const nameGujarati = (trustee.nameGujarati || '').toLowerCase()
    if (name.includes(t) || nameGujarati.includes(t)) return true
    const words = name.split(/\s+/).filter(Boolean)
    const initials = words.map(w => w[0]).join('')
    if (initials.startsWith(t) || initials === t) return true
    if (t.length >= 2 && initials.includes(t)) return true
    return false
  }

  /** Match search term against multiple search terms (for Mumbai with 2 search boxes) */
  const trusteeMatchesMultipleSearch = (trustee: Trustee, term1: string, term2: string): boolean => {
    const match1 = term1 ? trusteeMatchesSearch(trustee, term1) : false
    const match2 = term2 ? trusteeMatchesSearch(trustee, term2) : false
    // If both search boxes have terms, trustee must match at least one
    if (term1 && term2) {
      return match1 || match2
    }
    // If only one has a term, use that
    if (term1) return match1
    if (term2) return match2
    return false
  }

  const handleTrusteeSelect = (zoneId: string, trusteeId: string, zoneSeats: number) => {
    const maxSeats = Math.max(1, Number(zoneSeats) || 1)
    const zone = zones.find(z => z.id === zoneId)
    const isMumbai = zone?.code === 'MUMBAI'
    
    setSelectedTrustees(prev => {
      const current = prev[zoneId] || []
      const idx = current.indexOf(trusteeId)
      if (idx >= 0) {
        const next = current.filter(id => id !== trusteeId)
        return { ...prev, [zoneId]: next }
      }
      if (current.length >= maxSeats) return prev
      return { ...prev, [zoneId]: [...current, trusteeId] }
    })
    
    // Clear search boxes after selection (for Mumbai, clear both search boxes)
    if (isMumbai) {
      setZoneSearchTerms(prev => ({ ...prev, [zoneId]: '' }))
      setZoneSearchTerms2(prev => ({ ...prev, [zoneId]: '' }))
    } else {
      setZoneSearchTerms(prev => ({ ...prev, [zoneId]: '' }))
    }
  }

  const handleRemoveTrustee = (zoneId: string, trusteeId: string) => {
    setSelectedTrustees(prev => ({
      ...prev,
      [zoneId]: (prev[zoneId] || []).filter(id => id !== trusteeId)
    }))
  }

  const handleSubmit = async () => {
    if (!voterInfo?.voterId) {
      setError('Voter information is missing. Please go back and validate VID again.')
      return
    }

    const seatsPerZone = (zone: Zone) => Math.max(1, zone.seats ?? 1)
    for (const zone of zones) {
      const selected = selectedTrustees[zone.id] || []
      const maxSeats = seatsPerZone(zone)
      if (selected.length > maxSeats) {
        setError(`Zone "${zone.name}": select at most ${maxSeats} trustee(s).`)
        return
      }
    }

    // Show preview instead of submitting directly
    setShowPreview(true)
  }

  const handleConfirmSubmit = async () => {
    if (!voterInfo?.voterId) {
      setError('Voter information is missing. Please go back and validate VID again.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const votes: Record<string, string> = {}
      Object.entries(selectedTrustees).forEach(([zoneId, trusteeIds]) => {
        const list = Array.isArray(trusteeIds) ? trusteeIds : []
        list.forEach((trusteeId, i) => {
          if (trusteeId && typeof trusteeId === 'string') {
            votes[`${zoneId}_${i}`] = trusteeId
          }
        })
      })

      const response = await fetch('/api/admin/offline-votes/trustees/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: voterInfo.voterId.trim(),
          votes,
          notes: typeof notes === 'string' ? notes.trim() || undefined : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit offline vote')
        setShowPreview(false)
        return
      }

      setSuccess(true)
      // Refresh VID list so the newly submitted VID appears immediately
      fetchUploadedVids()
      setShowPreview(false)
      setTimeout(() => {
        setStep('vid')
        setVid('')
        setVoterInfo(null)
        setSelectedTrustees({})
        setZoneSearchTerms({})
        setZoneSearchTerms2({})
        setShowPickerByZone({})
        setNotes('')
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit offline vote')
      setShowPreview(false)
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const loginId = (user as any)?.email || (user as any)?.name || (user as any)?.id || 'Unknown'
  const normalizedVid = vid.trim().toLowerCase()
  const filteredUploadedVotes = normalizedVid
    ? uploadedVotes.filter((v) => v.voterId.toLowerCase().includes(normalizedVid))
    : uploadedVotes

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 to-emerald-50/90 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Logo />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Login ID:</span>
            <Badge variant="outline" className="border-teal-300 text-teal-900 bg-white/60">
              {loginId}
            </Badge>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Offline Trustee Vote Entry</CardTitle>
            <CardDescription>
              Enter offline votes for trustee elections. Start by entering the Voter ID (VID).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-4 ring-emerald-200 animate-success-fade-in opacity-0">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <span className="absolute inset-0 flex h-20 w-20 animate-ping items-center justify-center rounded-full bg-emerald-300/40 [animation-duration:1.5s]" aria-hidden />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg animate-success-pop opacity-0">
                        <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900">Vote submitted</h3>
                    <p className="mt-2 text-emerald-700">Offline vote recorded successfully. Form will reset for the next voter.</p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-emerald-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Resetting in a moment…</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {step === 'vid' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vid">Voter ID (VID)</Label>
                  <Input
                    id="vid"
                    value={vid}
                    onChange={(e) => setVid(e.target.value)}
                    placeholder="Enter Voter ID"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleValidateVID()
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleValidateVID}
                  disabled={isValidating || !vid.trim()}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate & Continue'
                  )}
                </Button>

                {/* Uploaded VIDs list (VID only, no names) */}
                <div className="mt-2 rounded-lg border border-teal-200 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">
                      Offline votes uploaded (VID only)
                    </div>
                    <Badge variant="secondary">
                      {filteredUploadedVotes.length}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    This list filters automatically as you type the VID above.
                  </p>

                  {isLoadingUploadedVids ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading uploaded VIDs…
                    </div>
                  ) : uploadedVidsError ? (
                    <div className="mt-3 text-sm text-red-700">
                      {uploadedVidsError}
                    </div>
                  ) : filteredUploadedVotes.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-600">
                      No uploaded offline votes found{normalizedVid ? ` matching "${vid.trim()}"` : ''}.
                    </div>
                  ) : (
                    <div className="mt-3 max-h-48 overflow-auto rounded-md border border-teal-100 bg-white">
                      <div className="divide-y divide-teal-50">
                        {filteredUploadedVotes.slice(0, 100).map((item) => {
                          const ts = item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'
                          return (
                            <details key={item.voterId} className="px-3 py-2">
                              <summary className="cursor-pointer list-none">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-sm text-slate-900 font-semibold">VID: {item.voterId}</div>
                                  <div className="text-xs text-slate-600">Timestamp: {ts}</div>
                                </div>
                              </summary>
                              <div className="mt-3 space-y-3">
                                {item.votesByZone.map((z) => {
                                  const seats = Math.max(1, Number(z.seats) || 1)
                                  const picked = Array.isArray(z.selectedCandidateNames) ? z.selectedCandidateNames : []
                                  const seatValues = picked.slice(0, seats)
                                  while (seatValues.length < seats) seatValues.push('NOTA')
                                  return (
                                    <div key={z.code} className="rounded-md border border-teal-100 bg-teal-50/40 p-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-teal-900">{z.name}</div>
                                        <Badge variant="outline" className="border-teal-200 text-teal-900 bg-white/60">
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
                            </details>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'form' && voterInfo && (
              <div className="space-y-6">
                {/* VID display */}
                <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg border border-teal-200 bg-teal-50/80">
                  <span className="text-sm font-medium text-teal-800">Voter ID (VID):</span>
                  <Badge variant="outline" className="border-teal-300 text-teal-900 bg-white font-mono text-base px-3 py-1">
                    {vid.trim() || voterInfo.voterId}
                  </Badge>
                  {voterInfo.name && (
                    <span className="text-sm text-teal-700">— {voterInfo.name}</span>
                  )}
                </div>

                {/* Trustee Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Trustees
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Search by name or initials (e.g. ASM for Alka Sudhik Madan). Select up to the allowed seats per zone. Leaving a zone empty counts as NOTA.
                  </p>

                  {!isLoading && zones.length > 0 && (
                    <div className="mb-6 p-4 bg-teal-50/80 border border-teal-200 rounded-lg">
                      <p className="text-sm font-medium text-teal-800 mb-2">Trustee election seat count</p>
                      <p className="text-sm text-teal-700">
                        Total: <strong>{zones.reduce((sum, z) => sum + Math.max(1, z.seats), 0)}</strong> seat(s) across <strong>{zones.length}</strong> zone(s)
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-teal-700">
                        {zones.map((zone) => (
                          <span key={zone.id}>
                            {zone.name} ({Math.max(1, zone.seats)} seat{Math.max(1, zone.seats) !== 1 ? 's' : ''})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                        {zones.map((zone) => {
                          const isMumbai = zone.code === 'MUMBAI'
                          const zoneSearch = (zoneSearchTerms[zone.id] || '').trim()
                          const zoneSearch2 = isMumbai ? (zoneSearchTerms2[zone.id] || '').trim() : ''
                          const filtered = isMumbai
                            ? (zoneSearch || zoneSearch2
                                ? zone.trustees.filter((t) => trusteeMatchesMultipleSearch(t, zoneSearch, zoneSearch2))
                                : [])
                            : (zoneSearch
                                ? zone.trustees.filter((t) => trusteeMatchesSearch(t, zoneSearch))
                                : [])
                          const selected = selectedTrustees[zone.id] || []
                          const maxSeats = Math.max(1, zone.seats)
                          // Show search boxes if seats are still available (same behavior for all zones)
                          const showPicker = selected.length < maxSeats
                          return (
                            <Card key={zone.id} className="border-teal-200/80 overflow-hidden">
                              <CardHeader className="bg-teal-50/50 pb-3">
                                <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2 text-teal-900">
                                  <span>{zone.name} ({zone.nameGujarati})</span>
                                  <Badge variant="outline" className="border-teal-300 text-teal-800">{selected.length}/{maxSeats} selected</Badge>
                                </CardTitle>
                                <CardDescription className="text-teal-700">
                                  Select up to {maxSeats} trustee(s). No selection = NOTA for this zone.
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-3">
                                {selected.length > 0 && (
                                  <div className="space-y-2 mb-4">
                                    {selected.map((id) => {
                                      const trustee = zone.trustees.find((t) => t.id === id)
                                      if (!trustee) return null
                                      return (
                                        <div
                                          key={trustee.id}
                                          className="flex items-center justify-between gap-2 p-3 rounded-lg border-2 border-teal-200 bg-teal-50/80"
                                        >
                                          <div>
                                            <div className="font-medium text-teal-900">{trustee.name}</div>
                                            <div className="text-sm text-teal-600">{trustee.region}</div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-teal-600 hover:text-red-600 hover:bg-red-50 shrink-0"
                                            onClick={() => handleRemoveTrustee(zone.id, trustee.id)}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {showPicker && (
                                  <>
                                    {isMumbai ? (
                                      <>
                                        {selected.length === 0 && (
                                          <div className="flex items-center gap-2">
                                            <Search className="h-4 w-4 text-teal-600" />
                                            <Input
                                              value={zoneSearchTerms[zone.id] || ''}
                                              onChange={(e) => setZoneSearchTerms((prev) => ({ ...prev, [zone.id]: e.target.value }))}
                                              placeholder={`Search trustees in ${zone.name} (name or initials) - Search 1`}
                                              className="flex-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500/20"
                                            />
                                          </div>
                                        )}
                                        {selected.length < maxSeats && (
                                          <div className="flex items-center gap-2">
                                            <Search className="h-4 w-4 text-teal-600" />
                                            <Input
                                              value={zoneSearchTerms2[zone.id] || ''}
                                              onChange={(e) => setZoneSearchTerms2((prev) => ({ ...prev, [zone.id]: e.target.value }))}
                                              placeholder={`Search trustees in ${zone.name} (name or initials) - Search 2`}
                                              className="flex-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500/20"
                                            />
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Search className="h-4 w-4 text-teal-600" />
                                        <Input
                                          value={zoneSearchTerms[zone.id] || ''}
                                          onChange={(e) => setZoneSearchTerms((prev) => ({ ...prev, [zone.id]: e.target.value }))}
                                          placeholder={`Search trustees in ${zone.name} (name or initials)`}
                                          className="flex-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500/20"
                                        />
                                      </div>
                                    )}
                                    {isMumbai ? (
                                      // For Mumbai, show candidates if either search box has a term
                                      (!zoneSearch && !zoneSearch2) ? (
                                        <p className="text-sm text-teal-600 py-4">Type in the search box{selected.length === 0 ? 'es' : ''} to see candidates for this zone.</p>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {filtered.map((trustee) => {
                                            const isSelected = selected.includes(trustee.id)
                                            const atLimit = selected.length >= maxSeats
                                            return (
                                              <button
                                                key={trustee.id}
                                                type="button"
                                                onClick={() => atLimit && !isSelected ? undefined : handleTrusteeSelect(zone.id, trustee.id, zone.seats)}
                                                className={`p-3 border-2 rounded-lg text-left transition-all ${
                                                  isSelected ? 'border-teal-500 bg-teal-50' : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50/50'
                                                } ${atLimit && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-teal-900">{trustee.name}</div>
                                                    <div className="text-sm text-teal-600">{trustee.region}</div>
                                                  </div>
                                                  {isSelected && <CheckCircle className="h-5 w-5 text-teal-600 shrink-0" />}
                                                </div>
                                              </button>
                                            )
                                          })}
                                          {filtered.length === 0 && (
                                            <p className="text-sm text-teal-600 col-span-full">
                                              No trustees match {(zoneSearch && zoneSearch2) ? 'the search terms' : `"${zoneSearch || zoneSearch2}"`}.
                                            </p>
                                          )}
                                        </div>
                                      )
                                    ) : (
                                      !zoneSearch ? (
                                        <p className="text-sm text-teal-600 py-4">Type in the search box to see candidates for this zone.</p>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {filtered.map((trustee) => {
                                            const isSelected = selected.includes(trustee.id)
                                            const atLimit = selected.length >= maxSeats
                                            return (
                                              <button
                                                key={trustee.id}
                                                type="button"
                                                onClick={() => atLimit && !isSelected ? undefined : handleTrusteeSelect(zone.id, trustee.id, zone.seats)}
                                                className={`p-3 border-2 rounded-lg text-left transition-all ${
                                                  isSelected ? 'border-teal-500 bg-teal-50' : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50/50'
                                                } ${atLimit && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-teal-900">{trustee.name}</div>
                                                    <div className="text-sm text-teal-600">{trustee.region}</div>
                                                  </div>
                                                  {isSelected && <CheckCircle className="h-5 w-5 text-teal-600 shrink-0" />}
                                                </div>
                                              </button>
                                            )
                                          })}
                                          {filtered.length === 0 && (
                                            <p className="text-sm text-teal-600 col-span-full">
                                              No trustees match &quot;{zoneSearch}&quot;.
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this offline vote entry..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Preview Modal */}
                {showPreview && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                      <CardHeader>
                        <CardTitle>Preview Before Submission</CardTitle>
                        <CardDescription>Review your selections before submitting the offline vote</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-sm text-gray-700">Voter ID:</div>
                          <div className="text-gray-900">{voterInfo?.voterId}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-semibold text-sm text-gray-700">Selected Trustees:</div>
                          {zones.map((zone) => {
                            const selected = selectedTrustees[zone.id] || []
                            const maxSeats = Math.max(1, zone.seats ?? 1)
                            const seatValues: Array<{ label: string; region?: string }> = []
                            for (let i = 0; i < maxSeats; i++) {
                              const id = selected[i]
                              if (!id) {
                                seatValues.push({ label: 'NOTA' })
                                continue
                              }
                              const trustee = zone.trustees.find((t) => t.id === id)
                              if (!trustee) {
                                seatValues.push({ label: 'NOTA' })
                                continue
                              }
                              seatValues.push({ label: trustee.name, region: trustee.region })
                            }
                            return (
                              <div key={zone.id} className="space-y-1 pl-4">
                                <div className="font-medium text-sm text-gray-700">
                                  {zone.name}: <span className="text-gray-500 font-normal">{maxSeats} seat{maxSeats !== 1 ? 's' : ''}</span>
                                </div>
                                {seatValues.map((v, idx) => (
                                  <div key={`${zone.id}_${idx}`} className="text-sm text-gray-600 pl-4">
                                    • Seat {idx + 1}: {v.label}{v.region ? ` (${v.region})` : ''}
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>

                        {notes && (
                          <div className="space-y-2">
                            <div className="font-semibold text-sm text-gray-700">Notes:</div>
                            <div className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</div>
                          </div>
                        )}

                        <div className="flex gap-4 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowPreview(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleConfirmSubmit}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Confirm & Submit'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('vid')
                      setVoterInfo(null)
                      setSelectedTrustees({})
                      setZoneSearchTerms({})
                      setZoneSearchTerms2({})
                      setShowPickerByZone({})
                      setNotes('')
                      setShowPreview(false)
                    }}
                    className="flex-1"
                  >
                    Back to VID Entry
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Preview & Submit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
