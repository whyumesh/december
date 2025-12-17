'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, ArrowLeft, Vote, Users, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

interface Candidate {
  id: string
  name: string
  party: string
  position: string
  region: string
  manifesto: string
  experience: string
  status: string
}

export default function YuvaPankPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/elections/yuva-pank/candidates')
      const data = await response.json()
      
      if (response.ok) {
        setCandidates(data.candidates)
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="status-badge status-pending">Pending</Badge>
      case 'APPROVED':
        return <Badge className="status-badge status-approved">Approved</Badge>
      case 'REJECTED':
        return <Badge className="status-badge status-rejected">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
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
                  Previous
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
              <div className="flex items-center space-x-2 text-yellow-100">
                <Clock className="h-4 w-4" />
                <span>Voting Period: Dec 1-15, 2024</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Election Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              <span>About Yuva Pankh Elections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Eligibility</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Age: 18-35 years</li>
                  <li>• Active member of KMS Samaj</li>
                  <li>• No criminal record</li>
                  <li>• Minimum 2 years of community service</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Positions Available</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Youth President (1 per region)</li>
                  <li>• Youth Vice President (1 per region)</li>
                  <li>• Youth Secretary (1 per region)</li>
                  <li>• Youth Treasurer (1 per region)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/candidate/register?election=yuva-pank">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Register as Candidate
            </Button>
          </Link>
          <Link href="/voter/login">
            <Button variant="outline">
              <Vote className="h-4 w-4 mr-2" />
              Cast Your Vote
            </Button>
          </Link>
        </div>

        {/* Candidates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Approved Candidates</span>
            </CardTitle>
            <CardDescription>
              Meet the young leaders running for Yuva Pankh positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {candidates.length > 0 ? (
              <div className="grid gap-6">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {candidate.region}
                          </span>
                          <span>{candidate.party}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(candidate.status)}
                        <Badge variant="outline">{candidate.position}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Only show if there's actual meaningful content beyond system-generated data */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Manifesto</h4>
                        <p className="text-sm text-gray-600">{candidate.manifesto}</p>
                      </div>
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
      </main>
    </div>
  )
}
