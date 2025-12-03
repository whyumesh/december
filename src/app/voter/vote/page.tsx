'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVoterLanguage } from '@/hooks/useVoterLanguage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Vote, Users, Building, Award, CheckCircle, ArrowLeft, Eye, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

interface Candidate {
  id: string
  name: string
  party?: string
  manifesto?: string
  experience?: string
  position: string
  phone?: string
  email?: string
  region?: string
  zone?: {
    id: string
    name: string
    nameGujarati: string
  }
}

interface Trustee {
  id: string
  name: string
  nameGujarati?: string
  voterId: string
  phone?: string
  email?: string
  zone: {
    id: string
    name: string
    nameGujarati: string
    seats?: number
  }
  seat: string
}

interface Position {
  id: string
  title: string
  description: string
  candidates: Candidate[]
}

interface Zone {
  id: string
  name: string
  nameGujarati: string
  seats?: number
  trustees: Trustee[]
}

interface VotingData {
  yuvaPank: {
    positions: Position[]
    selectedCandidates: Record<string, string[]>
  }
  karobariMembers: {
    positions: Position[]
    selectedCandidates: Record<string, string[]>
  }
  trustees: {
    zones: Zone[]
    selectedTrustees: Record<string, string[]>
  }
}

export default function UnifiedVotingPage() {
  const [votingData, setVotingData] = useState<VotingData>({
    yuvaPank: { positions: [], selectedCandidates: {} },
    karobariMembers: { positions: [], selectedCandidates: {} },
    trustees: { zones: [], selectedTrustees: {} }
  })
  const [currentStep, setCurrentStep] = useState<'yuva-pank' | 'karobari-members' | 'trustees' | 'preview'>('yuva-pank')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [voter, setVoter] = useState<any>(null)
  const [showNotaWarning, setShowNotaWarning] = useState(false)
  const { selectedLanguage, setSelectedLanguage } = useVoterLanguage()
  const router = useRouter()

  // Language-specific content
  const content = {
    english: {
      steps: {
        yuvaPank: 'Yuva Pankh',
        karobariMembers: 'Karobari Members',
        trustees: 'Trustees',
        preview: 'Preview & Submit'
      },
      previous: 'Previous',
      next: 'Next',
      submit: 'Submit',
      submitting: 'Submitting...',
      error: 'Error',
      loading: 'Loading...',
      voteSubmitted: 'Vote Submitted Successfully!',
      redirecting: 'Redirecting to dashboard...',
      thankYou: 'Thank You!',
      thankYouMessage: 'Thank you for participating in the election. Your vote has been successfully recorded and will help shape our community\'s future.'
    },
    gujarati: {
      steps: {
        yuvaPank: 'યુવા પાંખ',
        karobariMembers: 'કારોબારી સભ્યો',
        trustees: 'ટ્રસ્ટીઓ',
        preview: 'પૂર્વાવલોકન અને સબમિટ'
      },
      previous: 'પાછલું',
      next: 'આગળ',
      submit: 'સબમિટ કરો',
      submitting: 'સબમિટ કરી રહ્યા છીએ...',
      error: 'ભૂલ',
      loading: 'લોડ કરી રહ્યા છીએ...',
      voteSubmitted: 'મત સફળતાપૂર્વક સબમિટ થયો!',
      redirecting: 'ડેશબોર્ડ પર પુનઃદિશા આપી રહ્યા છીએ...',
      thankYou: 'આભાર!',
      thankYouMessage: 'ચૂંટણીમાં ભાગ લેવા બદલ આભાર. તમારો મત સફળતાપૂર્વક રેકોર્ડ કરવામાં આવ્યો છે અને તે આપણા સમુદાયના ભવિષ્યને આકાર આપવામાં મદદ કરશે.'
    }
  }

  const steps = [
    { id: 'yuva-pank', title: content[selectedLanguage].steps.yuvaPank, icon: Users, color: 'green' },
    { id: 'karobari-members', title: content[selectedLanguage].steps.karobariMembers, icon: Building, color: 'blue' },
    { id: 'trustees', title: content[selectedLanguage].steps.trustees, icon: Award, color: 'purple' },
    { id: 'preview', title: content[selectedLanguage].steps.preview, icon: Eye, color: 'gray' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  useEffect(() => {
    fetchAllData()
  }, [])

  // Load saved selections from localStorage after data is fetched
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      const saved = localStorage.getItem('unified-voting-selections')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setVotingData(prev => {
            // Merge saved selections with current data, validating against loaded positions/zones
            const merged = { ...prev }
            
            // Validate and merge Yuva Pankh selections
            if (parsed.yuvaPank?.selectedCandidates) {
              const validYuvaPank: Record<string, string[]> = {}
              for (const position of prev.yuvaPank.positions) {
                if (parsed.yuvaPank.selectedCandidates[position.id]) {
                  const validIds = parsed.yuvaPank.selectedCandidates[position.id].filter((id: string) =>
                    position.candidates.some(c => c.id === id) || id.startsWith('NOTA_')
                  )
                  if (validIds.length > 0) {
                    validYuvaPank[position.id] = validIds
                  }
                }
              }
              merged.yuvaPank.selectedCandidates = validYuvaPank
            }
            
            // Validate and merge Karobari selections
            if (parsed.karobariMembers?.selectedCandidates) {
              const validKarobari: Record<string, string[]> = {}
              for (const position of prev.karobariMembers.positions) {
                if (parsed.karobariMembers.selectedCandidates[position.id]) {
                  const validIds = parsed.karobariMembers.selectedCandidates[position.id].filter((id: string) =>
                    position.candidates.some(c => c.id === id) || id.startsWith('NOTA_')
                  )
                  if (validIds.length > 0) {
                    validKarobari[position.id] = validIds
                  }
                }
              }
              merged.karobariMembers.selectedCandidates = validKarobari
            }
            
            // Validate and merge Trustees selections
            if (parsed.trustees?.selectedTrustees) {
              const validTrustees: Record<string, string[]> = {}
              for (const zone of prev.trustees.zones) {
                if (parsed.trustees.selectedTrustees[zone.id]) {
                  const validIds = parsed.trustees.selectedTrustees[zone.id].filter((id: string) =>
                    zone.trustees.some(t => t.id === id) || id.startsWith('NOTA_')
                  )
                  if (validIds.length > 0) {
                    validTrustees[zone.id] = validIds
                  }
                }
              }
              merged.trustees.selectedTrustees = validTrustees
            }
            
            return merged
          })
        } catch (e) {
          console.error('Error loading saved selections:', e)
        }
      }
    }
  }, [isLoading])

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSelections = 
        Object.keys(votingData.yuvaPank.selectedCandidates).length > 0 ||
        Object.keys(votingData.karobariMembers.selectedCandidates).length > 0 ||
        Object.keys(votingData.trustees.selectedTrustees).length > 0
      
      if (hasSelections) {
        localStorage.setItem('unified-voting-selections', JSON.stringify({
          yuvaPank: { selectedCandidates: votingData.yuvaPank.selectedCandidates },
          karobariMembers: { selectedCandidates: votingData.karobariMembers.selectedCandidates },
          trustees: { selectedTrustees: votingData.trustees.selectedTrustees }
        }))
      }
    }
  }, [votingData.yuvaPank.selectedCandidates, votingData.karobariMembers.selectedCandidates, votingData.trustees.selectedTrustees])


  const fetchAllData = async () => {

    const voterResponse = await fetch('/api/voter/me')
    if (!voterResponse.ok) {
      setError('Failed to load voter information')
      return
    }

    const voterData = await voterResponse.json();
    console.log('Voter Data:', voterData);
    setVoter(voterData.voter);
    setIsLoading(true)
    try {
      // Fetch Yuva Pankh candidates for voter's yuva pankh zone
      const yuvaPankZone = voterData.voter.yuvaPankZone
      if (yuvaPankZone) {
        const yuvaPankResponse = await fetch(`/api/elections/yuva-pank/candidates?zoneId=${yuvaPankZone.id}`, {
          credentials: 'include' // This ensures cookies are sent
        })
      if (yuvaPankResponse.ok) {
        const yuvaPankData = await yuvaPankResponse.json()
        const positionMap: Record<string, Position> = {}

        yuvaPankData.candidates.forEach((candidate: Candidate) => {
          if (!positionMap[candidate.position]) {
            positionMap[candidate.position] = {
              id: candidate.position,
              title: candidate.position.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: `Select your preferred candidate for ${candidate.position.replace(/_/g, ' ').toLowerCase()}`,
              candidates: []
            }
          }
          positionMap[candidate.position].candidates.push(candidate)
        })

        setVotingData(prev => ({
          ...prev,
          yuvaPank: { ...prev.yuvaPank, positions: Object.values(positionMap) }
        }))
        }
      }

      // Fetch Karobari Members candidates for voter's karobari zone
      const karobariZone = voterData.voter.karobariZone
      if (karobariZone) {
        const karobariResponse = await fetch(`/api/elections/karobari-members/candidates?zoneId=${karobariZone.id}`, {
          credentials: 'include' // This ensures cookies are sent
        })
        if (karobariResponse.ok) {
        const karobariData = await karobariResponse.json()
        const positionMap: Record<string, Position> = {}

        karobariData.candidates.forEach((candidate: Candidate) => {
          if (!positionMap[candidate.position]) {
            positionMap[candidate.position] = {
              id: candidate.position,
              title: candidate.position.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: `Select your preferred candidate for ${candidate.position.replace(/_/g, ' ').toLowerCase()}`,
              candidates: []
            }
          }
          positionMap[candidate.position].candidates.push(candidate)
        })

        setVotingData(prev => ({
          ...prev,
          karobariMembers: { ...prev.karobariMembers, positions: Object.values(positionMap) }
        }))
        }
      }

      // Fetch Trustees
      const trusteesResponse = await fetch('/api/trustees')
      if (trusteesResponse.ok) {
        const trusteesData = await trusteesResponse.json()
        const zoneMap: Record<string, Zone> = {}

        trusteesData.trustees.forEach((trustee: Trustee) => {
          if (!zoneMap[trustee.zone.id]) {
            zoneMap[trustee.zone.id] = {
              id: trustee.zone.id,
              name: trustee.zone.name,
              nameGujarati: trustee.zone.nameGujarati,
              seats: trustee.zone.seats || 1,
              trustees: []
            }
          }
          zoneMap[trustee.zone.id].trustees.push(trustee)
        })

        setVotingData(prev => ({
          ...prev,
          trustees: { ...prev.trustees, zones: Object.values(zoneMap) }
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load voting data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCandidateSelect = (electionType: 'yuvaPank' | 'karobariMembers', positionId: string, candidateId: string) => {
    setVotingData(prev => ({
      ...prev,
      [electionType]: {
        ...prev[electionType],
        selectedCandidates: {
          ...prev[electionType].selectedCandidates,
          [positionId]: [candidateId]
        }
      }
    }))
  }

  const handleTrusteeSelect = (zoneId: string, trusteeId: string) => {
    setVotingData(prev => ({
      ...prev,
      trustees: {
        ...prev.trustees,
        selectedTrustees: {
          ...prev.trustees.selectedTrustees,
          [zoneId]: [trusteeId]
        }
      }
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'yuva-pank':
        return votingData.yuvaPank.positions.length === Object.keys(votingData.yuvaPank.selectedCandidates).length
      case 'karobari-members':
        return votingData.karobariMembers.positions.length === Object.keys(votingData.karobariMembers.selectedCandidates).length
      case 'trustees':
        return votingData.trustees.zones.length === Object.keys(votingData.trustees.selectedTrustees).length
      case 'preview':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep === 'yuva-pank') {
      setCurrentStep('karobari-members')
    } else if (currentStep === 'karobari-members') {
      setCurrentStep('trustees')
    } else if (currentStep === 'trustees') {
      setCurrentStep('preview')
    }
  }

  const handlePrevious = () => {
    if (currentStep === 'karobari-members') {
      setCurrentStep('yuva-pank')
    } else if (currentStep === 'trustees') {
      setCurrentStep('karobari-members')
    } else if (currentStep === 'preview') {
      setCurrentStep('trustees')
    }
  }

  const checkIncompleteSelections = () => {
    const incomplete = []
    
    // Check Yuva Pankh selections
    for (const position of votingData.yuvaPank.positions) {
      const selected = votingData.yuvaPank.selectedCandidates[position.id] || []
      if (selected.length < 1) { // Assuming 1 seat per position for Yuva Pankh
        incomplete.push({
          election: 'Yuva Pankh',
          position: position.id,
          required: 1,
          selected: selected.length
        })
      }
    }
    
    // Check Karobari Members selections
    for (const position of votingData.karobariMembers.positions) {
      const selected = votingData.karobariMembers.selectedCandidates[position.id] || []
      if (selected.length < 1) { // Assuming 1 seat per position for Karobari
        incomplete.push({
          election: 'Karobari Members',
          position: position.id,
          required: 1,
          selected: selected.length
        })
      }
    }
    
    // Check Trustees selections
    for (const zone of votingData.trustees.zones) {
      const selected = votingData.trustees.selectedTrustees[zone.id] || []
      const requiredSeats = zone.seats || 1
      if (selected.length < requiredSeats) {
        incomplete.push({
          election: 'Trustees',
          position: zone.id,
          required: requiredSeats,
          selected: selected.length
        })
      }
    }
    
    return incomplete
  }

  const handleProceedWithNota = () => {
    const updatedVotingData = { ...votingData }
    
    // Add NOTA votes for incomplete selections
    const incomplete = checkIncompleteSelections()
    
    for (const incompleteSelection of incomplete) {
      if (incompleteSelection.election === 'Yuva Pankh') {
        const remainingSeats = incompleteSelection.required - incompleteSelection.selected
        for (let i = 0; i < remainingSeats; i++) {
          const notaId = `NOTA_${incompleteSelection.position}_${Date.now()}_${i}`
          if (!updatedVotingData.yuvaPank.selectedCandidates[incompleteSelection.position]) {
            updatedVotingData.yuvaPank.selectedCandidates[incompleteSelection.position] = []
          }
          updatedVotingData.yuvaPank.selectedCandidates[incompleteSelection.position].push(notaId)
        }
      } else if (incompleteSelection.election === 'Karobari Members') {
        const remainingSeats = incompleteSelection.required - incompleteSelection.selected
        for (let i = 0; i < remainingSeats; i++) {
          const notaId = `NOTA_${incompleteSelection.position}_${Date.now()}_${i}`
          if (!updatedVotingData.karobariMembers.selectedCandidates[incompleteSelection.position]) {
            updatedVotingData.karobariMembers.selectedCandidates[incompleteSelection.position] = []
          }
          updatedVotingData.karobariMembers.selectedCandidates[incompleteSelection.position].push(notaId)
        }
      } else if (incompleteSelection.election === 'Trustees') {
        const remainingSeats = incompleteSelection.required - incompleteSelection.selected
        for (let i = 0; i < remainingSeats; i++) {
          const notaId = `NOTA_${incompleteSelection.position}_${Date.now()}_${i}`
          if (!updatedVotingData.trustees.selectedTrustees[incompleteSelection.position]) {
            updatedVotingData.trustees.selectedTrustees[incompleteSelection.position] = []
          }
          updatedVotingData.trustees.selectedTrustees[incompleteSelection.position].push(notaId)
        }
      }
    }
    
    setVotingData(updatedVotingData)
    setShowNotaWarning(false)
    setCurrentStep('preview')
  }

  const handleCancelNota = () => {
    setShowNotaWarning(false)
  }

  const handleSubmitAllVotes = async () => {
    // Check for incomplete selections and show NOTA warning
    const incompleteSelections = checkIncompleteSelections()
    if (incompleteSelections.length > 0) {
      setShowNotaWarning(true)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Submit all votes in parallel
      const promises = []

      // Submit Yuva Pankh votes
      if (Object.keys(votingData.yuvaPank.selectedCandidates).length > 0) {
        promises.push(
          fetch('/api/voter/vote/yuva-pank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // This ensures cookies are sent
            body: JSON.stringify({ votes: votingData.yuvaPank.selectedCandidates })
          })
        )
      }

      // Submit Karobari Members votes
      if (Object.keys(votingData.karobariMembers.selectedCandidates).length > 0) {
        promises.push(
          fetch('/api/voter/vote/karobari-members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ votes: votingData.karobariMembers.selectedCandidates })
          })
        )
      }

      // Submit Trustees votes
      if (Object.keys(votingData.trustees.selectedTrustees).length > 0) {
        promises.push(
          fetch('/api/voter/vote/trustees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ votes: votingData.trustees.selectedTrustees })
          })
        )
      }

      const responses = await Promise.all(promises)
      const failedResponses = responses.filter(response => !response.ok)

      if (failedResponses.length === 0) {
        // Clear saved selections after successful vote
        if (typeof window !== 'undefined') {
          localStorage.removeItem('unified-voting-selections')
        }
        setSuccess(true)
        setTimeout(() => {
          router.push('/voter/dashboard')
        }, 3000)
      } else {
        setError('Some votes failed to submit. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting votes:', error)
      setError('Failed to submit votes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{content[selectedLanguage].loading}</p>
          </div>
        </div>
      </>
    )
  }

  if (success) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{content[selectedLanguage].voteSubmitted}</h1>
            <h2 className="text-2xl font-semibold text-purple-600 mb-3">{content[selectedLanguage].thankYou}</h2>
            <p className="text-gray-700 mb-4 italic text-lg">
              {content[selectedLanguage].thankYouMessage}
            </p>
            <p className="text-gray-600 mb-6">{content[selectedLanguage].redirecting}</p>
          </div>
        </div>
      </>
    )
  }

  if (showNotaWarning) {
    const incompleteSelections = checkIncompleteSelections()
    
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Incomplete Selection</h2>
              <p className="text-gray-600 mb-4">
                You have incomplete selections in some elections. The remaining votes will be automatically added as "None of the Above" (NOTA).
              </p>
              <div className="text-left mb-6">
                <p className="text-sm text-gray-600 mb-2">Incomplete selections:</p>
                {incompleteSelections.map((selection, index) => (
                  <p key={index} className="text-sm text-gray-500">
                    • {selection.election} - {selection.position}: {selection.selected}/{selection.required} selected ({selection.required - selection.selected} NOTA will be added)
                  </p>
                ))}
              </div>
              <div className="space-y-3">
                <Button onClick={handleProceedWithNota} className="w-full bg-blue-600 hover:bg-blue-700">
                  Proceed with NOTA votes
                </Button>
                <Button onClick={handleCancelNota} variant="outline" className="w-full">
                  Go back and complete selections
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none select-none z-50 overflow-hidden">
        <div className="w-full h-full flex flex-wrap">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="text-gray-400 text-4xl opacity-10 rotate-45 flex items-center justify-center w-1/4 h-32"
            >
              {voter.phone} {/* Replace with dynamic user info */}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Logo size="sm" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">SKMMMS Election 2026</h1>
                  <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Unified Voting System</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'gujarati' : 'english')}
                  className="mr-2"
                >
                  {selectedLanguage === 'english' ? 'ગુજરાતી' : 'English'}
                </Button>
              </div>
              <Link href="/voter/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto text-sm flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {content[selectedLanguage].previous}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Voting Progress</h2>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = index < currentStepIndex

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-600 text-white' :
                      isActive ? `bg-${step.color}-600 text-white` :
                        'bg-gray-200 text-gray-600'
                      }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs mt-2 ${isActive ? 'font-semibold' : 'text-gray-600'}`}>
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Yuva Pankh Step */}
          {currentStep === 'yuva-pank' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-green-600" />
                  <span>Yuva Pankh Elections</span>
                </CardTitle>
                <CardDescription>
                  Select your preferred candidates for youth leadership positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {votingData.yuvaPank.positions.map((position) => (
                    <div key={position.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">{position.title}</h3>
                      <p className="text-gray-600 mb-4">{position.description}</p>
                      <div className="grid gap-3">
                        {position.candidates.map((candidate) => (
                          <label
                            key={candidate.id}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${(votingData.yuvaPank.selectedCandidates[position.id] || []).includes(candidate.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                              }`}
                          >
                            <input
                              type="radio"
                              name={position.id}
                              value={candidate.id}
                              checked={(votingData.yuvaPank.selectedCandidates[position.id] || []).includes(candidate.id)}
                              onChange={() => handleCandidateSelect('yuvaPank', position.id, candidate.id)}
                              className="text-green-600"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{candidate.name}</p>
                              {candidate.party && (
                                <p className="text-sm text-gray-600">Party: {candidate.party}</p>
                              )}
                              {candidate.manifesto && (
                                <p className="text-sm text-gray-500 mt-1">{candidate.manifesto}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Karobari Members Step */}
          {currentStep === 'karobari-members' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-6 w-6 text-blue-600" />
                  <span>Karobari Members Elections</span>
                </CardTitle>
                <CardDescription>
                  Select your preferred candidates for business committee positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {votingData.karobariMembers.positions.map((position) => (
                    <div key={position.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">{position.title}</h3>
                      <p className="text-gray-600 mb-4">{position.description}</p>
                      <div className="grid gap-3">
                        {position.candidates.map((candidate) => (
                          <label
                            key={candidate.id}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${(votingData.karobariMembers.selectedCandidates[position.id] || []).includes(candidate.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                              }`}
                          >
                            <input
                              type="radio"
                              name={position.id}
                              value={candidate.id}
                              checked={(votingData.karobariMembers.selectedCandidates[position.id] || []).includes(candidate.id)}
                              onChange={() => handleCandidateSelect('karobariMembers', position.id, candidate.id)}
                              className="text-blue-600"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{candidate.name}</p>
                              {candidate.party && (
                                <p className="text-sm text-gray-600">Party: {candidate.party}</p>
                              )}
                              {candidate.manifesto && (
                                <p className="text-sm text-gray-500 mt-1">{candidate.manifesto}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trustees Step */}
          {currentStep === 'trustees' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-6 w-6 text-purple-600" />
                  <span>Trustees Elections</span>
                </CardTitle>
                <CardDescription>
                  Select your preferred trustees for each zone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {votingData.trustees.zones.map((zone) => (
                    <div key={zone.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">{zone.nameGujarati}</h3>
                      <p className="text-gray-600 mb-4">{zone.name} - {zone.seats || 1} seat(s)</p>
                      <div className="grid gap-3">
                        {zone.trustees.map((trustee) => (
                          <label
                            key={trustee.id}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${(votingData.trustees.selectedTrustees[zone.id] || []).includes(trustee.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200'
                              }`}
                          >
                            <input
                              type="radio"
                              name={zone.id}
                              value={trustee.id}
                              checked={(votingData.trustees.selectedTrustees[zone.id] || []).includes(trustee.id)}
                              onChange={() => handleTrusteeSelect(zone.id, trustee.id)}
                              className="text-purple-600"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{trustee.name}</p>
                              {trustee.nameGujarati && (
                                <p className="text-sm text-gray-600">{trustee.nameGujarati}</p>
                              )}
                              <p className="text-sm text-gray-500">Seat: {trustee.seat}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Vote Selections</h2>
                <p className="text-gray-600">Please review your selections before submitting all votes</p>
              </div>

              {/* Yuva Pankh Preview */}
              {votingData.yuvaPank.positions.length > 0 && Object.keys(votingData.yuvaPank.selectedCandidates).length > 0 && (
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-6 w-6 text-green-600" />
                      <span>Yuva Pankh Elections</span>
                    </CardTitle>
                    <CardDescription>
                      Your selections for Yuva Pankh positions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(votingData.yuvaPank.selectedCandidates).map(([positionId, candidateIds]) => {
                        const position = votingData.yuvaPank.positions.find(p => p.id === positionId)
                        const candidateIdArray = Array.isArray(candidateIds) ? candidateIds : [candidateIds]
                        
                        return candidateIdArray.map((candidateId, index) => {
                          const candidate = position?.candidates.find(c => c.id === candidateId)
                          const isNota = candidateId.startsWith('NOTA_')
                          
                          return (
                            <div key={`${positionId}-${index}`} className={`flex items-center justify-between p-4 rounded-lg border ${
                              isNota ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium ${
                                  isNota ? 'bg-gray-500' : 'bg-green-600'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{position?.title}</h4>
                                  {isNota ? (
                                    <p className="text-sm text-gray-600">None of the Above (NOTA)</p>
                                  ) : (
                                    <>
                                      <p className="text-sm text-gray-600">{candidate?.name}</p>
                                      {candidate?.phone && <p className="text-xs text-gray-500">Phone: {candidate.phone}</p>}
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge className={isNota ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                                {isNota ? 'NOTA' : 'Selected'}
                              </Badge>
                            </div>
                          )
                        })
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Karobari Members Preview */}
              {votingData.karobariMembers.positions.length > 0 && Object.keys(votingData.karobariMembers.selectedCandidates).length > 0 && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-6 w-6 text-blue-600" />
                      <span>Karobari Members Elections</span>
                    </CardTitle>
                    <CardDescription>
                      Your selections for Karobari Samiti positions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(votingData.karobariMembers.selectedCandidates).map(([positionId, candidateIds]) => {
                        const position = votingData.karobariMembers.positions.find(p => p.id === positionId)
                        const candidateIdArray = Array.isArray(candidateIds) ? candidateIds : [candidateIds]
                        
                        return candidateIdArray.map((candidateId, index) => {
                          const candidate = position?.candidates.find(c => c.id === candidateId)
                          const isNota = candidateId.startsWith('NOTA_')
                          
                          return (
                            <div key={`${positionId}-${index}`} className={`flex items-center justify-between p-4 rounded-lg border ${
                              isNota ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium ${
                                  isNota ? 'bg-gray-500' : 'bg-blue-600'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{position?.title}</h4>
                                  {isNota ? (
                                    <p className="text-sm text-gray-600">None of the Above (NOTA)</p>
                                  ) : (
                                    <>
                                      <p className="text-sm text-gray-600">{candidate?.name}</p>
                                      {candidate?.phone && <p className="text-xs text-gray-500">Phone: {candidate.phone}</p>}
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge className={isNota ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}>
                                {isNota ? 'NOTA' : 'Selected'}
                              </Badge>
                            </div>
                          )
                        })
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trustees Preview */}
              {votingData.trustees.zones.length > 0 && Object.keys(votingData.trustees.selectedTrustees).length > 0 && (
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-6 w-6 text-purple-600" />
                      <span>Trustees Elections</span>
                    </CardTitle>
                    <CardDescription>
                      Your selections for Trustee positions by zone
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(votingData.trustees.selectedTrustees).map(([zoneId, trusteeIds]) => {
                        const zone = votingData.trustees.zones.find(z => z.id === zoneId)
                        const trusteeIdArray = Array.isArray(trusteeIds) ? trusteeIds : [trusteeIds]
                        
                        return trusteeIdArray.map((trusteeId, index) => {
                          const trustee = zone?.trustees.find(t => t.id === trusteeId)
                          const isNota = trusteeId.startsWith('NOTA_')
                          
                          return (
                            <div key={`${zoneId}-${index}`} className={`flex items-center justify-between p-4 rounded-lg border ${
                              isNota ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium ${
                                  isNota ? 'bg-gray-500' : 'bg-purple-600'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{zone?.nameGujarati}</h4>
                                  {isNota ? (
                                    <p className="text-sm text-gray-600">None of the Above (NOTA)</p>
                                  ) : (
                                    <>
                                      <p className="text-sm text-gray-600">{trustee?.name}</p>
                                      {trustee?.phone && <p className="text-xs text-gray-500">Phone: {trustee.phone}</p>}
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge className={isNota ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'}>
                                {isNota ? 'NOTA' : 'Selected'}
                              </Badge>
                            </div>
                          )
                        })
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Vote Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span>Yuva Pankh: {Object.keys(votingData.yuvaPank.selectedCandidates).length} selections</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span>Karobari: {Object.keys(votingData.karobariMembers.selectedCandidates).length} selections</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span>Trustees: {Object.keys(votingData.trustees.selectedTrustees).length} selections</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'yuva-pank'}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === 'preview' ? (
              <Button
                onClick={handleSubmitAllVotes}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center"
              >
                <Vote className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting Votes...' : 'Submit All Votes'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

