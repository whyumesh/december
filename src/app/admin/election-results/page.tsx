'use client'

import { useState, useEffect } from 'react'
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
  TrendingUp,
  MapPin,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import Footer from '@/components/Footer'

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
  }
  timestamp: string
}

// Password for election results access - can be changed here
const ELECTION_RESULTS_PASSWORD = 'Maheshwari@11'

// Authorized phone numbers for results declaration
const AUTHORIZED_PHONE_1 = '9448118832'
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
  
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && isAdmin && !authLoading && isPasswordAuthenticated && isOtp1Verified && isOtp2Verified) {
      fetchResults()
    }
  }, [isAuthenticated, isAdmin, authLoading, isPasswordAuthenticated, isOtp1Verified, isOtp2Verified])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    
    if (password === ELECTION_RESULTS_PASSWORD) {
      setIsPasswordAuthenticated(true)
      setPassword('')
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
      
      const data = await response.json()
      
      if (response.ok) {
        setOtp1Error('')
      } else {
        setOtp1Error(data.error || 'Failed to send OTP')
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
      
      const data = await response.json()
      
      if (response.ok) {
        setIsOtp1Verified(true)
        setOtp1('')
        setOtp1Error('')
        // Automatically send OTP to phone 2
        sendOtp2()
      } else {
        setOtp1Error(data.error || 'Invalid OTP')
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
      
      const data = await response.json()
      
      if (response.ok) {
        setOtp2Error('')
      } else {
        setOtp2Error(data.error || 'Failed to send OTP')
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
      
      const data = await response.json()
      
      if (response.ok) {
        setIsOtp2Verified(true)
        setOtp2('')
        setOtp2Error('')
      } else {
        setOtp2Error(data.error || 'Invalid OTP')
        setOtp2('')
      }
    } catch (error) {
      setOtp2Error('Failed to verify OTP. Please try again.')
      setOtp2('')
    } finally {
      setIsVerifyingOtp2(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  SKMMMS Election 2026
                </h1>
                <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
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
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Election Results</h2>
          <p className="text-gray-600">Live results by zone for all elections</p>
          {results && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(results.timestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Yuva Pankh Results */}
            <Card>
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
                    {results.yuvaPankh.zones.map((zoneResult) => (
                      <div key={zoneResult.zoneId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{zoneResult.zone?.name || 'Unknown Zone'}</h4>
                            <p className="text-gray-600">{zoneResult.zone?.nameGujarati || 'Unknown Zone (Gujarati)'}</p>
                            <p className="text-sm text-gray-500">Zone {zoneResult.zone?.code || 'N/A'} • {zoneResult.zone?.seats || 0} seats</p>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            {zoneResult.candidates.length} candidates
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {zoneResult.candidates.map((candidate, index) => (
                            <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                  index === 1 ? 'bg-gray-100 text-gray-800' : 
                                  index === 2 ? 'bg-orange-100 text-orange-800' : 
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium">{candidate.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Trophy className="h-4 w-4 text-yellow-600" />
                                <span className="font-bold text-lg">{candidate.votes}</span>
                                <span className="text-sm text-gray-500">votes</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getElectionIcon('trustee')}
                  <span>{results.trustee.name}</span>
                </CardTitle>
                <CardDescription>
                  Trustee election results by zone
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.trustee.zones.length > 0 ? (
                  <div className="space-y-6">
                    {results.trustee.zones.map((zoneResult) => (
                      <div key={zoneResult.zoneId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{zoneResult.zone?.name || 'Unknown Zone'}</h4>
                            <p className="text-gray-600">{zoneResult.zone?.nameGujarati || 'Unknown Zone (Gujarati)'}</p>
                            <p className="text-sm text-gray-500">Zone {zoneResult.zone?.code || 'N/A'} • {zoneResult.zone?.seats || 0} seats</p>
                          </div>
                          <Badge variant="outline" className="text-purple-600">
                            {zoneResult.candidates.length} candidates
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {zoneResult.candidates.map((candidate, index) => (
                            <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                  index === 1 ? 'bg-gray-100 text-gray-800' : 
                                  index === 2 ? 'bg-orange-100 text-orange-800' : 
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium">{candidate.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Trophy className="h-4 w-4 text-yellow-600" />
                                <span className="font-bold text-lg">{candidate.votes}</span>
                                <span className="text-sm text-gray-500">votes</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Vote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No votes recorded for Trustee election</p>
                  </div>
                )}
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
