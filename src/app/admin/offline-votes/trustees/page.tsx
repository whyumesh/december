'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, ArrowLeft, Loader2, User, MapPin, Users, Search } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'

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

export default function OfflineVoteEntryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()
  
  const [step, setStep] = useState<'vid' | 'form'>('vid')
  const [vid, setVid] = useState('')
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedTrustees, setSelectedTrustees] = useState<Record<string, string[]>>({})
  const [zoneSearchTerms, setZoneSearchTerms] = useState<Record<string, string>>({})
  const [showPickerByZone, setShowPickerByZone] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/offline-votes/trustees/login')
    }
  }, [isAuthenticated, authLoading, router])

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

      setZones(Object.values(zoneMap).sort((a, b) => a.name.localeCompare(b.name)))
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

  const handleTrusteeSelect = (zoneId: string, trusteeId: string, zoneSeats: number) => {
    const maxSeats = Math.max(1, Number(zoneSeats) || 1)
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
    setShowPickerByZone(prev => ({ ...prev, [zoneId]: false }))
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
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setStep('vid')
        setVid('')
        setVoterInfo(null)
        setSelectedTrustees({})
        setZoneSearchTerms({})
        setShowPickerByZone({})
        setNotes('')
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit offline vote')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/90 to-emerald-50/90 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
              </div>
            )}

            {step === 'form' && voterInfo && (
              <div className="space-y-6">
                {/* Voter Info Display - name, region, trustee zone only */}
                <Card className="bg-emerald-50/80 border-emerald-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-900">
                      <User className="h-4 w-4" />
                      Voter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <div className="font-medium text-emerald-900">{voterInfo.name}</div>
                    <div className="text-emerald-800">{voterInfo.region}</div>
                    {voterInfo.trusteeZone && (
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <MapPin className="h-3.5 w-3 shrink-0" />
                        {voterInfo.trusteeZone.name}
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                          const zoneSearch = (zoneSearchTerms[zone.id] || '').trim()
                          const filtered = zoneSearch
                            ? zone.trustees.filter((t) => trusteeMatchesSearch(t, zoneSearch))
                            : []
                          const selected = selectedTrustees[zone.id] || []
                          const maxSeats = Math.max(1, zone.seats)
                          const showPicker = selected.length === 0 || showPickerByZone[zone.id]
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
                                {showPicker ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Search className="h-4 w-4 text-teal-600" />
                                      <Input
                                        value={zoneSearchTerms[zone.id] || ''}
                                        onChange={(e) => setZoneSearchTerms((prev) => ({ ...prev, [zone.id]: e.target.value }))}
                                        placeholder={`Search trustees in ${zone.name} (name or initials)`}
                                        className="flex-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500/20"
                                      />
                                    </div>
                                    {!zoneSearch ? (
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
                                          <p className="text-sm text-teal-600 col-span-full">No trustees match &quot;{zoneSearch}&quot;.</p>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="space-y-2">
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
                                    {selected.length < maxSeats && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-teal-300 text-teal-700 hover:bg-teal-50"
                                        onClick={() => setShowPickerByZone((prev) => ({ ...prev, [zone.id]: true }))}
                                      >
                                        + Add another trustee
                                      </Button>
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

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('vid')
                      setVoterInfo(null)
                      setSelectedTrustees({})
                        setZoneSearchTerms({})
                        setShowPickerByZone({})
                      setNotes('')
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
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Offline Vote'
                    )}
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
