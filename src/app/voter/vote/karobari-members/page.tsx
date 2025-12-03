'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVoterLanguage } from '@/hooks/useVoterLanguage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Vote, Building, CheckCircle, ArrowLeft, AlertCircle, Users, Eye } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import CandidateProfileModal from '@/components/CandidateProfileModal'
import Footer from '@/components/Footer'

interface Candidate {
  id: string
  name: string
  nameGujarati?: string | null
  email: string
  phone: string
  position: string
  region?: string
  party?: string
  manifesto?: string
  experience?: string
  education?: string
  photoUrl?: string
  photoFileKey?: string
  age?: number | null
  gender?: string | null
  dateOfBirth?: string | null
  zone?: {
    id: string
    name: string
    nameGujarati: string
    code: string
    seats: number
  }
}

interface ZoneGroup {
  id: string
  code: string
  name: string
  nameGujarati: string
  seats: number
  candidates: Candidate[]
}

export default function KarobariMembersVotingPage() {
  const [zones, setZones] = useState<ZoneGroup[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string[]>>({})
  const [voterZone, setVoterZone] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [voter, setVoter] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showNotaWarning, setShowNotaWarning] = useState(false)
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<Candidate | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { selectedLanguage, setSelectedLanguage } = useVoterLanguage()
  const router = useRouter()
  const votingEnabled = false

  // Function to validate candidate name - filter out garbled/invalid names
  const isValidCandidateName = (name: string): boolean => {
    if (!name || name.trim().length < 3) return false
    
    // Filter out names with suspicious special characters (semicolons, brackets, etc.)
    if (/[;:<>\[\]{}|\\\/]/.test(name)) return false
    
    // Filter out names with excessive special characters or numbers
    const specialCharCount = (name.match(/[^a-zA-Z\s\.\-']/g) || []).length
    const totalChars = name.length
    if (specialCharCount > totalChars * 0.2) return false // More than 20% special chars
    
    // Filter out names that look like encoding errors (common patterns)
    // Pattern like "m. fwei;n jlbuwefb" or "fghli vnmhjk nmhjk"
    const suspiciousPatterns = [
      /^[a-z]{1,3}\s+[a-z]{4,}\s+[a-z]{4,}/i, // Short first word + long words
      /^[a-z]{1,2}\.\s+[a-z]{4,}\s+[a-z]{4,}/i, // Pattern with dot like "m. fwei;n"
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name)) {
        // Check if it's a valid name structure
        const words = name.split(/\s+/)
        // If first word is very short (1-2 chars) and other words are long, likely garbled
        if (words.length >= 3 && words[0].length <= 3 && words.slice(1).every(w => w.length >= 5)) {
          // Check vowel ratio - garbled names often have low vowel ratio
          const allText = name.replace(/\s+/g, '')
          const vowels = (allText.match(/[aeiouAEIOU]/g) || []).length
          const consonants = (allText.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length
          if (consonants > 0 && vowels / consonants < 0.25) return false // Less than 25% vowels
        }
      }
    }
    
    // Filter out names that are mostly consonants without vowels (likely garbled)
    const allText = name.replace(/\s+/g, '')
    const vowels = (allText.match(/[aeiouAEIOU]/g) || []).length
    const consonants = (allText.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length
    if (consonants > 0 && vowels / consonants < 0.2) return false // Less than 20% vowels
    
    // Filter out names with repeated patterns (like "nmhjk nmhjk")
    const words = name.split(/\s+/)
    if (words.length >= 2) {
      const lastWord = words[words.length - 1]
      const secondLastWord = words[words.length - 2]
      if (lastWord === secondLastWord && lastWord.length >= 4) return false // Repeated word pattern
    }
    
    return true
  }

  useEffect(() => {
    fetchCandidates()
  }, [])
  
  // Security checks removed - this is a view-only page showing winners
  // No voting is allowed, so no need for strict security measures
  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      setError('')

      const voterResponse = await fetch('/api/voter/me')
      if (!voterResponse.ok) {
        setError('Failed to load voter information')
        setIsLoading(false)
        return
      }

      const voterData = await voterResponse.json();
      console.log('Voter Data:', voterData);
      setVoter(voterData.voter);

      // Fetch all Karobari winners (not zone-specific - all winners visible to all voters)
      // Get voter's zone for display purposes only
      const karobariZone = voterData.voter.karobariZone
      if (karobariZone) {
        setVoterZone(karobariZone)
      }
      
      // Fetch all approved candidates (all winners from all zones)
      const response = await fetch(`/api/elections/karobari-members/candidates`, {
        credentials: 'include' // This ensures cookies are sent
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load candidates' }))
        setError(errorData.error || errorData.details || `Failed to load candidates (${response.status})`)
        console.error('API Error:', errorData)
        return
      }
      
      const data = await response.json()
      
      if (!data.candidates || !Array.isArray(data.candidates)) {
        setError('Invalid response from server: candidates data not found')
        console.error('Invalid response:', data)
        return
      }

      if (data.candidates.length === 0) {
        setError('No approved candidates found. Please contact the administrator.')
        return
      }

      // Group candidates by zone and filter out invalid candidates
      const zoneMap: Record<string, ZoneGroup> = {}

      data.candidates.forEach((candidate: Candidate) => {
        // Filter out candidates with invalid/garbled names
        if (!isValidCandidateName(candidate.name)) {
          console.warn('Filtered out candidate with invalid name:', candidate.id, candidate.name)
          return
        }
        
        if (!candidate.zone) {
          console.warn('Candidate missing zone:', candidate.id, candidate.name)
          return
        }
        
        const zoneId = candidate.zone.id
        if (!zoneMap[zoneId]) {
          // Fix Karnataka zone nameGujarati if needed
          let zoneNameGujarati = candidate.zone.nameGujarati
          if (candidate.zone.code === 'KARNATAKA_GOA' && zoneNameGujarati !== 'કર્ણાટક અને ગોવા') {
            zoneNameGujarati = 'કર્ણાટક અને ગોવા'
          }
          
          zoneMap[zoneId] = {
            id: zoneId,
            code: candidate.zone.code,
            name: candidate.zone.name,
            nameGujarati: zoneNameGujarati,
            seats: candidate.zone.seats,
            candidates: []
          }
        }
        zoneMap[zoneId].candidates.push(candidate)
      })
      
      if (Object.keys(zoneMap).length === 0) {
        setError('No valid candidates found. All candidates are missing zone information.')
        return
      }

      // Sort zones by name for consistent display
      const sortedZones = Object.values(zoneMap).sort((a, b) => a.name.localeCompare(b.name))
      setZones(sortedZones)
      
      // Photos are not displayed for Karobari candidates - removed photo URL fetching
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setError('Failed to load candidates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCandidateSelect = (positionId: string, candidateId: string) => {
    setSelectedCandidates(prev => {
      const currentSelections = prev[positionId] || []
      const maxSeats = voterZone?.seats || 1
      
      if (currentSelections.includes(candidateId)) {
        // Remove if already selected
        return {
          ...prev,
          [positionId]: currentSelections.filter(id => id !== candidateId)
        }
      } else if (currentSelections.length < maxSeats) {
        // Add if under limit
        return {
          ...prev,
          [positionId]: [...currentSelections, candidateId]
        }
      } else {
        // Replace first selection if at limit
        return {
          ...prev,
          [positionId]: [candidateId, ...currentSelections.slice(1)]
        }
      }
    })
  }

  const handleSubmit = async () => {
    const requiredSeats = voterZone?.seats || 1
    const totalSelections = Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)

    if (totalSelections < requiredSeats) {
      setShowNotaWarning(true)
      return
    }

    // Show confirmation screen instead of directly submitting
    setShowConfirmation(true)
    setError('')
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/voter/vote/karobari-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          votes: selectedCandidates
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/voter/dashboard')
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit vote')
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      setError('Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
  }

  const handleProceedWithNota = () => {
    const requiredSeats = voterZone?.seats || 1
    const totalSelections = Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)
    const remainingSeats = requiredSeats - totalSelections

    // Add Nota votes for remaining seats
    const updatedSelections = { ...selectedCandidates }
    for (let i = 0; i < remainingSeats; i++) {
      const notaId = `NOTA_${Date.now()}_${i}`
      if (!updatedSelections['NOTA']) {
        updatedSelections['NOTA'] = []
      }
      updatedSelections['NOTA'].push(notaId)
    }

    setSelectedCandidates(updatedSelections)
    setShowNotaWarning(false)
    setShowConfirmation(true)
  }

  const handleCancelNota = () => {
    setShowNotaWarning(false)
  }

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidateProfile(candidate)
    setShowProfileModal(true)
  }

  const handleCloseProfile = () => {
    setShowProfileModal(false)
    setSelectedCandidateProfile(null)
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Submitted Successfully!</h2>
              <h3 className="text-xl font-semibold text-purple-600 mb-3">Thank You!</h3>
              <p className="text-gray-600 mb-4">
                Your vote for Karobari Samiti elections has been recorded. You will be redirected to your dashboard shortly.
              </p>
              <p className="text-gray-700 mb-4 italic">
                Thank you for participating in the election. Your vote has been successfully recorded and will help shape our community's future.
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showNotaWarning) {
    const requiredSeats = voterZone?.seats || 1
    const totalSelections = Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)
    const remainingSeats = requiredSeats - totalSelections

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Incomplete Selection</h2>
              <p className="text-gray-600 mb-4">
                You have selected <strong>{totalSelections}</strong> out of <strong>{requiredSeats}</strong> required candidates for {voterZone?.nameGujarati || 'this zone'}.
              </p>
              <p className="text-gray-600 mb-6">
                The remaining <strong>{remainingSeats}</strong> vote{remainingSeats > 1 ? 's' : ''} will be automatically added as &quot;None of the Above&quot; (NOTA).
              </p>
              <div className="space-y-3">
                <Button onClick={handleProceedWithNota} className="w-full bg-blue-600 hover:bg-blue-700">
                  Proceed with NOTA votes
                </Button>
                <Button onClick={handleCancelNota} variant="outline" className="w-full">
                  Go back and select more candidates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Logo size="md" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">SKMMMS Election 2026</h1>
                  <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-600">Confirm Your Vote</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">Confirm Your Karobari Samiti Selections</h2>
            <p className="text-gray-600">Please review your selections before submitting your vote</p>
          </div>

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

          {/* Zone Information */}
          {voterZone && (
            <Card className="mb-8 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedLanguage === 'english' ? voterZone.name : voterZone.nameGujarati}</h3>
                      {selectedLanguage === 'english' && <p className="text-gray-600">{voterZone.name}</p>}
                      <p className="text-sm text-gray-500">Zone Code: {voterZone.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{voterZone.seats}</div>
                    <div className="text-sm text-gray-600">Seats Available</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Summary - Grouped by Zone */}
          <div className="space-y-6">
            {zones.map((zone) => {
              // Get all selected candidates from this zone
              const allSelectedIds = Object.values(selectedCandidates).flat()
              const selectedCandidatesList = zone.candidates.filter(c => allSelectedIds.includes(c.id))
              const notaVotes = selectedCandidates['NOTA'] || []
              
              if (selectedCandidatesList.length === 0 && notaVotes.length === 0) {
                return null
              }
              
              return (
                <Card key={zone.id} className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      <span>{selectedLanguage === 'english' ? zone.name : zone.nameGujarati}</span>
                    </CardTitle>
                    <CardDescription>
                      Zone: {zone.code} - {zone.seats} seat{zone.seats > 1 ? 's' : ''} allocated
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Regular candidates */}
                      {selectedCandidatesList.map((candidate, index) => (
                        <div key={candidate.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                                <Badge className="bg-green-600 text-white text-xs">
                                  <CheckCircle className="h-2 w-2 mr-1" />
                                  Winner
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                {candidate.phone && <p>Phone: {candidate.phone}</p>}
                                {candidate.email && <p>Email: {candidate.email}</p>}
                                {candidate.zone && <p>Zone: {candidate.zone.name}</p>}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                        </div>
                      ))}
                      
                      {/* NOTA votes */}
                      {notaVotes.map((notaId, index) => (
                        <div key={notaId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {selectedCandidatesList.length + index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">None of the Above (NOTA)</h4>
                              <div className="text-xs text-gray-500">
                                <p>Blank vote - No preference</p>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800">NOTA</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={handleCancelConfirmation}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Edit
            </Button>

            <div className="flex space-x-4">
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Vote...
                  </>
                ) : (
                  <>
                    <Vote className="h-5 w-5 mr-2" />
                    Confirm & Submit Vote
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Logo size="md" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">KMS ELECTION 2026</h1>
                  <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'gujarati' : 'english')}
                  className="text-sm"
                >
                  {selectedLanguage === 'english' ? 'ગુજરાતી' : 'English'}
                </Button>
                <Link href="/voter/dashboard">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <Building className="h-6 w-6 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    {Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)}/{voterZone?.seats || 1} Selected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-4 shadow-lg">
              <Building className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Karobari Samiti Elections 2026-2029</h2>
            <p className="text-xl text-gray-600 mb-4">Elected Winners - Zone Wise</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Uncontested Election - All winners declared
              </p>
            </div>
          </div>

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

          {/* Zone-wise Winners Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone, zoneIndex) => {
              // Zone color scheme based on index for visual variety
              const zoneColors = [
                { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', border: 'border-blue-300', card: 'bg-blue-50', text: 'text-blue-700' },
                { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', border: 'border-purple-300', card: 'bg-purple-50', text: 'text-purple-700' },
                { bg: 'bg-gradient-to-br from-green-500 to-green-600', border: 'border-green-300', card: 'bg-green-50', text: 'text-green-700' },
                { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', border: 'border-orange-300', card: 'bg-orange-50', text: 'text-orange-700' },
                { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', border: 'border-indigo-300', card: 'bg-indigo-50', text: 'text-indigo-700' },
                { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', border: 'border-pink-300', card: 'bg-pink-50', text: 'text-pink-700' },
                { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', border: 'border-teal-300', card: 'bg-teal-50', text: 'text-teal-700' },
                { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', border: 'border-cyan-300', card: 'bg-cyan-50', text: 'text-cyan-700' },
              ]
              const colors = zoneColors[zoneIndex % zoneColors.length]
              
              return (
                <Card key={zone.id} className={`overflow-hidden border-2 ${colors.border} hover:shadow-xl transition-all duration-300`}>
                  {/* Zone Header */}
                  <div className={`${colors.bg} p-6 text-white`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">
                          {selectedLanguage === 'english' ? zone.name : zone.nameGujarati}
                        </h3>
                        {selectedLanguage === 'english' && zone.nameGujarati && (
                          <p className="text-white/80 text-sm">{zone.nameGujarati}</p>
                        )}
                        <p className="text-white/70 text-xs mt-1">{zone.code}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                          <div className="text-3xl font-bold">{zone.candidates.length}</div>
                          <div className="text-xs text-white/80">Winner{zone.candidates.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
              </div>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Users className="h-4 w-4" />
                      <span>{zone.seats} seat{zone.seats > 1 ? 's' : ''} allocated</span>
                    </div>
                  </div>

                  {/* Winners List */}
                  <CardContent className={`p-6 ${colors.card}`}>
                    {zone.candidates.length > 0 ? (
                      <div className="space-y-3">
                        {zone.candidates.map((candidate, candidateIndex) => (
                        <div 
                          key={candidate.id} 
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              {/* Winner Badge Number */}
                              <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                {candidateIndex + 1}
                                </div>
                              
                              {/* Candidate Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-lg leading-tight">
                                      {selectedLanguage === 'english' ? candidate.name : (candidate.nameGujarati || candidate.name)}
                                    </h4>
                                    {selectedLanguage === 'gujarati' && candidate.nameGujarati && (
                                      <p className="text-sm text-gray-600 mt-0.5">{candidate.name}</p>
                                    )}
                                  </div>
                                  <Badge className={`${colors.text} bg-white border-2 ${colors.border} flex-shrink-0`}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {selectedLanguage === 'english' ? 'Winner' : 'વિજેતા'}
                                  </Badge>
                          </div>

                                {/* Additional Info */}
                                <div className="space-y-1 text-xs text-gray-600">
                              {candidate.age !== null && candidate.age !== undefined && (
                                    <div className="flex items-center gap-1">
                                  <span className="font-medium">Age:</span>
                                  <span>{candidate.age} years</span>
                                    </div>
                              )}
                              {candidate.gender && (
                                    <div className="flex items-center gap-1">
                                  <span className="font-medium">Gender:</span>
                                  <span className="capitalize">{candidate.gender}</span>
                                    </div>
                                  )}
                                  {candidate.phone && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Phone:</span>
                                      <span>{candidate.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No winners found for this zone</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Summary Card */}
          <Card className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Total Winners</h3>
                    <p className="text-sm text-gray-600">Across all zones</p>
                          </div>
                        </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">
                    {zones.reduce((sum, zone) => sum + zone.candidates.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    from {zones.length} zone{zones.length > 1 ? 's' : ''}
                  </div>
                </div>
                  </div>
                </CardContent>
              </Card>

          {votingEnabled && (
            <>
          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Vote...
                </>
              ) : (
                <>
                  <Vote className="h-5 w-5 mr-2" />
                  Submit Vote
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
                  Progress: {Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)} of {voterZone?.seats || 1} winner{voterZone?.seats > 1 ? 's' : ''} selected
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0) / (voterZone?.seats || 1)) * 100}%`
                }}
              ></div>
            </div>
          </div>
            </>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfile}
        candidate={selectedCandidateProfile}
      />
    </>
  )
}
