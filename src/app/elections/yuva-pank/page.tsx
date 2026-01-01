'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, ArrowLeft, Vote, Users, Clock, MapPin, Calendar, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  party?: string
  position?: string
  region?: string
  manifesto?: string
  experience?: string
  education?: string
  status: string
  photoUrl?: string
  zone?: {
    id: string
    name: string
    nameGujarati: string
    code: string
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

export default function YuvaPankElectionsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchElectionData()
  }, [])

  const fetchElectionData = async () => {
    try {
      // Fetch election information
      const electionResponse = await fetch('/api/elections/yuva-pank')
      if (electionResponse.ok) {
        const electionData = await electionResponse.json()
        setElection(electionData.election)
      }

      // Fetch candidates
      const candidatesResponse = await fetch('/api/elections/yuva-pank/candidates')
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json()
        setCandidates(candidatesData.candidates || [])
      }
    } catch (error) {
      console.error('Error fetching election data:', error)
      setError('Failed to load election information')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg">
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
                  <Crown className="h-8 w-8" />
                  <h1 className="text-3xl">Yuva Pankh Elections</h1>
                </div>
                <p className="text-yellow-100">Youth leadership positions for the future of our community</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4 text-yellow-100">
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
                <Crown className="h-6 w-6 text-yellow-600" />
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
                    <p>• <strong>Candidates:</strong> Age {election.candidateMinAge || 18}-{election.candidateMaxAge || 35} years</p>
                    <p>• Active member of KMS Samaj</p>
                    <p>• No criminal record</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/candidate/register?election=yuva-pank">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Register as Candidate
            </Button>
          </Link>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg px-6 py-3 text-center">
            <p className="text-sm font-semibold text-red-700">
              The online voting process is closed now.
            </p>
          </div>
          <Link href="/candidate/elections/yuva-pank">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View All Candidates
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
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl">{candidates.length}</p>
                  <p className="text-sm text-gray-600">Total Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl">
                    {candidates.filter(c => c.status === 'APPROVED').length}
                  </p>
                  <p className="text-sm text-gray-600">Approved Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl">4</p>
                  <p className="text-sm text-gray-600">Positions Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Candidates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Featured Candidates</span>
            </CardTitle>
            <CardDescription>
              Meet some of the young leaders running for Yuva Pankh positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {candidates.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.slice(0, 6).map((candidate) => (
                  <div key={candidate.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {candidate.region || candidate.zone?.name || 'N/A'}
                          </span>
                          {candidate.party && <span>{candidate.party}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(candidate.status)}
                        {candidate.position && (
                          <Badge variant="outline">{candidate.position}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Only show if there's actual meaningful content beyond system-generated data */}
                      {candidate.manifesto && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Manifesto</h4>
                          <p className="text-sm text-gray-600 line-clamp-3">{candidate.manifesto}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Crown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
                <p className="text-gray-500 mb-4">
                  Be the first to register for Yuva Pankh elections!
                </p>
                <Link href="/candidate/register?election=yuva-pank">
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Register Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Election Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-yellow-600" />
              <span>About Yuva Pankh Elections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Positions Available</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Youth President (1 per region)</li>
                  <li>• Youth Vice President (1 per region)</li>
                  <li>• Youth Secretary (1 per region)</li>
                  <li>• Youth Treasurer (1 per region)</li>
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
