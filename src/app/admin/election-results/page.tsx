'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Vote, 
  Users, 
  Building, 
  Award, 
  LogOut, 
  BarChart3, 
  RefreshCw, 
  AlertCircle,
  Trophy,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import Footer from '@/components/Footer'
import { getTrusteeZoneSortKey } from '@/lib/trustee-zone-order'

interface CandidateResult {
  id: string
  name: string
  votes: number
}

interface ZoneResult {
  zoneId: string
  zone: {
    id: string
    name: string
    nameGujarati: string
    code: string
    seats: number
  }
  candidates: CandidateResult[]
}

interface CandidateResult {
  id: string
  name: string
  votes: number
  onlineVotes?: number
  offlineVotes?: number
}

interface ElectionResults {
  yuvaPankh: {
    name: string
    zones: ZoneResult[]
  }
  karobari: {
    name: string
    zones: ZoneResult[]
  }
  trustee: {
    name: string
    zones: ZoneResult[]
    zonesOffline?: ZoneResult[]
    zonesMerged?: ZoneResult[]
  }
  timestamp: string
}

// Password for election results access - can be changed here
const ELECTION_RESULTS_PASSWORD = 'Maheshwari@11'

// Authorized phone numbers for results declaration
const AUTHORIZED_PHONE_1 = '9821520010'
const AUTHORIZED_PHONE_2 = '9930021208'

export default function ElectionResults() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth()
  const [results, setResults] = useState<ElectionResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  
  // OTP states for phone 1
  const [otp1, setOtp1] = useState('')
  const [otp1Error, setOtp1Error] = useState('')
  const [isOtp1Verified, setIsOtp1Verified] = useState(false)
  const [isSendingOtp1, setIsSendingOtp1] = useState(false)
  const [isVerifyingOtp1, setIsVerifyingOtp1] = useState(false)
  
  // OTP states for phone 2
  const [otp2, setOtp2] = useState('')
  const [otp2Error, setOtp2Error] = useState('')
  const [isOtp2Verified, setIsOtp2Verified] = useState(false)
  const [isSendingOtp2, setIsSendingOtp2] = useState(false)
  const [isVerifyingOtp2, setIsVerifyingOtp2] = useState(false)
  const [trusteeViewMode, setTrusteeViewMode] = useState<'online' | 'offline' | 'merged'>('merged')
  const [revealStage, setRevealStage] = useState<'locked' | 'animating' | 'ready'>('locked')
  const [revealedWinners, setRevealedWinners] = useState<Record<string, boolean>>({})
  const [showLandingAnimation, setShowLandingAnimation] = useState(false)
  const [curtainsOpen, setCurtainsOpen] = useState(false)
  const [partyVisible, setPartyVisible] = useState(false)
  const [isDeclaring, setIsDeclaring] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [declareError, setDeclareError] = useState<string | null>(null)
  const [declarationStatus, setDeclarationStatus] = useState<{ declared: boolean; declaredAt?: string | null } | null>(null)
  const [declarationToken, setDeclarationToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isCopyingWinners, setIsCopyingWinners] = useState(false)
  const [isDownloadingWinners, setIsDownloadingWinners] = useState(false)
  const landingShownRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && isAdmin && !authLoading && isPasswordAuthenticated && isOtp1Verified && isOtp2Verified) {
      fetchResults()
    }
  }, [isAuthenticated, isAdmin, authLoading, isPasswordAuthenticated, isOtp1Verified, isOtp2Verified])

  const fetchDeclarationStatus = async () => {
    try {
      const res = await fetch('/api/admin/declare-results', { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      setDeclarationStatus({
        declared: !!data.declared,
        declaredAt: data.declaredAt ?? null
      })
    } catch {
      setDeclarationStatus(null)
    }
  }

  useEffect(() => {
    if (results && isPasswordAuthenticated) fetchDeclarationStatus()
  }, [results, isPasswordAuthenticated])

  // After password + both OTPs + results loaded: get declaration token (authority to declare on landing)
  useEffect(() => {
    if (!results || !password || !isOtp1Verified || !isOtp2Verified) return
    let cancelled = false
    setTokenError(null)
    fetch('/api/admin/results-declaration-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ resultsPassword: password })
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return
        if (ok && data.token) {
          setDeclarationToken(data.token)
          setPassword('')
        } else {
          setTokenError(data.error || 'Could not get declaration authority.')
        }
      })
      .catch(() => {
        if (!cancelled) setTokenError('Could not get declaration authority.')
      })
    return () => { cancelled = true }
  }, [results, password, isOtp1Verified, isOtp2Verified])

  // When results first load, show curtain + party popper landing animation once
  useEffect(() => {
    if (!results || landingShownRef.current) return
    landingShownRef.current = true
    setShowLandingAnimation(true)
    setCurtainsOpen(false)
    setPartyVisible(false)
    const t1 = setTimeout(() => setCurtainsOpen(true), 80)
    const t2 = setTimeout(() => setPartyVisible(true), 600)
    const t3 = setTimeout(() => {
      setShowLandingAnimation(false)
      setCurtainsOpen(false)
      setPartyVisible(false)
    }, 3200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [results])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    
    if (password === ELECTION_RESULTS_PASSWORD) {
      setIsPasswordAuthenticated(true)
      // Keep password in state until we have declaration token (after both OTPs)
      // Automatically send OTP to phone 1
      await sendOtp1()
    } else {
      setPasswordError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  const fetchResults = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch('/api/admin/election-results', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error fetching election results:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch election results')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    router.push('/admin/login')
  }

  // Parse API response safely (avoid JSON parse error on HTML/plain text)
  const parseResultError = async (response: Response): Promise<{ error?: string; message?: string }> => {
    const ct = response.headers.get('Content-Type') || ''
    if (!ct.includes('application/json')) {
      const text = await response.text()
      return { error: text || `Request failed (${response.status})` }
    }
    try {
      return await response.json()
    } catch {
      return { error: 'Invalid response from server' }
    }
  }

  // Send OTP to phone 1
  const sendOtp1 = async () => {
    setIsSendingOtp1(true)
    setOtp1Error('')
    
    try {
      const response = await fetch('/api/admin/send-results-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: AUTHORIZED_PHONE_1 })
      })
      
      const data = await parseResultError(response)
      
      if (response.ok) {
        setOtp1Error('')
      } else {
        setOtp1Error(data.error || data.message || 'Failed to send OTP')
      }
    } catch (error) {
      setOtp1Error('Failed to send OTP. Please try again.')
    } finally {
      setIsSendingOtp1(false)
    }
  }

  // Verify OTP for phone 1
  const verifyOtp1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifyingOtp1(true)
    setOtp1Error('')
    
    if (otp1.length !== 6) {
      setOtp1Error('Please enter a 6-digit OTP')
      setIsVerifyingOtp1(false)
      return
    }
    
    try {
      const response = await fetch('/api/admin/verify-results-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: AUTHORIZED_PHONE_1, otp: otp1 })
      })
      
      const data = await parseResultError(response)
      
      if (response.ok) {
        setIsOtp1Verified(true)
        setOtp1('')
        setOtp1Error('')
        // Automatically send OTP to phone 2
        sendOtp2()
      } else {
        setOtp1Error(data.error || data.message || 'Invalid OTP')
        setOtp1('')
      }
    } catch (error) {
      setOtp1Error('Failed to verify OTP. Please try again.')
      setOtp1('')
    } finally {
      setIsVerifyingOtp1(false)
    }
  }

  // Send OTP to phone 2
  const sendOtp2 = async () => {
    setIsSendingOtp2(true)
    setOtp2Error('')
    
    try {
      const response = await fetch('/api/admin/send-results-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: AUTHORIZED_PHONE_2 })
      })
      
      const data = await parseResultError(response)
      
      if (response.ok) {
        setOtp2Error('')
      } else {
        setOtp2Error(data.error || data.message || 'Failed to send OTP')
      }
    } catch (error) {
      setOtp2Error('Failed to send OTP. Please try again.')
    } finally {
      setIsSendingOtp2(false)
    }
  }

  // Verify OTP for phone 2
  const verifyOtp2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifyingOtp2(true)
    setOtp2Error('')
    
    if (otp2.length !== 6) {
      setOtp2Error('Please enter a 6-digit OTP')
      setIsVerifyingOtp2(false)
      return
    }
    
    try {
      const response = await fetch('/api/admin/verify-results-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: AUTHORIZED_PHONE_2, otp: otp2 })
      })
      
      const data = await parseResultError(response)
      
      if (response.ok) {
        setIsOtp2Verified(true)
        setOtp2('')
        setOtp2Error('')
      } else {
        setOtp2Error(data.error || data.message || 'Invalid OTP')
        setOtp2('')
      }
    } catch (error) {
      setOtp2Error('Failed to verify OTP. Please try again.')
      setOtp2('')
    } finally {
      setIsVerifyingOtp2(false)
    }
  }

  const formatWinnersAsText = (data: { yuvaPankh: Array<{ name: string; zoneName: string; zoneCode: string; rank: number; votes: number; election: string }>; trustee: Array<{ name: string; zoneName: string; zoneCode: string; rank: number; votes: number; election: string }> }) => {
    const lines: string[] = ['ALL WINNERS - SKMMMS Election 2026', '='.repeat(50), '']
    if (data.yuvaPankh.length > 0) {
      lines.push('--- Yuva Pankh Samiti ---')
      data.yuvaPankh.forEach(w => {
        lines.push(`${w.zoneName} (${w.zoneCode}) | Rank ${w.rank} | ${w.name} | ${w.votes} votes`)
      })
      lines.push('')
    }
    if (data.trustee.length > 0) {
      lines.push('--- Trust Mandal ---')
      data.trustee.forEach(w => {
        lines.push(`${w.zoneName} (${w.zoneCode}) | Rank ${w.rank} | ${w.name} | ${w.votes} votes`)
      })
    }
    return lines.join('\n')
  }

  const handleCopyWinnersList = async () => {
    setIsCopyingWinners(true)
    try {
      const res = await fetch('/api/admin/winners-list')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load winners')
      const text = formatWinnersAsText(data)
      await navigator.clipboard.writeText(text)
      alert('Winners list copied to clipboard.')
    } catch (e) {
      alert('Failed to copy winners list: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setIsCopyingWinners(false)
    }
  }

  const handleDownloadWinnersTxt = async () => {
    setIsDownloadingWinners(true)
    try {
      const res = await fetch('/api/admin/winners-list')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load winners')
      const text = formatWinnersAsText(data)
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `winners-list-${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Failed to download winners list: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setIsDownloadingWinners(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600 mb-4">You need admin privileges to access this page.</p>
            <Link href="/admin/login">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show password prompt if not authenticated with password
  if (isAuthenticated && isAdmin && !authLoading && !isPasswordAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Election Results Access</CardTitle>
              <CardDescription>
                Step 1 of 3: Enter the password to view election results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {passwordError}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show OTP 1 verification if password is authenticated but OTP 1 is not verified
  if (isAuthenticated && isAdmin && !authLoading && isPasswordAuthenticated && !isOtp1Verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">OTP Verification - Phone 1</CardTitle>
              <CardDescription>
                Step 2 of 3: Enter OTP sent to {AUTHORIZED_PHONE_1.slice(0, 2)}****{AUTHORIZED_PHONE_1.slice(-2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={verifyOtp1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp1">OTP Code</Label>
                  <Input
                    id="otp1"
                    type="text"
                    value={otp1}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '')
                      setOtp1(digitsOnly.slice(0, 6))
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    required
                  />
                  {otp1Error && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {otp1Error}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendOtp1}
                    disabled={isSendingOtp1}
                    className="flex-1"
                  >
                    {isSendingOtp1 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend OTP
                      </>
                    )}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isVerifyingOtp1 || otp1.length !== 6}>
                    {isVerifyingOtp1 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </form>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPasswordAuthenticated(false)
                    setOtp1('')
                    setOtp1Error('')
                  }}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show OTP 2 verification if OTP 1 is verified but OTP 2 is not verified
  if (isAuthenticated && isAdmin && !authLoading && isPasswordAuthenticated && isOtp1Verified && !isOtp2Verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">OTP Verification - Phone 2</CardTitle>
              <CardDescription>
                Step 3 of 3: Enter OTP sent to {AUTHORIZED_PHONE_2.slice(0, 2)}****{AUTHORIZED_PHONE_2.slice(-2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={verifyOtp2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp2">OTP Code</Label>
                  <Input
                    id="otp2"
                    type="text"
                    value={otp2}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '')
                      setOtp2(digitsOnly.slice(0, 6))
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    required
                  />
                  {otp2Error && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {otp2Error}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendOtp2}
                    disabled={isSendingOtp2}
                    className="flex-1"
                  >
                    {isSendingOtp2 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend OTP
                      </>
                    )}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isVerifyingOtp2 || otp2.length !== 6}>
                    {isVerifyingOtp2 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Verify & Access Results
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election results...</p>
        </div>
      </div>
    )
  }

  const getElectionIcon = (electionType: string) => {
    switch (electionType) {
      case 'yuvaPankh':
        return <Users className="h-6 w-6 text-green-600" />
      case 'karobari':
        return <Building className="h-6 w-6 text-blue-600" />
      case 'trustee':
        return <Award className="h-6 w-6 text-purple-600" />
      default:
        return <Vote className="h-6 w-6 text-gray-600" />
    }
  }

  const getElectionColor = (electionType: string) => {
    switch (electionType) {
      case 'yuvaPankh':
        return 'green'
      case 'karobari':
        return 'blue'
      case 'trustee':
        return 'purple'
      default:
        return 'gray'
    }
  }

  const startReveal = () => {
    setRevealStage('animating')
    setRevealedWinners({})
    window.setTimeout(() => {
      setRevealStage('ready')
    }, 1200)
  }

  const resetReveal = () => {
    setRevealStage('locked')
    setRevealedWinners({})
  }

  const winnerKey = (electionKey: string, viewKey: string, zoneId: string, rank: number) =>
    `${electionKey}:${viewKey}:${zoneId}:${rank}`

  const revealWinner = (key: string) => {
    setRevealedWinners((prev) => ({ ...prev, [key]: true }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Landing animation: curtains open + party poppers */}
      {showLandingAnimation && results && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
          <div
            className={`results-curtain results-curtain-left ${curtainsOpen ? 'results-curtain-open' : ''}`}
            aria-hidden
          />
          <div
            className={`results-curtain results-curtain-right ${curtainsOpen ? 'results-curtain-open' : ''}`}
            aria-hidden
          />
          <div className={`results-landing-center ${partyVisible ? 'results-landing-visible' : ''}`}>
            <div className="flex flex-col items-center gap-4">
              <span className="text-6xl sm:text-7xl" aria-hidden>🎉</span>
              <span className="text-5xl sm:text-6xl" aria-hidden>🎊</span>
              <p className="text-white text-xl sm:text-2xl font-bold drop-shadow-lg mt-2">
                Election Results
              </p>
              <p className="text-purple-200 text-sm sm:text-base">SKMMMS Election 2026</p>
            </div>
            {/* Simple confetti dots */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="results-confetti-dot"
                style={{
                  left: `${15 + i * 12}%`,
                  top: '40%',
                  background: ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#a78bfa', '#f97316'][i % 6],
                  animationDelay: `${0.1 * i}s`,
                }}
                aria-hidden
              />
            ))}
          </div>
        </div>
      )}
      {revealStage === 'animating' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center animate-pulse">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Revealing Results</h3>
              <p className="mt-2 text-sm text-slate-600">
                Please wait a moment…
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Preparing winner cards</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-2xl text-gray-900">
                  SKMMMS Election 2026
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => fetchResults(true)}
                disabled={isRefreshing}
                className="w-full sm:w-auto text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {results && (
                <>
                  {revealStage === 'locked' ? (
                    <Button
                      onClick={startReveal}
                      className="w-full sm:w-auto text-sm bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Start Result Reveal
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={resetReveal}
                      className="w-full sm:w-auto text-sm"
                      disabled={revealStage === 'animating'}
                    >
                      Reset Reveal
                    </Button>
                  )}
                  {tokenError && (
                    <p className="text-sm text-amber-700 w-full sm:w-auto">{tokenError}</p>
                  )}
                  <Button
                    variant="outline"
                    disabled={isDeclaring || declarationStatus?.declared === true || !declarationToken}
                    className="w-full sm:w-auto text-sm border-amber-300 text-amber-800 hover:bg-amber-50"
                    onClick={async () => {
                      if (!declarationToken) return
                      setDeclareError(null)
                      setIsDeclaring(true)
                      try {
                        const res = await fetch('/api/admin/declare-results', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${declarationToken}`
                          },
                          credentials: 'include',
                          body: JSON.stringify({ action: 'declare' })
                        })
                        const json = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          setDeclareError(json.error || json.details || 'Failed to declare results')
                          return
                        }
                        await fetchDeclarationStatus()
                        window.open('/', '_blank', 'noopener,noreferrer')
                      } catch (e) {
                        setDeclareError('Failed to declare results')
                      } finally {
                        setIsDeclaring(false)
                      }
                    }}
                  >
                    <ExternalLink className={`h-4 w-4 mr-2 ${isDeclaring ? 'animate-pulse' : ''}`} />
                    {isDeclaring ? 'Declaring…' : declarationStatus?.declared ? 'Declared on landing' : 'Result Declaration on Landing Page'}
                  </Button>
                  {declarationStatus?.declared === true && (
                    <Button
                      variant="outline"
                      disabled={isRevoking || !declarationToken}
                      className="w-full sm:w-auto text-sm border-red-200 text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (!declarationToken) return
                        setDeclareError(null)
                        setIsRevoking(true)
                        try {
                          const res = await fetch('/api/admin/declare-results', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${declarationToken}`
                            },
                            credentials: 'include',
                            body: JSON.stringify({ action: 'revoke' })
                          })
                          const json = await res.json().catch(() => ({}))
                          if (!res.ok) {
                            setDeclareError(json.error || 'Failed to revoke declaration')
                            return
                          }
                          await fetchDeclarationStatus()
                        } catch (e) {
                          setDeclareError('Failed to revoke declaration')
                        } finally {
                          setIsRevoking(false)
                        }
                      }}
                    >
                      {isRevoking ? 'Revoking…' : 'Take back from landing / Revoke declaration'}
                    </Button>
                  )}
                  {declareError && (
                    <p className="text-sm text-red-600 w-full sm:w-auto">{declareError}</p>
                  )}
                </>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full sm:w-auto text-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchResults(true)}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Election Results</h2>
              <p className="text-gray-600 mt-1">Live results by zone for all elections</p>
              {results && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Last updated: {new Date(results.timestamp).toLocaleString()}
                </p>
              )}
            </div>
            {results && (results.yuvaPankh.zones.length > 0 || (results.trustee.zones?.length ?? 0) > 0) && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWinnersList}
                  disabled={isCopyingWinners}
                  className="gap-2"
                >
                  {isCopyingWinners ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  {isCopyingWinners ? 'Copying…' : 'Copy winners list'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadWinnersTxt}
                  disabled={isDownloadingWinners}
                  className="gap-2"
                >
                  {isDownloadingWinners ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isDownloadingWinners ? 'Downloading…' : 'Download as TXT'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Yuva Pankh Results */}
            <Card className="overflow-hidden border-2 border-green-100 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getElectionIcon('yuvaPankh')}
                  <span>{results.yuvaPankh.name}</span>
                </CardTitle>
                <CardDescription>
                  Youth leadership election results by zone
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.yuvaPankh.zones.length > 0 ? (
                  <div className="space-y-6">
                    {results.yuvaPankh.zones.map((zoneResult) => {
                      const seats = Math.max(0, zoneResult.zone?.seats || 0)
                      const winners = zoneResult.candidates.slice(0, seats)
                      const others = zoneResult.candidates.slice(seats)
                      return (
                        <div key={zoneResult.zoneId} className="border rounded-lg p-4 border-green-100 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{zoneResult.zone?.name || 'Unknown Zone'}</h4>
                              <p className="text-gray-600">{zoneResult.zone?.nameGujarati || 'Unknown Zone (Gujarati)'}</p>
                              <p className="text-sm text-gray-500">Zone {zoneResult.zone?.code || 'N/A'} • {seats} seat{seats !== 1 ? 's' : ''}</p>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              {zoneResult.candidates.length} candidates
                            </Badge>
                          </div>
                          {/* Winners - visible */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Winners</p>
                            {winners.map((candidate, index) => {
                              const rank = index + 1
                              const key = winnerKey('yuvaPankh', 'final', zoneResult.zoneId, rank)
                              const isRevealed = !!revealedWinners[key]
                              const canReveal = revealStage === 'ready' && !isRevealed
                              const showName = revealStage !== 'locked' && isRevealed
                              const displayName = showName ? candidate.name : (revealStage === 'locked' ? 'Hidden' : 'Click to reveal')
                              return (
                                <button
                                  type="button"
                                  key={candidate.id}
                                  onClick={() => (canReveal ? revealWinner(key) : undefined)}
                                  disabled={!canReveal}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all bg-gradient-to-r from-amber-50 to-white border border-amber-200 hover:shadow-sm ${canReveal ? 'cursor-pointer hover:ring-2 hover:ring-green-200' : 'cursor-default'}`}
                                  aria-label={`Rank ${rank} winner`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                      index === 1 ? 'bg-gray-100 text-gray-800' :
                                      index === 2 ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <span className={`font-medium ${showName ? 'text-slate-900 results-reveal-name' : 'text-slate-500'}`}>
                                      {displayName}
                                    </span>
                                  </div>
                                  <div className={`flex items-center space-x-2 ${showName ? 'results-reveal-name' : ''}`}>
                                    <Trophy className="h-4 w-4 text-yellow-600" />
                                    {showName ? (
                                      <>
                                        <span className="font-bold text-lg">{candidate.votes}</span>
                                        <span className="text-sm text-gray-500">votes</span>
                                      </>
                                    ) : (
                                      <span className="text-slate-400 font-medium">{revealStage === 'locked' ? '—' : 'Click to reveal'}</span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          {/* Other candidates in dropdown */}
                          {others.length > 0 && (
                            <details className="mt-4 group">
                              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 py-3 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700">
                                <span className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                  Other candidates ({others.length})
                                </span>
                                <ChevronUp className="h-4 w-4 opacity-0 group-open:opacity-100 transition-opacity" />
                              </summary>
                              <div className="pt-3 pl-2 space-y-2 border-l-2 border-slate-200 ml-3">
                                {others.map((candidate, index) => (
                                  <div
                                    key={candidate.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50/80"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-medium">
                                        {seats + index + 1}
                                      </span>
                                      <span className="font-medium text-slate-800">{candidate.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-semibold text-slate-700">{candidate.votes}</span>
                                      <span className="text-slate-500">votes</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Vote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No votes recorded for Yuva Pankh election</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Karobari Results - Hidden from UI */}

            {/* Trustee Results */}
            <Card className="overflow-hidden border-2 border-purple-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="flex items-center space-x-2">
                  {getElectionIcon('trustee')}
                  <span>{results.trustee.name}</span>
                </CardTitle>
                <CardDescription>
                  Trustee election results by zone. Winners are shown first; other candidates are in the dropdown per zone.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* View Mode Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-200">
                  <Button
                    variant={trusteeViewMode === 'online' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrusteeViewMode('online')}
                    className={trusteeViewMode === 'online' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    Online Votes
                  </Button>
                  <Button
                    variant={trusteeViewMode === 'offline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrusteeViewMode('offline')}
                    className={trusteeViewMode === 'offline' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    Offline Votes
                  </Button>
                  <Button
                    variant={trusteeViewMode === 'merged' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrusteeViewMode('merged')}
                    className={trusteeViewMode === 'merged' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    Merged Votes
                  </Button>
                  <Badge variant="secondary" className="ml-2">
                    {trusteeViewMode === 'merged' ? 'Merged' : trusteeViewMode === 'online' ? 'Online' : 'Offline'} view
                  </Badge>
                </div>

                {(() => {
                  let zonesToShow: ZoneResult[] = []
                  let viewLabel = ''

                  switch (trusteeViewMode) {
                    case 'online':
                      zonesToShow = results.trustee.zones || []
                      viewLabel = 'Online'
                      break
                    case 'offline':
                      zonesToShow = results.trustee.zonesOffline || []
                      viewLabel = 'Offline'
                      break
                    case 'merged':
                      zonesToShow = results.trustee.zonesMerged || results.trustee.zones || []
                      viewLabel = 'Merged'
                      break
                  }

                  const sortedZones = [...zonesToShow].sort(
                    (a, b) => getTrusteeZoneSortKey(a.zone ?? {}) - getTrusteeZoneSortKey(b.zone ?? {})
                  )
                  return sortedZones.length > 0 ? (
                    <div className="space-y-6">
                      {sortedZones.map((zoneResult) => {
                        const seats = Math.max(0, zoneResult.zone?.seats || 0)
                        const winners = zoneResult.candidates.slice(0, seats)
                        const others = zoneResult.candidates.slice(seats)
                        return (
                          <div key={zoneResult.zoneId} className="rounded-xl border-2 border-purple-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                              <div>
                                <h4 className="font-bold text-lg text-slate-900">{zoneResult.zone?.name || 'Unknown Zone'}</h4>
                                <p className="text-slate-600 text-sm">{zoneResult.zone?.nameGujarati || ''}</p>
                                <p className="text-xs text-slate-500 mt-1">Zone {zoneResult.zone?.code || 'N/A'} • {seats} seat{seats !== 1 ? 's' : ''}</p>
                              </div>
                              <Badge variant="outline" className="text-purple-700 border-purple-200">
                                {zoneResult.candidates.length} candidates
                              </Badge>
                            </div>
                            {/* Winners only - always visible */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Winners</p>
                              {winners.map((candidate, index) => {
                                const rank = index + 1
                                const key = winnerKey('trustee', trusteeViewMode, zoneResult.zoneId, rank)
                                const isRevealed = !!revealedWinners[key]
                                const canReveal = revealStage === 'ready' && !isRevealed
                                const showName = revealStage !== 'locked' && isRevealed
                                const displayName = showName ? candidate.name : (revealStage === 'locked' ? 'Hidden' : 'Click to reveal')
                                return (
                                  <button
                                    type="button"
                                    key={candidate.id}
                                    onClick={() => (canReveal ? revealWinner(key) : undefined)}
                                    disabled={!canReveal}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all bg-gradient-to-r from-purple-50 to-white border border-purple-200 hover:shadow-sm ${canReveal ? 'cursor-pointer hover:ring-2 hover:ring-purple-200' : 'cursor-default'}`}
                                    aria-label={`Rank ${rank} winner`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                                        index === 0 ? 'bg-amber-100 text-amber-800' :
                                        index === 1 ? 'bg-slate-200 text-slate-800' :
                                        'bg-orange-100 text-orange-800'
                                      }`}>
                                        {index + 1}
                                      </div>
                                      <span className={`font-semibold ${showName ? 'text-slate-900 results-reveal-name' : 'text-slate-500'}`}>
                                        {displayName}
                                      </span>
                                    </div>
                                    <div className={`flex items-center gap-2 ${showName ? 'results-reveal-name' : ''}`}>
                                      <Trophy className="h-4 w-4 text-amber-500" />
                                      {showName ? (
                                        <>
                                          <span className="font-bold text-lg">{candidate.votes}</span>
                                          <span className="text-sm text-slate-500">votes</span>
                                          {trusteeViewMode === 'merged' && (candidate.onlineVotes !== undefined || candidate.offlineVotes !== undefined) && (
                                            <span className="text-xs text-slate-400 hidden sm:inline">
                                              ({candidate.onlineVotes || 0} on, {candidate.offlineVotes || 0} off)
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-slate-400 font-medium">{revealStage === 'locked' ? '—' : 'Click to reveal'}</span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            {/* Other candidates in collapsible */}
                            {others.length > 0 && (
                              <details className="mt-4 group">
                                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 py-3 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700">
                                  <span className="flex items-center gap-2">
                                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                    Other candidates ({others.length})
                                  </span>
                                  <ChevronUp className="h-4 w-4 opacity-0 group-open:opacity-100 transition-opacity" />
                                </summary>
                                <div className="pt-3 pl-2 space-y-2 border-l-2 border-slate-200 ml-3">
                                  {others.map((candidate, index) => (
                                    <div
                                      key={candidate.id}
                                      className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50/80"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-medium">
                                          {seats + index + 1}
                                        </span>
                                        <span className="font-medium text-slate-800">{candidate.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-slate-700">{candidate.votes}</span>
                                        <span className="text-slate-500">votes</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-xl bg-slate-50 border border-slate-200">
                      <Vote className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="text-slate-600">No {viewLabel.toLowerCase()} votes recorded for Trustee election</p>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Link href="/admin/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              <BarChart3 className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
