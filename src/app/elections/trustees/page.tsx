'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserCheck, ArrowLeft, Vote, Users, Clock, MapPin, Calendar, Shield, CheckCircle, AlertCircle, Award } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface Trustee {
  id: string
  name: string
  nameGujarati?: string
  voterId: string
  phone?: string
  email?: string
  seat: string
  isEligible: boolean
  zone: {
    id: string
    name: string
    nameGujarati: string
    seats: number
  }
}

interface Election {
  id: string
  title: string
  description?: string
  type: string
  startDate: string
  endDate: string
  status: string
  voterMinAge?: number
  voterMaxAge?: number
  candidateMinAge?: number
  candidateMaxAge?: number
}

export default function TrusteesElectionsPage() {
  const [trustees, setTrustees] = useState<Trustee[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchElectionData()
  }, [])

  const fetchElectionData = async () => {
    try {
      // Fetch election information
      const electionResponse = await fetch('/api/elections/trustees')
      if (electionResponse.ok) {
        const electionData = await electionResponse.json()
        setElection(electionData.election)
      }

      // Fetch trustees
      const trusteesResponse = await fetch('/api/trustees')
      if (trusteesResponse.ok) {
        const trusteesData = await trusteesResponse.json()
        setTrustees(trusteesData.trustees || [])
      }
    } catch (error) {
      console.error('Error fetching election data:', error)
      setError('Failed to load election information')
    } finally {
      setIsLoading(false)
    }
  }

  const getElectionStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getZoneStats = () => {
    const stats: Record<string, { total: number; filled: number }> = {}
    
    trustees.forEach(trustee => {
      if (!stats[trustee.zone.id]) {
        stats[trustee.zone.id] = { total: trustee.zone.seats, filled: 0 }
      }
      stats[trustee.zone.id].filled++
    })
    
    return stats
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election information...</p>
        </div>
      </div>
    )
  }

  const zoneStats = getZoneStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <UserCheck className="h-8 w-8" />
                  <h1 className="text-3xl">Trustees Elections</h1>
                </div>
                <p className="text-green-100">Select your regional trustees based on zones and seats</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4 text-green-100">
                {election && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{getElectionStatusBadge(election.status)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Election Overview */}
        {election && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-6 w-6 text-green-600" />
                <span>Election Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Election Details</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Title:</strong> {election.title}</p>
                    <p><strong>Type:</strong> {election.type}</p>
                    <p><strong>Status:</strong> {getElectionStatusBadge(election.status)}</p>
                    <p><strong>Period:</strong> {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Eligibility Requirements</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>• <strong>Voters:</strong> Age {election.voterMinAge || 18}-{election.voterMaxAge || 100} years</p>
                    <p>• <strong>Candidates:</strong> Age {election.candidateMinAge || 21}-{election.candidateMaxAge || 100} years</p>
                    <p>• All registered Samaj members</p>
                    <p>• Active member for 3+ years</p>
                    <p>• Good standing in community</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-green-50 border-2 border-green-300 rounded-lg px-6 py-3 text-center">
            <p className="text-sm font-semibold text-green-700">
              Voting is now open for Anya Gujarat and Kutch zones.
            </p>
          </div>
          <Link href="/candidate/elections/trustees">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View All Trustees
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl">{trustees.length}</p>
                  <p className="text-sm text-gray-600">Total Trustees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl">
                    {Object.keys(zoneStats).length}
                  </p>
                  <p className="text-sm text-gray-600">Active Zones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl">2</p>
                  <p className="text-sm text-gray-600">Year Term</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-6 w-6" />
              <span>Zone Statistics</span>
            </CardTitle>
            <CardDescription>
              Trustee distribution across different zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(zoneStats).map(([zoneId, stats]) => {
                const zone = trustees.find(t => t.zone.id === zoneId)?.zone
                return (
                  <Card key={zoneId}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{zone?.nameGujarati || 'Unknown Zone'}</h3>
                          <p className="text-sm text-gray-600">{zone?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl text-green-600">
                            {stats.filled}/{stats.total}
                          </div>
                          <p className="text-xs text-gray-500">Seats Filled</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Featured Trustees */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Featured Trustees</span>
            </CardTitle>
            <CardDescription>
              Meet some of the community leaders running for trustee positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trustees.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trustees.slice(0, 6).map((trustee) => (
                  <div key={trustee.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{trustee.name}</h3>
                        {trustee.nameGujarati && (
                          <p className="text-sm text-gray-600">{trustee.nameGujarati}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {trustee.zone.nameGujarati}
                          </span>
                          <span className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            {trustee.seat}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{trustee.zone.name}</Badge>
                        <Badge className={trustee.isEligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {trustee.isEligible ? 'Eligible' : 'Not Eligible'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Award className="h-4 w-4" />
                          <span>ID: {trustee.voterId}</span>
                        </div>
                        {trustee.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📞</span>
                            <span>{trustee.phone}</span>
                          </div>
                        )}
                        {trustee.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>✉️</span>
                            <span className="truncate">{trustee.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trustees available</h3>
                <p className="text-gray-500 mb-4">
                  No trustees are currently available for selection.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Election Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-green-600" />
              <span>About Trustees Elections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Election Process</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Zone-wise trustee selection</li>
                  <li>• Multiple seats per zone</li>
                  <li>• Members vote for their regional trustees</li>
                  <li>• Highest vote getters win</li>
                  <li>• 2-year term</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Voting Process</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OTP-based authentication</li>
                  <li>• Zone-based voting system</li>
                  <li>• Secure and confidential voting</li>
                  <li>• Real-time vote counting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
