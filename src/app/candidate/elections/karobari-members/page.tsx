'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, ArrowLeft, Vote, Users, MapPin, Upload } from 'lucide-react'
import Link from 'next/link'

interface KarobariCandidate {
  id: string
  name: string
  email: string
  phone: string
  position: string
  region: string
  experience: string
  education: string
  status: string
  uploadedBy: string
  uploadedAt: string
}

export default function KarobariMembersPage() {
  const [candidates, setCandidates] = useState<KarobariCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/elections/karobari-members/candidates')
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
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
                  <Building className="h-8 w-8" />
                  <h1 className="text-3xl">Karobari Members Election</h1>
                </div>
                <p className="text-blue-100">Business committee members for community development</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">
                <div>Offline Nominations</div>
                <div>Managed by Super Admin</div>
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
              <Building className="h-6 w-6 text-blue-600" />
              <span>About Karobari Members Election</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Eligibility</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Age: 25+ years</li>
                  <li>• Business experience: 5+ years</li>
                  <li>• Active member of KMS Samaj</li>
                  <li>• Good financial standing</li>
                  <li>• No criminal record</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Positions Available</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Business President (1 per region)</li>
                  <li>• Business Vice President (1 per region)</li>
                  <li>• Business Secretary (1 per region)</li>
                  <li>• Business Treasurer (1 per region)</li>
                  <li>• Business Members (2 per region)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>
              Super admin can upload offline nominations and manage candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/karobari/upload">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Offline Nominations
                </Button>
              </Link>
              <Link href="/admin/karobari/manage">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Candidates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg px-6 py-3 text-center">
            <p className="text-sm font-semibold text-red-700">
              The online voting process is closed now.
            </p>
          </div>
        </div>

        {/* Candidates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Approved Karobari Candidates</span>
            </CardTitle>
            <CardDescription>
              Business committee members nominated through offline process
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
                          <span>{candidate.position}</span>
                          <span>Uploaded by: {candidate.uploadedBy}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(candidate.status)}
                        <Badge variant="outline">{candidate.position}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Contact</h4>
                          <p className="text-sm text-gray-600">{candidate.email}</p>
                          <p className="text-sm text-gray-600">{candidate.phone}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Education</h4>
                          <p className="text-sm text-gray-600">{candidate.education || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {candidate.experience && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Business Experience</h4>
                          <p className="text-sm text-gray-600">{candidate.experience}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(candidate.uploadedAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates uploaded yet</h3>
                <p className="text-gray-500 mb-4">
                  Super admin needs to upload offline nominations for Karobari Members.
                </p>
                <Link href="/admin/karobari/upload">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Nominations
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
