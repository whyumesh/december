'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVoterLanguage } from '@/hooks/useVoterLanguage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Vote, Users, CheckCircle, ArrowLeft, AlertCircle, Eye, User } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import CandidateProfileModal from '@/components/CandidateProfileModal'
import Footer from '@/components/Footer'
import { set } from 'zod'

interface Candidate {
  id: string
  name: string
  nameGujarati?: string | null
  email: string
  phone: string
  region?: string
  party?: string
  manifesto?: string
  experience?: string
  education?: string
  position?: string
  photoUrl?: string
  photoFileKey?: string
  age?: number | null
  gender?: string | null
  birthDate?: string | null
  zone?: {
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
  candidates: Candidate[]
}

export default function YuvaPankVotingPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [voterZone, setVoterZone] = useState<any>(null)
  const [voter, setVoter] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showNotaWarning, setShowNotaWarning] = useState(false)
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<Candidate | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const { selectedLanguage, setSelectedLanguage } = useVoterLanguage()
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const router = useRouter()

  // Yuva Pankh Winners Data
  const yuvaPankhWinners = {
    'ABDASA_LAKHPAT_NAKHATRANA': {
      zoneName: 'Abdasa, Lakhpat and Nakhatrana',
      zoneNameGujarati: 'અબડાસા, લખપત અને નખત્રાણા',
      seats: 2,
      winners: [
        { name: 'Jigar Arvind Bhedakiya', nameGujarati: 'જીગર અરવિંદ ભેડાકિયા' }
      ]
    },
    'BHUJ_ANJAR': {
      zoneName: 'Bhuj and Anjar',
      zoneNameGujarati: 'ભુજ અને અંજાર',
      seats: 2,
      winners: [
        { name: 'Harsh Rajendra Navdhare', nameGujarati: 'હર્ષ રાજેન્દ્ર નવધરે' },
        { name: 'Hetvi Mehul Bhutada', nameGujarati: 'હેત્વી મેહુલ ભૂતડા' }
      ]
    },
    'ANYA_GUJARAT': {
      zoneName: 'Anya Gujarat',
      zoneNameGujarati: 'અન્ય ગુજરાત',
      seats: 3,
      winners: [
        { name: 'Vatsal Manoj Gingal', nameGujarati: 'વત્સલ મનોજ ગિંગલ' },
        { name: 'Rushik Dhirajlal Mall', nameGujarati: 'રુષિક ધીરજલાલ મલ્લ' }
      ]
    },
    'MUMBAI': {
      zoneName: 'Mumbai',
      zoneNameGujarati: 'મુંબઈ',
      seats: 4,
      winners: [
        { name: 'Keyur Chetan Navdhare', nameGujarati: 'કેયુર ચેતન નવધરે' },
        { name: 'Harsh Jaymin Mall', nameGujarati: 'હર્ષ જયમીન મલ્લ' },
        { name: 'Drashti Kiran Rathi', nameGujarati: 'દ્રષ્ટિ કિરણ રાઠી' },
        { name: 'Vidhi Kirit Mall', nameGujarati: 'વિધિ કિરીટ મલ્લ' }
      ]
    }
  }

  // Check if zone is completed (has winners) - will be checked in fetchCandidates

  // Language-specific content
  const content = {
    english: {
      title: 'Yuva Pankh Samiti Elections',
      yourZone: 'Your Zone',
      selectUpTo: 'Select up to',
      candidates: 'candidates',
      candidate: 'candidate',
      votingInstructions: 'Voting Instructions',
      instruction1: 'Voting will be done zone-wise only. For example, (a member of Raigad zone can only vote for candidates from that zone.)',
      instruction2: 'You can vote for a maximum of 3 members from this zone.',
      instruction3: 'After voting and before clicking the submit tab, please verify your vote once.',
      instruction4: 'Your vote will remain confidential.',
      instruction5: 'For this committee, you can only vote once.',
      age: 'Age',
      years: 'years',
      gender: 'Gender',
      zone: 'Zone',
      vote: 'Vote',
      selected: 'Selected',
      submitVote: 'Submit Vote',
      submittingVote: 'Submitting Vote...',
      totalCandidatesSelected: 'Total candidates selected',
      confirmYourSelections: 'Confirm Your Yuva Pankh Selections',
      reviewSelections: 'Review Your Voting Process',
      verifyVotes: 'Verify your votes in all committees',
      backToEdit: 'Back to Edit',
      confirmSubmitVote: 'Confirm & Submit Vote',
      voteSubmittedSuccessfully: 'Vote Submitted Successfully!',
      voteRecorded: 'Your vote for Yuva Pankh Samiti has been recorded. You will be redirected to your dashboard shortly.',
      thankYou: 'Thank You!',
      thankYouMessage: 'Thank you for participating in the election. Your vote has been successfully recorded and will help shape our community\'s future.',
      incompleteSelection: 'Incomplete Selection',
      selectedOutOf: 'You have selected',
      outOf: 'out of',
      requiredCandidates: 'required candidates.',
      incompleteZones: 'Incomplete zones',
      selectedLabel: 'selected',
      notaWillBeAdded: 'NOTA will be added',
      remainingVotesNota: 'The remaining votes will be automatically added as "None of the Above" (NOTA).',
      proceedWithNota: 'Proceed with NOTA votes',
      goBackSelectMore: 'Go back and select more candidates',
      noneOfTheAbove: 'None of the Above (NOTA)',
      blankVote: 'Blank vote - No preference',
      noCandidatesSelected: 'No candidates selected for this zone',
      previous: 'Previous',
      candidatesSelected: 'Candidates Selected',
      seats: 'seats',
      seat: 'seat',
      phone: 'Phone',
      email: 'Email',
      region: 'Region',
      loadingCandidates: 'Loading candidates...',
      error: 'Error',
      rulesAndRegulations: 'Rules and Regulations',
      readRulesCarefully: 'Please read the following rules and regulations carefully before proceeding to vote.',
      rule1: 'You can only vote for candidates from your assigned zone.',
      rule2: 'You must select the exact number of candidates as specified for your zone.',
      rule3: 'Once you submit your vote, it cannot be changed or modified.',
      rule4: 'Your vote is confidential and secure. No one can see who you voted for.',
      rule5: 'If you do not select all required candidates, the remaining votes will be automatically counted as NOTA (None of the Above).',
      rule6: 'Any attempt to manipulate or tamper with the voting process is strictly prohibited.',
      rule7: 'By proceeding, you confirm that you have read and understood all the rules and regulations.',
      acceptAndContinue: 'I Accept and Continue',
      backToDashboard: 'Back to Dashboard',
      yuvaPankhWinners: 'Yuva Pankh Winners',
      winners: 'Winners'
    },
    gujarati: {
      title: 'યુવા પાંખ સમિતિ ચૂંટણી',
      yourZone: 'તમારો વિભાગ',
      selectUpTo: 'તમે પસંદ કરી શકો છો',
      candidates: 'ઉમેદવારો',
      candidate: 'ઉમેદવાર',
      votingInstructions: 'મતદાન સૂચનાઓ',
      instruction1: 'અહીં વિભાગવાર જ મતદાન થશે. દા.ત.(રાયગઢ વિભાગ નો સભ્ય તેજ વિભાગ ના ઉમેદવાર ને મત આપી શકશે.)',
      instruction2: 'આપ આ વિભાગ માં થી અધિક માં અધિક ૩ સભ્યો ને મત આપી શકશો.',
      instruction3: 'આપે મતદાન કર્યાં બાદ અને સબમિટ ના ટેબ પર ક્લીક કરવા પહેલા એકવાર આપના મત ની ખાતરી કરી લેશો.',
      instruction4: 'આપનો મત ગોપનીય રહેશે.',
      instruction5: 'આ સમિતિ માટે, આપ ફક્ત એકજ વાર મતદાન કરી શકશો',
      age: 'ઉંમર',
      years: 'વર્ષ',
      gender: 'લિંગ',
      zone: 'વિભાગ',
      vote: 'મત આપો',
      selected: 'પસંદ કર્યા',
      submitVote: 'મતદાન ટકાવા',
      submittingVote: 'મત સબમિટ કરી રહ્યા છીએ...',
      totalCandidatesSelected: 'કુલ પસંદ કરેલા ઉમેદવારો',
      confirmYourSelections: 'તમારી યુવા પાંખ પસંદગીઓની પુષ્ટિ કરો',
      reviewSelections: 'તમારી મતદાન પ્રક્રિયા ની સમીક્ષા',
      verifyVotes: 'બધી સમિતિઓમાં તમારા મત ની ચોકસાઈ કરો',
      backToEdit: 'સંપાદિત કરવા પાછા જાઓ',
      confirmSubmitVote: 'પુષ્ટિ કરો અને મત સબમિટ કરો',
      voteSubmittedSuccessfully: 'મત સફળતાપૂર્વક સબમિટ થયો!',
      voteRecorded: 'યુવા પાંખ સમિતિ માટે તમારો મત રેકોર્ડ કરવામાં આવ્યો છે. તમને ટૂંક સમયમાં તમારા ડેશબોર્ડ પર પુનઃદિશા આપવામાં આવશે.',
      thankYou: 'આભાર!',
      thankYouMessage: 'ચૂંટણીમાં ભાગ લેવા બદલ આભાર. તમારો મત સફળતાપૂર્વક રેકોર્ડ કરવામાં આવ્યો છે અને તે આપણા સમુદાયના ભવિષ્યને આકાર આપવામાં મદદ કરશે.',
      incompleteSelection: 'અપૂર્ણ મતદાન',
      selectedOutOf: 'તમે',
      outOf: 'માં થી',
      requiredCandidates: 'ઉમેદવાર ને મત આપેલ છે.',
      incompleteZones: 'અપૂર્ણ વિભાગો',
      selectedLabel: 'પસંદ કર્યા',
      notaWillBeAdded: 'NOTA ઉમેરવામાં આવશે',
      remainingVotesNota: 'બાકીના મતો આપમેળે "ઉપરનામાંથી કોઈ નહીં" (NOTA) તરીકે ઉમેરવામાં આવશે.',
      proceedWithNota: 'NOTA મત સાથે આગળ વધશો',
      goBackSelectMore: 'પાછળ જઈ ને અધિક ઉમેદવાર ને મત આપો',
      noneOfTheAbove: 'ઉપરનામાંથી કોઈ નહીં (NOTA)',
      blankVote: 'ખાલી મત - કોઈ પસંદગી નહીં',
      noCandidatesSelected: 'આ વિભાગ માટે કોઈ ઉમેદવારો પસંદ કર્યા નથી',
      previous: 'પાછલું',
      candidatesSelected: 'પસંદ કરેલા ઉમેદવારો',
      seats: 'બેઠકો',
      seat: 'બેઠક',
      phone: 'ફોન',
      email: 'ઇમેઇલ',
      region: 'પ્રદેશ',
      loadingCandidates: 'ઉમેદવારો લોડ કરી રહ્યા છીએ...',
      error: 'ભૂલ',
      rulesAndRegulations: 'નિયમો અને સુચનાઓ',
      readRulesCarefully: 'કૃપા કરી ને મતદાન ની પ્રક્રિયા શરૂ કરવા પહેલા અહીં જણાવેલ નિયમો અને સુચનાઓ ધ્યાન પુર્વક વાંચી લેશોજી.',
      rule1: 'તમે માત્ર તમારા વિસ્તાર નાજ ઉમેદવાર ને મત આપી શકો છો.',
      rule2: 'તમારા વિસ્તાર ના ઉમેદવાર માટે જેટલી બેઠકો (સંખ્યા) ફાળવેલ છે, તેટલી બેઠકો માટે મતદાન કરવું આવશ્યક છે.',
      rule3: 'એક વાર તમારો અમુલ્ય મત સબમીટ બટન દ્વારા ક્લીક કર્યા બાદ તેમાં કોઈ પણ પ્રકારે ફેરફાર શક્ય નથી.',
      rule4: 'આપનો મત ગોપનીય અને સુરક્ષીત રહેશે. ચુંટણી સમિતિના કોઈ પણ સભ્ય ને જાણ નહી હોય કે તમે કયાં ઉમેદવાર ને મત આપેલ છે.',
      rule5: 'જો તમે કોઈ પણ ઉમેદવાર ને મત નથી આપતા તો તેની ગણતરી NOTA માં કરવામાં આવશે. (NOTA - None Of The Above) ઉપરોક્ત સભ્ય માથી કોઈ નહી',
      rule6: 'ઓનલાઇન મત પ્રક્રિયા માં કોઈપણ ટેકનીકલ પ્રકારે ચેડા કરવા અથવા ગેરરીતિ આચરી શકાશે નહી.',
      rule7: 'આ સાથે તમે પુષ્ટિ ના ટેબ પર ક્લીક કરી સહમતી દર્શાવશોજી કે તમે નિયમો અને સુચનાઓ ધ્યાન પુર્વક વાંચેલ છે.',
      acceptAndContinue: 'હું સ્વીકારું છું અને આગળ વધું',
      backToDashboard: 'ડેશબોર્ડ પર પાછા જાઓ',
      yuvaPankhWinners: 'યુવા પાંખ વિજેતાઓ',
      winners: 'વિજેતાઓ',
      castYourVote: 'Cast your vote',
      castYourVoteGuj: 'તમારો મત આપો',
      pending: 'Pending',
      pendingGuj: 'પેન્ડિંગ'
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  // Load saved selections from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yuva-pank-selections')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSelectedCandidates(parsed)
        } catch (e) {
          console.error('Error loading saved selections:', e)
        }
      }
    }
  }, [])

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(selectedCandidates).length > 0) {
      localStorage.setItem('yuva-pank-selections', JSON.stringify(selectedCandidates))
    }
  }, [selectedCandidates])

  const fetchCandidates = async () => {
    try {
      // First, get voter's zone information
      const voterResponse = await fetch('/api/voter/me', {
        credentials: 'include' // This ensures cookies are sent
      })
      if (!voterResponse.ok) {
        setError('Failed to load voter information')
        return
      }

      const voterData = await voterResponse.json()
      setVoter(voterData.voter);
      
      // Use yuva pankh zone specifically
      const voterZone = voterData.voter.yuvaPankZone

      setVoterZone(voterZone)

      // Check if zone is completed (has winners declared)
      const completedYuvaPankhZones = ['ABDASA_LAKHPAT_NAKHATRANA', 'KUTCH', 'BHUJ_ANJAR', 'ANYA_GUJARAT', 'MUMBAI']
      const isZoneCompleted = voterZone && completedYuvaPankhZones.includes(voterZone.code)

      // If zone is completed or no zone assigned, show winners instead of voting
      if (!voterZone || isZoneCompleted) {
        // Show winners - create zones from winners data
        const winnerZones: Zone[] = Object.entries(yuvaPankhWinners).map(([zoneCode, zoneData]) => ({
          id: zoneCode,
          name: zoneData.zoneName,
          nameGujarati: zoneData.zoneNameGujarati,
          code: zoneCode,
          seats: zoneData.seats,
          candidates: zoneData.winners.map((winner, index) => ({
            id: `winner-${zoneCode}-${index}`,
            name: winner.name,
            nameGujarati: winner.nameGujarati || null,
            email: '',
            phone: '',
            region: zoneData.zoneName,
            position: 'Winner',
            photoUrl: undefined,
            photoFileKey: undefined,
            age: null,
            gender: null,
            birthDate: null
          }))
        }))
        setZones(winnerZones)
        setIsLoading(false)
        return
      }

      // Now fetch candidates for the voter's yuva pankh zone only (only for pending zones)
      const response = await fetch(`/api/elections/yuva-pank/candidates?zoneId=${voterZone.id}`, {
        credentials: 'include' // This ensures cookies are sent
      })
      if (response.ok) {
        const data = await response.json()

        if (data.candidates.length === 0) {
          setError('No candidates found in your zone')
          return
        }

        // Fisher-Yates shuffle algorithm to randomize candidates
        const shuffleArray = (array: any[]) => {
          const shuffled = [...array]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          return shuffled
        }

        // Randomize candidates before setting them
        const randomizedCandidates = shuffleArray(data.candidates)

        // Since all candidates are from the same zone, create a single zone entry
        const zone: Zone = {
          id: voterZone.id,
          name: voterZone.name,
          nameGujarati: voterZone.nameGujarati,
          code: voterZone.code,
          seats: voterZone.seats,
          candidates: randomizedCandidates
        }

        setZones([zone])
        
        // Generate photo URLs for candidates with photos (in parallel for better performance)
        const urls: Record<string, string> = {}
        const photoPromises: Promise<void>[] = []
        
        for (const candidate of randomizedCandidates) {
          if (candidate.photoFileKey) {
            const promise = (async () => {
              try {
                console.log(`🖼️ Generating photo URL for Yuva Pankh candidate ${candidate.id} (${candidate.name}) with fileKey:`, candidate.photoFileKey);
                const photoResponse = await fetch("/api/admin/view-document", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ fileKey: candidate.photoFileKey }),
                })
                
                if (photoResponse.ok) {
                  const urlData = await photoResponse.json()
                  const photoUrl = urlData.downloadUrl || urlData.url;
                  if (photoUrl) {
                    urls[candidate.id] = photoUrl;
                    console.log(`✅ Photo URL generated for Yuva Pankh candidate ${candidate.id}:`, photoUrl.substring(0, 100) + '...');
                  } else {
                    console.warn(`⚠️ No photo URL in response for candidate ${candidate.id} - Response:`, urlData);
                  }
                } else {
                  const errorText = await photoResponse.text();
                  let errorData;
                  try {
                    errorData = JSON.parse(errorText);
                  } catch {
                    errorData = { error: errorText };
                  }
                  console.error(`❌ Failed to get photo URL for candidate ${candidate.id}:`, {
                    status: photoResponse.status,
                    error: errorData.error || errorData.details || errorText,
                    fileKey: candidate.photoFileKey,
                    normalizedKey: errorData.normalizedKey,
                    originalKey: errorData.originalKey
                  });
                }
              } catch (error) {
                console.error(`❌ Error generating URL for candidate ${candidate.id}:`, error)
              }
            })()
            photoPromises.push(promise)
          } else {
            console.log(`ℹ️ No photoFileKey for Yuva Pankh candidate ${candidate.id} (${candidate.name})`);
          }
        }
        
        // Wait for all photo URLs to be generated
        await Promise.all(photoPromises)
        console.log(`📸 Generated ${Object.keys(urls).length} photo URLs out of ${photoPromises.length} Yuva Pankh candidates with photos`);
        setPhotoUrls(urls)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load candidates')
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setError('Failed to load candidates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCandidateSelect = (zoneId: string, candidateId: string, isSelected: boolean) => {
    setSelectedCandidates(prev => {
      const currentSelections = prev[zoneId] || []
      const zone = zones.find(z => z.id === zoneId)
      const maxSeats = zone?.seats || 1

      if (isSelected) {
        // Remove any NOTA votes when selecting a candidate
        const selectionsWithoutNota = currentSelections.filter(id => !id.startsWith('NOTA_'))
        
        // Add candidate if under limit
        if (selectionsWithoutNota.length < maxSeats && !selectionsWithoutNota.includes(candidateId)) {
          return {
            ...prev,
            [zoneId]: [...selectionsWithoutNota, candidateId]
          }
        }
      } else {
        // Remove candidate
        return {
          ...prev,
          [zoneId]: currentSelections.filter(id => id !== candidateId)
        }
      }
      return prev
    })
  }

  const handleSubmit = async () => {
    // Always show confirmation screen for preview before submission
    setShowConfirmation(true)
    setError('')
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    console.log('Submitting votes:', selectedCandidates)
    try {
      const response = await fetch('/api/voter/vote/yuva-pank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures cookies are sent
        body: JSON.stringify({
          votes: selectedCandidates
        })
      })

      if (response.ok) {
        // Clear saved selections after successful vote
        if (typeof window !== 'undefined') {
          localStorage.removeItem('yuva-pank-selections')
        }
        setSuccess(true)
        setTimeout(() => {
          router.push('/voter/dashboard')
        }, 3000)
      } else {
        let errorMessage = 'Failed to submit vote'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('Vote submission failed:', {
            status: response.status,
            error: errorData,
            votes: selectedCandidates
          })
        } catch (parseError) {
          const errorText = await response.text()
          console.error('Failed to parse error response:', errorText)
          errorMessage = `Server error (${response.status}): ${errorText.substring(0, 200)}`
        }
        setError(errorMessage)
      }
    } catch (error: any) {
      console.error('Error submitting vote:', error)
      setError(error?.message || 'Failed to submit vote. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelConfirmation = () => {
    // Remove all NOTA votes when going back from confirmation
    setSelectedCandidates(prev => {
      const updated: Record<string, string[]> = {}
      for (const [zoneId, selections] of Object.entries(prev)) {
        // Filter out NOTA votes, keep only actual candidate selections
        updated[zoneId] = selections.filter(id => !id.startsWith('NOTA_'))
      }
      return updated
    })
    setShowConfirmation(false)
  }

  const handleProceedWithNota = () => {
    const updatedSelections = { ...selectedCandidates }
    
    for (const zone of zones) {
      const selected = selectedCandidates[zone.id] || []
      const remainingSeats = zone.seats - selected.length
      
      if (remainingSeats > 0) {
        const notaVotes = []
        for (let i = 0; i < remainingSeats; i++) {
          notaVotes.push(`NOTA_${zone.id}_${Date.now()}_${i}`)
        }
        updatedSelections[zone.id] = [...selected, ...notaVotes]
      }
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{content[selectedLanguage].loadingCandidates}</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{content[selectedLanguage].voteSubmittedSuccessfully}</h2>
              <h3 className="text-xl font-semibold text-purple-600 mb-3">{content[selectedLanguage].thankYou}</h3>
              <p className="text-gray-600 mb-4">
                {content[selectedLanguage].voteRecorded}
              </p>
              <p className="text-gray-700 mb-4 italic">
                {content[selectedLanguage].thankYouMessage}
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showNotaWarning) {
    let totalRequiredSeats = 0
    let totalSelectedSeats = 0
    let incompleteZones = []
    
    for (const zone of zones) {
      totalRequiredSeats += zone.seats
      const selected = selectedCandidates[zone.id] || []
      totalSelectedSeats += selected.length
      
      if (selected.length < zone.seats) {
        incompleteZones.push({
          name: zone.nameGujarati,
          required: zone.seats,
          selected: selected.length,
          remaining: zone.seats - selected.length
        })
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{content[selectedLanguage].incompleteSelection}</h2>
              <p className="text-gray-600 mb-6">
                {content[selectedLanguage].selectedOutOf} <strong>{totalRequiredSeats}</strong> {content[selectedLanguage].outOf} <strong>{totalSelectedSeats}</strong> {content[selectedLanguage].requiredCandidates}
              </p>
              <p className="text-gray-600 mb-6">
                {content[selectedLanguage].remainingVotesNota}
              </p>
              <div className="space-y-3">
                <Button onClick={handleProceedWithNota} className="w-full bg-green-600 hover:bg-green-700">
                  {content[selectedLanguage].proceedWithNota}
                </Button>
                <Button onClick={handleCancelNota} variant="outline" className="w-full">
                  {content[selectedLanguage].goBackSelectMore}
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
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-600">Confirm Your Vote</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">{content[selectedLanguage].confirmYourSelections}</h2>
            <p className="text-gray-600 mb-1">{content[selectedLanguage].reviewSelections}</p>
            <p className="text-gray-600">{content[selectedLanguage].verifyVotes}</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{content[selectedLanguage].error}: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Summary */}
          <div className="space-y-6">
            {zones.map((zone) => {
              const selectedCandidateIds = selectedCandidates[zone.id] || []
              const selectedCandidateList = selectedCandidateIds
                .filter(id => !id.startsWith('NOTA_'))
                .map(id => zone.candidates.find(c => c.id === id))
                .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
              const notaVotes = selectedCandidateIds.filter(id => id.startsWith('NOTA_'))
              const remainingSeats = zone.seats - selectedCandidateIds.length
              const totalNotaToShow = notaVotes.length + (remainingSeats > 0 ? remainingSeats : 0)
              
              return (
                <Card key={zone.id} className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span>{zone.nameGujarati}</span>
                      <Badge variant="outline">{zone.name}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {content[selectedLanguage].yourZone}: {selectedLanguage === 'english' ? zone.name : zone.nameGujarati} ({selectedCandidateIds.length}/{zone.seats} {content[selectedLanguage].selectedLabel})
                      {remainingSeats > 0 && (
                        <span className="text-amber-600 ml-2">({remainingSeats} {content[selectedLanguage].notaWillBeAdded})</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Regular candidates */}
                      {selectedCandidateList.map((candidate, index) => (
                        <div key={candidate.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                                {selectedLanguage === 'english' ? candidate.name : (candidate.nameGujarati || candidate.name)}
                              </h4>
                              <div className="text-xs text-gray-500 space-y-1 mt-1">
                                {candidate.phone && <p className="break-all">{content[selectedLanguage].phone}: {candidate.phone}</p>}
                                {candidate.email && <p className="break-all">{content[selectedLanguage].email}: {candidate.email}</p>}
                                {candidate.region && <p>{content[selectedLanguage].region}: {candidate.region}</p>}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 flex-shrink-0">{content[selectedLanguage].selected}</Badge>
                        </div>
                      ))}
                      
                      {/* NOTA votes (both existing and auto-added) */}
                      {Array.from({ length: totalNotaToShow }, (_, index) => (
                        <div key={`nota-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {selectedCandidateList.length + index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900">{content[selectedLanguage].noneOfTheAbove}</h4>
                              <div className="text-xs text-gray-500 mt-1">
                                <p>{content[selectedLanguage].blankVote}</p>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800 flex-shrink-0">NOTA</Badge>
                        </div>
                      ))}
                      
                      {selectedCandidateIds.length === 0 && remainingSeats === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>{content[selectedLanguage].noCandidatesSelected}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 sm:mt-8">
            <Button
              onClick={handleCancelConfirmation}
              variant="outline"
              className="flex items-center justify-center w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {content[selectedLanguage].backToEdit}
            </Button>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {content[selectedLanguage].submittingVote}
                  </>
                ) : (
                  <>
                    <Vote className="h-5 w-5 mr-2" />
                    {content[selectedLanguage].confirmSubmitVote}
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Check if showing winners (skip rules for winners display)
  const completedYuvaPankhZones = ['ABDASA_LAKHPAT_NAKHATRANA', 'KUTCH', 'BHUJ_ANJAR', 'ANYA_GUJARAT', 'MUMBAI']
  const isZoneCompleted = voterZone && completedYuvaPankhZones.includes(voterZone.code)
  const showWinners = !voterZone || isZoneCompleted

  // Show rules and regulations page if not accepted (only for voting, not for winners)
  if (!rulesAccepted && !showWinners) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'gujarati' : 'english')}
                  className="flex-1 sm:flex-initial"
                >
                  {selectedLanguage === 'english' ? 'ગુજરાતી' : 'English'}
                </Button>
                <Link href="/voter/dashboard" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {content[selectedLanguage].backToDashboard}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-green-600" />
                {content[selectedLanguage].rulesAndRegulations}
              </CardTitle>
              <CardDescription>
                {content[selectedLanguage].readRulesCarefully}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    1
                  </div>
                  <p>{content[selectedLanguage].rule1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    2
                  </div>
                  <p>{content[selectedLanguage].rule2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    3
                  </div>
                  <p>{content[selectedLanguage].rule3}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    4
                  </div>
                  <p>{content[selectedLanguage].rule4}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    5
                  </div>
                  <p>{content[selectedLanguage].rule5}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    6
                  </div>
                  <p>{content[selectedLanguage].rule6}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    7
                  </div>
                  <p className="font-semibold text-gray-900">{content[selectedLanguage].rule7}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setRulesAccepted(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {content[selectedLanguage].acceptAndContinue}
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Logo size="md" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">SKMMMS Election 2026</h1>
                  <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'gujarati' : 'english')}
                  className="flex-1 sm:flex-initial"
                >
                  {selectedLanguage === 'english' ? 'ગુજરાતી' : 'English'}
                </Button>
                <Link href="/voter/dashboard" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {content[selectedLanguage].previous}
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)} {content[selectedLanguage].candidatesSelected}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {(() => {
            const completedYuvaPankhZones = ['ABDASA_LAKHPAT_NAKHATRANA', 'KUTCH', 'BHUJ_ANJAR', 'ANYA_GUJARAT', 'MUMBAI']
            const isZoneCompleted = voterZone && completedYuvaPankhZones.includes(voterZone.code)
            const showWinners = !voterZone || isZoneCompleted

            if (showWinners) {
              // Show winners display
              return (
                <>
                  {/* Page Title - Winners */}
                  <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full mb-4 shadow-lg">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Yuva Pankh Samiti Elections 2026-2029</h2>
                    <p className="text-xl text-gray-600 mb-4">{content[selectedLanguage].yuvaPankhWinners || 'Elected Winners - Zone Wise'}</p>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-800 font-medium">
                        {selectedLanguage === 'english' ? 'Election Completed - All winners declared' : 'ચૂંટણી પૂર્ણ - બધા વિજેતાઓ જાહેર'}
                      </p>
                    </div>
                  </div>

                  {/* Zone-wise Winners Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {zones.map((zone, zoneIndex) => {
                      const zoneColors = [
                        { bg: 'bg-gradient-to-br from-green-500 to-green-600', border: 'border-green-300', card: 'bg-green-50', text: 'text-green-700' },
                        { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', border: 'border-blue-300', card: 'bg-blue-50', text: 'text-blue-700' },
                        { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', border: 'border-purple-300', card: 'bg-purple-50', text: 'text-purple-700' },
                        { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', border: 'border-orange-300', card: 'bg-orange-50', text: 'text-orange-700' },
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
                                          <h4 className="font-bold text-gray-900 text-lg leading-tight">
                                            {selectedLanguage === 'english' ? candidate.name : (candidate.nameGujarati || candidate.name)}
                                          </h4>
                                          <Badge className={`${colors.text} bg-white border-2 ${colors.border} flex-shrink-0`}>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            {content[selectedLanguage].winners || 'Winner'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">No winners found for this zone</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )
            }

            // Show voting interface for pending zones
            return (
              <>
                {/* Page Title */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900">{content[selectedLanguage].title}</h2>
                  {voterZone && (
                    <p className="text-gray-600">
                      {content[selectedLanguage].yourZone}: <strong>{selectedLanguage === 'english' ? voterZone.name : voterZone.nameGujarati}</strong> - {content[selectedLanguage].selectUpTo} {voterZone.seats} {voterZone.seats > 1 ? content[selectedLanguage].candidates : content[selectedLanguage].candidate}
                    </p>
                  )}
                </div>

                {error && (
                  <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2 text-red-800">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{content[selectedLanguage].error}: {error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Instructions */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Vote className="h-6 w-6 text-green-600" />
                      <span>{content[selectedLanguage].votingInstructions}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>{selectedLanguage === 'english' ? '1.' : '૧.'} {content[selectedLanguage].instruction1}</p>
                      <p>{selectedLanguage === 'english' ? '2.' : '૨.'} {content[selectedLanguage].instruction2}</p>
                      <p>{selectedLanguage === 'english' ? '3.' : '૩.'} {content[selectedLanguage].instruction3}</p>
                      <p>{selectedLanguage === 'english' ? '4.' : '૪.'} {content[selectedLanguage].instruction4}</p>
                      <p>{selectedLanguage === 'english' ? '5.' : '૫.'} {content[selectedLanguage].instruction5}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Your Zone Candidates */}
                <div className="space-y-6">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{content[selectedLanguage].yourZone}: {selectedLanguage === 'english' ? zone.name : zone.nameGujarati}</span>
                    <Badge variant="outline">{zone.seats} {zone.seats > 1 ? content[selectedLanguage].seats : content[selectedLanguage].seat}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {content[selectedLanguage].selectUpTo} {zone.seats} {zone.seats > 1 ? content[selectedLanguage].candidates : content[selectedLanguage].candidate} {content[selectedLanguage].yourZone.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {zone.candidates.map((candidate) => {
                      const currentSelections = selectedCandidates[zone.id] || []
                      // Filter out NOTA votes to get actual candidate count
                      const actualCandidateSelections = currentSelections.filter(id => !id.startsWith('NOTA_'))
                      const isSelected = actualCandidateSelections.includes(candidate.id)
                      const canSelect = !isSelected && actualCandidateSelections.length < zone.seats

                      return (
                        <div 
                          key={candidate.id} 
                          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                            isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          } ${!canSelect && !isSelected ? 'opacity-50' : ''}`}
                        >
                          {/* Candidate Photo */}
                          <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                            {candidate.photoFileKey ? (
                              photoUrls[candidate.id] ? (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-200 relative">
                                  <img
                                    src={photoUrls[candidate.id]}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      const photoUrl = photoUrls[candidate.id];
                                      console.error('❌ Image failed to load for Yuva Pankh candidate:', {
                                        candidateId: candidate.id,
                                        candidateName: candidate.name,
                                        photoFileKey: candidate.photoFileKey,
                                        photoUrl: photoUrl?.substring(0, 150),
                                        imgSrc: img.src?.substring(0, 150)
                                      });
                                      const parent = img.parentElement;
                                      if (parent && parent.classList.contains('relative')) {
                                        parent.innerHTML = '<div class="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center"><svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>';
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log('✅ Image loaded successfully for Yuva Pankh candidate:', candidate.id);
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <div className="text-center">
                                    <Users className="h-8 w-8 text-blue-400 mx-auto mb-1 animate-pulse" />
                                    <p className="text-xs text-blue-600">Loading...</p>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Candidate Details - Name, Age, Gender, Zone */}
                          <div className="flex-1 space-y-1 min-w-0">
                            <h4 className="font-semibold text-base sm:text-lg text-gray-900 break-words">
                              {selectedLanguage === 'english' ? candidate.name : (candidate.nameGujarati || candidate.name)}
                            </h4>
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                              {candidate.age !== null && candidate.age !== undefined && (
                                <p className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{content[selectedLanguage].age}:</span>
                                  <span>{candidate.age} {content[selectedLanguage].years}</span>
                                </p>
                              )}
                              {candidate.gender && (
                                <p className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{content[selectedLanguage].gender}:</span>
                                  <span className="capitalize">{candidate.gender}</span>
                                </p>
                              )}
                              <p className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{content[selectedLanguage].zone}:</span>
                                <span className="break-words">{selectedLanguage === 'english' ? (candidate.zone?.name || candidate.region || 'N/A') : (candidate.zone?.nameGujarati || candidate.zone?.name || candidate.region || 'N/A')}</span>
                              </p>
                            </div>
                          </div>

                          {/* Vote Button */}
                          <div className="flex-shrink-0 mt-2 sm:mt-0">
                            {isSelected ? (
                              <Button
                                onClick={() => handleCandidateSelect(zone.id, candidate.id, false)}
                                variant="outline"
                                className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
                                disabled={!canSelect && !isSelected}
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                {content[selectedLanguage].selected}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleCandidateSelect(zone.id, candidate.id, true)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={!canSelect && !isSelected}
                              >
                                <Vote className="h-5 w-5 mr-2" />
                                {content[selectedLanguage].vote}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
                </div>

                {/* Submit Button */}
                <div className="mt-6 sm:mt-8 flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {content[selectedLanguage].submittingVote}
                      </>
                    ) : (
                      <>
                        <Vote className="h-5 w-5 mr-2" />
                        {content[selectedLanguage].submitVote}
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Indicator */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {content[selectedLanguage].totalCandidatesSelected}: {Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (Object.values(selectedCandidates).reduce((sum, selections) => sum + selections.length, 0) / 3) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </>
            )
          })()}
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
