'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useVoterLanguage } from '@/hooks/useVoterLanguage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Vote, Award, CheckCircle, ArrowLeft, AlertCircle, MapPin, Users, Search, X } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import CandidateProfileModal from '@/components/CandidateProfileModal'
import Footer from '@/components/Footer'

interface Trustee {
  id: string
  name: string
  nameGujarati?: string
  phone?: string
  email?: string
  region: string
  city?: string
  party?: string
  manifesto?: string
  experience?: string
  education?: string
  position?: string
  photoUrl?: string
  photoFileKey?: string
  age?: number | null
  gender?: string | null
  seat?: string | null
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
  code?: string
  seats: number
  trustees: Trustee[]
}

export default function TrusteesVotingPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedTrustees, setSelectedTrustees] = useState<Record<string, string[]>>({})
  const [zoneSearchTerms, setZoneSearchTerms] = useState<Record<string, string>>({})
  const [filteredZones, setFilteredZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [voter, setVoter] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showNotaWarning, setShowNotaWarning] = useState(false)
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<Trustee | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const { selectedLanguage, setSelectedLanguage } = useVoterLanguage()
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const searchInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const router = useRouter()

  // Language-specific content
  const content = {
    english: {
      title: 'Trustees Elections',
      loadingTrustees: 'Loading trustees...',
      voteSubmittedSuccessfully: 'Vote Submitted Successfully!',
      voteRecorded: 'Your vote for Trustees elections has been recorded. You will be redirected to your dashboard shortly.',
      thankYou: 'Thank You!',
      thankYouMessage: 'Thank you for participating in the election. Your vote has been successfully recorded and will help shape our community\'s future.',
      incompleteSelection: 'Incomplete Selection',
      selectedOutOf: 'You have selected',
      outOf: 'out of',
      requiredTrustees: 'required trustees.',
      incompleteZones: 'Incomplete zones',
      selectedLabel: 'selected',
      notaWillBeAdded: 'NOTA will be added',
      remainingVotesNota: 'The remaining votes will be automatically added as "None of the Above" (NOTA).',
      proceedWithNota: 'Proceed with NOTA votes',
      goBackSelectMore: 'Go back and select more trustees',
      confirmYourSelections: 'Confirm Your Trustee Selections',
      reviewSelections: 'Review Your Voting Process',
      verifyVotes: 'Verify your votes in all committees',
      backToEdit: 'Back to Edit',
      confirmSubmitVote: 'Confirm & Submit Vote',
      submittingVote: 'Submitting Vote...',
      previous: 'Previous',
      next: 'Next',
      submitVote: 'Submit Vote',
      searchPlaceholder: 'Search by name, last name, city, phone, email, or zone...',
      searchTrustees: 'Search Trustees',
      searchDescription: 'Search for trustees by first name, last name, city, phone, email, or zone to view trustees',
      pleaseSearch: 'Please search for trustees to view trustees',
      enterSearchTerm: 'Enter a first name, last name, city, phone number, email, or zone name to begin',
      candidatesFound: 'Trustees Found',
      candidate: 'Trustee',
      noTrusteesFound: 'No trustees found matching',
      tryDifferentSearch: 'Try a different search term',
      clearSearch: 'Clear Search',
      selectUpTo: 'Select up to',
      trustees: 'trustees',
      trustee: 'trustee',
      seats: 'seats',
      seat: 'seat',
      zone: 'Zone',
      yourZone: 'Your Zone',
      votingInstructions: 'Voting Instructions',
      instruction1: 'You can vote for trustees from all zones',
      instruction2: 'Select up to',
      instruction3: 'Review your choices carefully before submitting',
      instruction4: 'You can only vote once in this election',
      instruction5: 'Your vote is confidential and secure',
      age: 'Age',
      years: 'years',
      gender: 'Gender',
      phone: 'Phone',
      email: 'Email',
      region: 'Region',
      vote: 'Vote',
      selected: 'Selected',
      unselect: 'Unselect',
      totalTrusteesSelected: 'Total trustees selected',
      noneOfTheAbove: 'None of the Above (NOTA)',
      blankVote: 'Blank vote - No preference',
      noTrusteesSelected: 'No trustees selected for this zone',
      error: 'Error',
      step: 'Step',
      of: 'of',
      rulesAndRegulations: 'Rules and Regulations - Trust Mandal Elections',
      readRulesCarefully: 'Please read the following rules and regulations carefully before proceeding to vote.',
      rule1: 'Only members who are 18 years or older as of 31.08.2025 will have the right to vote in our society.',
      rule2: 'Our society is a democratic society, and today\'s young generation is adopting this digital age. All members are requested to fulfill their voting duty through online method.',
      rule3: 'The outline for organizing elections through online medium will be announced separately in a media. That media and other necessary information will be published in our society\'s WhatsApp app community.',
      rule4: 'Voters can vote for appropriate candidates as trustees in each zone according to the allocated seats. Only members who are 45 years or older as of 31.08.2025 can be voted as members of the Trust Mandal.',
      rule5: 'The management has a request to all members that they adopt the online method for voting in elections.',
      rule6: 'The method of voting by postal ballot will be announced separately if necessary and subject to circumstances.',
      rule7: 'The right to take decisions in any circumstances or situations will remain with the election management, which will be final and binding on all.',
      rule8: 'By proceeding, you confirm that you have read and understood all the rules and regulations.',
      electionManagers: 'Election Commissioner',
      electionManagerEmail: 'Election Management Email ID',
      zoneSeatAllocation: 'Zone-wise Seat Allocation',
      totalSeats: 'Total Seats: 07',
      acceptAndContinue: 'I Accept and Continue',
      backToDashboard: 'Back to Dashboard'
    },
    gujarati: {
      title: 'ટ્રસ્ટી ચૂંટણી',
      loadingTrustees: 'પૃષ્ઠ લોડ થઈ રહ્યું છે...',
      voteSubmittedSuccessfully: 'મત સફળતાપૂર્વક સબમિટ થયો!',
      voteRecorded: 'ટ્રસ્ટી ચૂંટણી માટે તમારો મત રેકોર્ડ કરવામાં આવ્યો છે. તમને ટૂંક સમયમાં તમારા ડેશબોર્ડ પર પુનઃદિશા આપવામાં આવશે.',
      thankYou: 'આભાર!',
      thankYouMessage: 'ચૂંટણીમાં ભાગ લેવા બદલ આભાર. તમારો મત સફળતાપૂર્વક રેકોર્ડ કરવામાં આવ્યો છે અને તે આપણા સમુદાયના ભવિષ્યને આકાર આપવામાં મદદ કરશે.',
      incompleteSelection: 'અપૂર્ણ પસંદગી',
      selectedOutOf: 'તમે પસંદ કર્યા છે',
      outOf: 'માંથી',
      requiredTrustees: 'જરૂરી ટ્રસ્ટીઓ.',
      incompleteZones: 'અપૂર્ણ વિભાગો',
      selectedLabel: 'પસંદ કર્યા',
      notaWillBeAdded: 'NOTA ઉમેરવામાં આવશે',
      remainingVotesNota: 'બાકીના મતો આપમેળે "ઉપરનામાંથી કોઈ નહીં" (NOTA) તરીકે ઉમેરવામાં આવશે.',
      proceedWithNota: 'NOTA મતો સાથે આગળ વધો',
      goBackSelectMore: 'પાછા જાઓ અને વધુ ટ્રસ્ટીઓ પસંદ કરો',
      confirmYourSelections: 'તમારી ટ્રસ્ટી પસંદગીઓની પુષ્ટિ કરો',
      reviewSelections: 'તમારી મતદાન પ્રક્રિયા ની સમીક્ષા',
      verifyVotes: 'બધી સમિતિઓમાં તમારા મત ની ચોકસાઈ કરો',
      backToEdit: 'સંપાદિત કરવા પાછા જાઓ',
      confirmSubmitVote: 'પુષ્ટિ કરો અને મત સબમિટ કરો',
      submittingVote: 'મત સબમિટ કરી રહ્યા છીએ...',
      previous: 'પાછલું',
      next: 'આગળ',
      submitVote: 'મતદાન ટકાવા',
      searchPlaceholder: 'નામ, અટક, શહેર, ફોન, ઇમેઇલ અથવા વિભાગ દ્વારા શોધો...',
      searchTrustees: 'ટ્રસ્ટીઓ શોધો',
      searchDescription: 'પ્રથમ નામ, અટક, શહેર, ફોન, ઇમેઇલ અથવા વિભાગ દ્વારા ટ્રસ્ટીઓ શોધો',
      pleaseSearch: 'કૃપા કરીને ટ્રસ્ટીઓ જોવા માટે શોધો',
      enterSearchTerm: 'શરૂ કરવા માટે પ્રથમ નામ, અટક, શહેર, ફોન નંબર, ઇમેઇલ અથવા વિભાગનું નામ દાખલ કરો',
      candidatesFound: 'મળેલા ટ્રસ્ટીઓ',
      candidate: 'ટ્રસ્ટી',
      noTrusteesFound: 'કોઈ ટ્રસ્ટીઓ મળ્યા નથી',
      tryDifferentSearch: 'વિવિધ શોધ શબ્દ અજમાવો',
      clearSearch: 'શોધ સાફ કરો',
      selectUpTo: 'તમે પસંદ કરી શકો છો',
      trustees: 'ટ્રસ્ટીઓ',
      trustee: 'ટ્રસ્ટી',
      seats: 'બેઠકો',
      seat: 'બેઠક',
      zone: 'વિભાગ',
      yourZone: 'તમારો વિભાગ',
      votingInstructions: 'મતદાન સૂચનાઓ',
      instruction1: 'તમે બધા વિભાગોના ટ્રસ્ટીઓને મત આપી શકો છો',
      instruction2: 'તમે પસંદ કરી શકો છો',
      instruction3: 'સબમિટ કરતા પહેલા તમારી પસંદગીની કાળજીપૂર્વક સમીક્ષા કરો',
      instruction4: 'તમે આ ચૂંટણીમાં માત્ર એક વાર મત આપી શકો છો',
      instruction5: 'તમારો મત ગુપ્ત અને સુરક્ષિત છે',
      age: 'ઉંમર',
      years: 'વર્ષ',
      gender: 'લિંગ',
      phone: 'ફોન',
      email: 'ઇમેઇલ',
      region: 'પ્રદેશ',
      vote: 'મત આપો',
      selected: 'પસંદ કર્યા',
      unselect: 'પસંદગી રદ કરો',
      totalTrusteesSelected: 'કુલ પસંદ કરેલા ટ્રસ્ટીઓ',
      noneOfTheAbove: 'ઉપરનામાંથી કોઈ નહીં (NOTA)',
      blankVote: 'ખાલી મત - કોઈ પસંદગી નહીં',
      noTrusteesSelected: 'આ વિભાગ માટે કોઈ ટ્રસ્ટીઓ પસંદ કર્યા નથી',
      error: 'ભૂલ',
      step: 'પગલું',
      of: 'માંથી',
      rulesAndRegulations: 'નિયમો અને સૂચનાઓ',
      readRulesCarefully: 'કૃપા કરીને મતદાન કરવા માટે આગળ વધતા પહેલા નીચેના નિયમો અને નિયમનો કાળજીપૂર્વક વાંચો.',
      rule1: 'ફક્ત ૩૧.૦૮.૨૦૨૫ સુધી ૧૮ વર્ષ કે તેથી વધુ ઉંમરના આપણા સમાજના સભ્યોને મતદાન કરવાનો અધિકાર રહેશે.',
      rule2: 'આપણો સમાજ એક લોકશાહી સમાજ છે, અને આજની યુવા પેઢી આ ડિજિટલ યુગમાં સર્વજ્ઞાનિજનોને મર્નુંઈ કે ઓનલાઈન પદ્ધતિ અપનાવી પોતાના મતદાનની નૈતિક ફરજ મનભાવશોજી.',
      rule3: 'ઓનલાઇન માધ્યમથી ચૂંટણી આયોજન કરવાની રૂપરેખા અલગ થી એક મીડિયામાં જણાવવામાં આવશે. જે મીડિયા અને અન્ય જરૂરી માહિતીઓ સહિત આપણા જ્ઞામિના વોટ્સએપ એપ કમ્યુનિટીમાં પ્રસાદરિત કરવામાં આવશે.',
      rule4: 'મતદાતા દરેક ઝોનમાં ફાળવેલ બેઠક પ્રમાણે યોગ્ય ઉમેદવારને ટ્રસ્ટી તરીકે મત આપી શકશે. ફક્ત ૩૧.૦૮.૨૦૨૫ સુધી ઉંમર ઓછામાં ઓછા ૪૫ વર્ષ કરેલ સભ્યને જ ટ્રસ્ટ મંડળના સભ્ય તરીકે મત આપી શકાશે.',
      rule5: 'મર્દેશમાં સર્વજ્ઞામિજનોને આગ્રહ છે કે ચૂંટણીમાં મત આપવા ઓનલાઇન પધ્ધતિ અપનાવે.',
      rule6: 'મિપત્રક દ્વારા મત આપવાનો મર્કલ્પ જરૂરિયાત મુજબ અને સંજોગોને આધીન જાહેર કરવામાં આવશે.',
      rule7: 'કોઈ પણ પરિસ્થિતિ થી લોકડહિમાં મનણવય લેવાનો અધિકાર ચુંટણી નિયામક પાસે રહેશે જે આખરી અને સર્વને બંધનકારક રહેશે.',
      rule8: 'આગળ વધીને, તમે પુષ્ટિ કરો છો કે તમે બધા નિયમો અને નિયમનો વાંચ્યા છે અને સમજ્યા છે.',
      electionManagers: 'ચૂંટણી નિયામક',
      electionManagerEmail: 'ચુંટણી નિયામક ઈ-મેલ આયડી',
      zoneSeatAllocation: 'ટ્રસ્ટ મંડળ બેઠક ફાળવણી વિભાગ (કુલ બેઠક – ૦૭)',
      totalSeats: 'કુલ બેઠક: ૦૭',
      acceptAndContinue: 'હું સ્વીકારું છું અને આગળ વધું',
      backToDashboard: 'ડેશબોર્ડ પર પાછા જાઓ'
    }
  }

  useEffect(() => {
    fetchTrustees()
  }, [])

  // Load saved selections from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trustees-selections')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSelectedTrustees(parsed)
        } catch (e) {
          console.error('Error loading saved selections:', e)
        }
      }
    }
  }, [])

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(selectedTrustees).length > 0) {
      localStorage.setItem('trustees-selections', JSON.stringify(selectedTrustees))
    }
  }, [selectedTrustees])

  const fetchTrustees = async () => {
    setIsLoading(true);
    setError(''); // Clear previous errors at the start

    try {
      // 1. Fetch the current voter's information
      const voterResponse = await fetch('/api/voter/me');
      if (!voterResponse.ok) {
        throw new Error('Failed to load your voter information.');
      }
      const voterData = await voterResponse.json();
      const currentUser = voterData.voter;
      setVoter(currentUser);

      // 2. Fetch ALL trustees from ALL zones (all voters can vote for candidates from all zones)
      const response = await fetch('/api/trustees');
      if (!response.ok) {
        throw new Error('Failed to load the list of trustees.');
      }
      const data = await response.json();

      // 3. Group all trustees by zone (deduplicate by ID)
      const zoneMap: Record<string, Zone> = {};
      const seenTrusteeIds = new Set<string>();
      
      data.trustees.forEach((trustee: Trustee) => {
        // Skip duplicates
        if (seenTrusteeIds.has(trustee.id)) {
          console.log(`Skipping duplicate trustee: ${trustee.id} - ${trustee.name}`);
          return;
        }
        
        seenTrusteeIds.add(trustee.id);
        
        if (!zoneMap[trustee.zone.id]) {
          zoneMap[trustee.zone.id] = {
            id: trustee.zone.id,
            name: trustee.zone.name || 'Unknown Zone',
            nameGujarati: trustee.zone.nameGujarati || 'Unknown Zone',
            code: trustee.zone.code || '',
            seats: trustee.zone.seats || 1,
            trustees: [],
          };
        }
        zoneMap[trustee.zone.id].trustees.push(trustee);
      });

      // Sort zones by name for consistent ordering
      const sortedZones = Object.values(zoneMap).sort((a, b) => a.name.localeCompare(b.name));
      
      setZones(sortedZones);
      setFilteredZones(sortedZones);
      
      // Generate photo URLs for trustees with photos (if they have photoFileKey in future)
      // For now, trustees are voters and may not have photos yet
      const urls: Record<string, string> = {}
      // Photo URLs will be generated if photoFileKey is added to trustees in the future
      setPhotoUrls(urls)

    } catch (error: any) {
      // A single catch block to handle all potential errors
      console.error('Error fetching data:', error);
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrusteeSelect = (zoneId: string, trusteeId: string) => {
    const currentZone = selectedTrustees[zoneId] || []
    const selectionsWithoutNota = currentZone.filter(id => !id.startsWith('NOTA_'))
    const zone = zones.find(z => z.id === zoneId)
    const maxSeats = zone?.seats || 1

    let nextSelections = selectionsWithoutNota
    let shouldClearSearch = false

    if (selectionsWithoutNota.includes(trusteeId)) {
      nextSelections = selectionsWithoutNota.filter(id => id !== trusteeId)
    } else if (maxSeats === 1) {
      nextSelections = [trusteeId]
      shouldClearSearch = true
    } else if (selectionsWithoutNota.length < maxSeats) {
      nextSelections = [...selectionsWithoutNota, trusteeId]
      shouldClearSearch = true
    } else {
      nextSelections = [trusteeId, ...selectionsWithoutNota.slice(1)]
      shouldClearSearch = true
    }

    setSelectedTrustees(prev => ({
      ...prev,
      [zoneId]: nextSelections
    }))

    if (shouldClearSearch) {
      setZoneSearchTerms(prev => ({
        ...prev,
        [zoneId]: ''
      }))
      if (searchInputRefs.current[zoneId]) {
        searchInputRefs.current[zoneId]?.blur()
      }
    }
  }

  // Enhanced search function with initials and priority matching
  const getTrusteeMatchPriority = (trustee: Trustee, searchTerm: string): { match: boolean; priority: number } => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { match: true, priority: 999 }
    }

    const searchLower = searchTerm.toLowerCase().trim()
    const searchUpper = searchTerm.toUpperCase().trim()
    const nameLower = trustee.name.toLowerCase()
    const nameParts = trustee.name.split(/\s+/).filter(part => part.length > 0)
    
    // Check if search looks like initials (2-4 uppercase letters, no spaces)
    const isInitialsSearch = /^[A-Z]{2,4}$/i.test(searchTerm.trim()) && searchTerm.trim().length >= 2
    
    // 1. Check initials match (highest priority - 0)
    if (isInitialsSearch && nameParts.length >= 2) {
      const nameInitials = nameParts
        .map(part => part.charAt(0).toUpperCase())
        .join('')
      
      if (searchUpper === nameInitials || nameInitials.startsWith(searchUpper)) {
        return { match: true, priority: 0 }
      }
    }
    
    // 2. Check first name match (priority 1)
    const firstName = nameParts[0]?.toLowerCase() || ''
    if (firstName === searchLower || firstName.startsWith(searchLower) || searchLower.startsWith(firstName)) {
      return { match: true, priority: 1 }
    }
    
    // 3. Check middle name match (priority 2)
    if (nameParts.length > 2) {
      for (let i = 1; i < nameParts.length - 1; i++) {
        const middleName = nameParts[i]?.toLowerCase() || ''
        if (middleName === searchLower || middleName.startsWith(searchLower) || searchLower.startsWith(middleName)) {
      return { match: true, priority: 2 }
        }
      }
    }
    
    // 4. Check last name match (priority 3) - improved to handle multiple word last names
    const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || ''
    if (lastName === searchLower || lastName.startsWith(searchLower) || searchLower.startsWith(lastName)) {
      return { match: true, priority: 3 }
    }
    
    // 4b. Check if search term matches any part of the last name (for compound last names)
    if (nameParts.length > 1) {
      const lastTwoParts = nameParts.slice(-2).map(p => p.toLowerCase()).join(' ')
      if (lastTwoParts.includes(searchLower) || searchLower.includes(lastTwoParts)) {
        return { match: true, priority: 3 }
      }
    }
    
    // 5. Check other matches (name contains, phone, email, city, region, seat, etc.) (priority 4)
    if (
      nameLower.includes(searchLower) ||
      (trustee.nameGujarati && trustee.nameGujarati.toLowerCase().includes(searchLower)) ||
      (trustee.phone && trustee.phone.includes(searchTerm)) ||
      (trustee.email && trustee.email.toLowerCase().includes(searchLower)) ||
      (trustee.city && trustee.city.toLowerCase().includes(searchLower)) ||
      (trustee.region && trustee.region.toLowerCase().includes(searchLower)) ||
      (trustee.seat && trustee.seat.toLowerCase().includes(searchLower))
    ) {
      return { match: true, priority: 4 }
    }
    
    return { match: false, priority: 999 }
  }

  // Filter zones and trustees based on zone-specific search terms
  // Only show candidates when there's an active search
  useEffect(() => {
    const filtered = zones.map(zone => {
      const zoneSearch = zoneSearchTerms[zone.id] || ''
      
      // If no search term for this zone, show empty trustees
      if (!zoneSearch || zoneSearch.trim().length === 0) {
        return { ...zone, trustees: [] }
      }

      // Get all trustees with match info
      const trusteesWithPriority = zone.trustees.map(trustee => ({
        trustee,
        ...getTrusteeMatchPriority(trustee, zoneSearch)
      }))

      // Filter and sort by priority
      const filteredTrustees = trusteesWithPriority
        .filter(item => item.match)
        .sort((a, b) => {
          // Sort by priority first
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }
          // If same priority, sort alphabetically
          return a.trustee.name.localeCompare(b.trustee.name)
        })
        .map(item => item.trustee)

      return { ...zone, trustees: filteredTrustees }
    })

    // Show all zones, but only show trustees when search is active
    setFilteredZones(filtered)
  }, [zoneSearchTerms, zones])

  const handleZoneSearch = (zoneId: string, value: string) => {
    setZoneSearchTerms(prev => ({
      ...prev,
      [zoneId]: value
    }))
  }

  const handleSubmit = async () => {
    // Always show confirmation screen for preview before submission
    setShowConfirmation(true)
    setError('')
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Ensure all zones have the required number of votes (add NOTA for missing seats)
      const completeSelections = { ...selectedTrustees }
      for (const zone of zones) {
        const selected = completeSelections[zone.id] || []
        const remainingSeats = zone.seats - selected.length
        
        if (remainingSeats > 0) {
          // Add NOTA votes for remaining seats
          const notaVotes = []
          for (let i = 0; i < remainingSeats; i++) {
            notaVotes.push(`NOTA_${zone.id}_${Date.now()}_${i}`)
          }
          completeSelections[zone.id] = [...selected, ...notaVotes]
        }
      }

      // Flatten the selections for API submission
      const flattenedVotes: Record<string, string> = {}
      for (const [zoneId, trusteeIds] of Object.entries(completeSelections)) {
        trusteeIds.forEach((trusteeId, index) => {
          flattenedVotes[`${zoneId}_${index}`] = trusteeId
        })
      }

      const response = await fetch('/api/voter/vote/trustees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          votes: flattenedVotes
        })
      })

      if (response.ok) {
        // Clear saved selections after successful vote
        if (typeof window !== 'undefined') {
          localStorage.removeItem('trustees-selections')
        }
        setSuccess(true)
        setTimeout(() => {
          router.push('/voter/dashboard')
        }, 3000)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to submit vote'
        setError(errorMessage)
        
        // If the error indicates trustees are no longer available, refresh the data
        if (errorMessage.includes('no longer available') || errorMessage.includes('does not belong')) {
          // Clear selections and refresh trustee data
          setSelectedTrustees({})
          if (typeof window !== 'undefined') {
            localStorage.removeItem('trustees-selections')
          }
          // Refresh the trustee data
          setTimeout(() => {
            fetchTrustees()
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      setError('Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelConfirmation = () => {
    // Remove all NOTA votes when going back from confirmation
    setSelectedTrustees(prev => {
      const updated: Record<string, string[]> = {}
      for (const [zoneId, selections] of Object.entries(prev)) {
        // Filter out NOTA votes, keep only actual trustee selections
        updated[zoneId] = selections.filter(id => !id.startsWith('NOTA_'))
      }
      return updated
    })
    setShowConfirmation(false)
  }

  const handleProceedWithNota = () => {
    const updatedSelections = { ...selectedTrustees }
    
    for (const zone of zones) {
      const selected = selectedTrustees[zone.id] || []
      const remainingSeats = zone.seats - selected.length
      
      if (remainingSeats > 0) {
        const notaVotes = []
        for (let i = 0; i < remainingSeats; i++) {
          notaVotes.push(`NOTA_${zone.id}_${Date.now()}_${i}`)
        }
        updatedSelections[zone.id] = [...selected, ...notaVotes]
      }
    }

    setSelectedTrustees(updatedSelections)
    setShowNotaWarning(false)
    setShowConfirmation(true)
  }

  const handleCancelNota = () => {
    setShowNotaWarning(false)
  }

  const handleViewProfile = (trustee: Trustee) => {
    setSelectedCandidateProfile(trustee)
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{content[selectedLanguage].loadingTrustees}</p>
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
      const selected = selectedTrustees[zone.id] || []
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
              <p className="text-gray-600 mb-4">
                {content[selectedLanguage].selectedOutOf} <strong>{totalSelectedSeats}</strong> {content[selectedLanguage].outOf} <strong>{totalRequiredSeats}</strong> {content[selectedLanguage].requiredTrustees}
              </p>
              <div className="text-left mb-6">
                <p className="text-sm text-gray-600 mb-2">{content[selectedLanguage].incompleteZones}:</p>
                {incompleteZones.map((zone, index) => (
                  <p key={index} className="text-sm text-gray-500">
                    • {zone.name}: {zone.selected}/{zone.required} {content[selectedLanguage].selectedLabel} ({zone.remaining} {content[selectedLanguage].notaWillBeAdded})
                  </p>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                {content[selectedLanguage].remainingVotesNota}
              </p>
              <div className="space-y-3">
                <Button onClick={handleProceedWithNota} className="w-full bg-purple-600 hover:bg-purple-700">
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
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
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
              const selectedTrusteeIds = selectedTrustees[zone.id] || []
              const selectedTrusteeList = selectedTrusteeIds
                .filter(id => !id.startsWith('NOTA_'))
                .map(id => zone.trustees.find(t => t.id === id))
                .filter((trustee): trustee is NonNullable<typeof trustee> => Boolean(trustee))
              const notaVotes = selectedTrusteeIds.filter(id => id.startsWith('NOTA_'))
              const remainingSeats = zone.seats - selectedTrusteeIds.length
              const totalNotaToShow = notaVotes.length + (remainingSeats > 0 ? remainingSeats : 0)
              
              return (
                <Card key={zone.id} className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span>{selectedLanguage === 'english' ? zone.name : zone.nameGujarati}</span>
                      <Badge variant="outline">{zone.seats} {zone.seats > 1 ? content[selectedLanguage].seats : content[selectedLanguage].seat}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {content[selectedLanguage].yourZone}: {selectedLanguage === 'english' ? zone.name : zone.nameGujarati} ({selectedTrusteeIds.length}/{zone.seats} {content[selectedLanguage].selectedLabel})
                      {remainingSeats > 0 && (
                        <span className="text-amber-600 ml-2">({remainingSeats} {content[selectedLanguage].notaWillBeAdded})</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Regular trustees */}
                      {selectedTrusteeList.map((trustee, index) => (
                        <div key={trustee.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                                {selectedLanguage === 'english' ? trustee.name : (trustee.nameGujarati || trustee.name)}
                              </h4>
                              <div className="text-xs text-gray-500 space-y-1 mt-1">
                                {trustee.phone && <p className="break-all">{content[selectedLanguage].phone}: {trustee.phone}</p>}
                                {trustee.email && <p className="break-all">{content[selectedLanguage].email}: {trustee.email}</p>}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800 flex-shrink-0">{content[selectedLanguage].selected}</Badge>
                        </div>
                      ))}
                      
                      {/* NOTA votes (both existing and auto-added) */}
                      {Array.from({ length: totalNotaToShow }, (_, index) => (
                        <div key={`nota-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {selectedTrusteeList.length + index + 1}
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
                      
                      {selectedTrusteeIds.length === 0 && remainingSeats === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>{content[selectedLanguage].noTrusteesSelected}</p>
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-3 w-full sm:w-auto"
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

  // Show rules and regulations page if not accepted
  if (!rulesAccepted) {
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
                <Award className="h-6 w-6 text-purple-600" />
                {content[selectedLanguage].rulesAndRegulations}
              </CardTitle>
              <CardDescription>
                {content[selectedLanguage].readRulesCarefully}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    1
                  </div>
                  <p>{content[selectedLanguage].rule1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    2
                  </div>
                  <p>{content[selectedLanguage].rule2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    3
                  </div>
                  <p>{content[selectedLanguage].rule3}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    4
                  </div>
                  <p>{content[selectedLanguage].rule4}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    5
                  </div>
                  <p>{content[selectedLanguage].rule5}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    6
                  </div>
                  <p>{content[selectedLanguage].rule6}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    7
                  </div>
                  <p>{content[selectedLanguage].rule7}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    8
                  </div>
                  <p className="font-semibold text-gray-900">{content[selectedLanguage].rule8}</p>
                </div>
              </div>

              {/* Election Managers Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{content[selectedLanguage].electionManagers}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Mukeshbhai Ravjibhai Navdhare</strong></p>
                  <p><strong>Deepakbhai Muljibhai Bhutada</strong></p>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-700">
                    <strong>{content[selectedLanguage].electionManagerEmail}:</strong> kmselec2026@gmail.com
                  </p>
                </div>
              </div>

              {/* Zone-wise Seat Allocation */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{content[selectedLanguage].zoneSeatAllocation}</h3>
                <div className="space-y-2 text-sm overflow-x-auto">
                  <div className="grid grid-cols-3 gap-2 font-semibold text-gray-900 pb-2 border-b min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">{selectedLanguage === 'english' ? 'Zone' : 'ઝોન'}</div>
                    <div className="text-xs sm:text-sm">{selectedLanguage === 'english' ? 'Seats' : 'બેઠક'}</div>
                    <div className="text-xs sm:text-sm">{selectedLanguage === 'english' ? 'Areas Covered' : 'ક્ષેત્રો'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-700 min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">01 {selectedLanguage === 'english' ? 'Raigad' : 'રાયગઢ'}</div>
                    <div className="text-xs sm:text-sm">01</div>
                    <div className="text-xs">{selectedLanguage === 'english' ? 'Raigad (Kharghar included), Pune, Ratnagiri, Kolhapur, Sangli, Satara (All districts)' : 'રાયગઢ(ખારઘર સહિત),પુણે,રત્નાગીરી,કોલ્હાપુર,સાંગલી,સાતારા (સર્વ જિલ્લા)'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-700 min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">02 {selectedLanguage === 'english' ? 'Mumbai' : 'મુંબઈ'}</div>
                    <div className="text-xs sm:text-sm">02</div>
                    <div className="text-xs">{selectedLanguage === 'english' ? 'Mumbai, Thane district, Navi Mumbai, Nashik, Ahmednagar district, Nagpur, Chandrapur, Madhya Pradesh, Rajasthan, West Bengal, Odisha, Haryana, Overseas area, and entire country' : 'મુંબઈ,થાણા જિલ્લો,નવી મુંબઈ,નાસિક,અહેમદનગર જિલ્લો,નાગપુર,ચંદ્રપુર,મધ્યપ્રદેશ,રાજસ્થાન,પશ્ચિમ બંગાળ,ઓડિશા,હરિયાણા,વિદેશ વિસ્તાર,અને સમગ્ર દેશ'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-700 min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">03 {selectedLanguage === 'english' ? 'Karnataka & Goa' : 'કર્ણાટક,ગોવા'}</div>
                    <div className="text-xs sm:text-sm">01</div>
                    <div className="text-xs">{selectedLanguage === 'english' ? 'Karnataka and Goa states' : 'કર્ણાટક અને ગોવા રાજ્ય'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-700 min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">04 {selectedLanguage === 'english' ? 'Abdasa and Garda' : 'અબડાસા અને ગરડા'}</div>
                    <div className="text-xs sm:text-sm">01</div>
                    <div className="text-xs">{selectedLanguage === 'english' ? 'Abdasa, Garda, Lakhpat, Nakhatrana taluka all villages' : 'અબડાસા, ગરડા,લખપત, નખત્રાણા તાલુકાના તમામ ગામો'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-700 min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">05 {selectedLanguage === 'english' ? 'Bhuj' : 'ભુજ'}</div>
                    <div className="text-xs sm:text-sm">01</div>
                    <div className="text-xs">{selectedLanguage === 'english' ? 'Bhuj, Mirzapar, Madhapar (taluka - Bhuj)' : 'ભુજ,મીરઝાવપર,માધાપર (તાલુકો-ભુજ)'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-700 min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">06 {selectedLanguage === 'english' ? 'Anjar & Anya Gujarat' : 'અંજાર અન્ય ગુજરાત'}</div>
                    <div className="text-xs sm:text-sm">01</div>
                    <div className="text-xs">{selectedLanguage === 'english' ? 'Ahmedabad, Valsad, Surat, Sachin, Vadodara, Ankleshwar, Anand, Mehsana, Bharuch, Dahegam, Kapadvanj, Jamnagar, Morbi, Rajkot, Anjar, Adipur, Mandvi, Mundra, Gandhidham taluka villages' : 'અમદાવાદ,વલસાડ,સુરત,સચીન,વડોદરા,આણંદ,મહેસાણા,ભરૂચ,દહેગામ, કપડવંજ, જામનગર અને મોરબી, અંજાર,આડિપુર,માંડવી,મુંદ્રા,ગાંધીધામ તાલુકાના ગામો'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-semibold text-gray-900 pt-2 border-t min-w-[500px] sm:min-w-0">
                    <div className="text-xs sm:text-sm">{selectedLanguage === 'english' ? 'Total' : 'કુલ'}</div>
                    <div className="text-xs sm:text-sm">07</div>
                    <div></div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setRulesAccepted(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
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
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {Object.keys(selectedTrustees).length}/{zones.length} {content[selectedLanguage].zone}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{content[selectedLanguage].title}</h2>
            <p className="text-gray-600">
              {content[selectedLanguage].selectUpTo} {zones.reduce((total, zone) => total + zone.seats, 0)} {content[selectedLanguage].trustees} {content[selectedLanguage].selectedLabel}
            </p>
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

          {/* Vertical Steps Indicator */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{content[selectedLanguage].totalTrusteesSelected}</h3>
                <span className="text-sm text-gray-600">
                  {Object.values(selectedTrustees).reduce((total, selections) => total + selections.length, 0)} {content[selectedLanguage].of} {zones.reduce((total, zone) => total + zone.seats, 0)} {content[selectedLanguage].selectedLabel}
                </span>
              </div>
              
              {/* Vertical Step indicators */}
              <div className="flex flex-col space-y-2">
                {zones.map((zone, index) => {
                  const selectedCount = selectedTrustees[zone.id]?.length || 0
                  const isComplete = selectedCount === zone.seats
                  const isInProgress = selectedCount > 0 && selectedCount < zone.seats
                  
                  return (
                    <div key={zone.id} className="flex items-center space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isComplete 
                            ? 'bg-green-500 text-white' 
                            : isInProgress 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        {index < zones.length - 1 && (
                          <div className={`w-0.5 h-8 ${
                            isComplete ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isComplete ? 'text-green-600' : isInProgress ? 'text-purple-600' : 'text-gray-600'}`}>
                          {selectedLanguage === 'english' ? zone.name : zone.nameGujarati}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedCount}/{zone.seats} {content[selectedLanguage].selectedLabel}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Zones with Tables */}
          <div className="space-y-8">
            {filteredZones.map((zone, zoneIndex) => {
              const selectedTrusteeIds = selectedTrustees[zone.id] || []
              // Find original zone to get all trustees (not just filtered ones) for selected list
              const originalZone = zones.find(z => z.id === zone.id)
              const selectedTrusteeList = selectedTrusteeIds
                .filter(id => !id.startsWith('NOTA_'))
                .map(id => originalZone?.trustees.find(t => t.id === id))
                .filter((trustee): trustee is NonNullable<typeof trustee> => Boolean(trustee))
              
              // Zone area descriptions
              const getZoneArea = (zoneCode: string) => {
                const zoneAreas: Record<string, { en: string; gu: string }> = {
                  'RAIGAD': {
                    en: 'Raigad (Kharghar included), Pune, Ratnagiri, Kolhapur, Sangli, Satara (All districts)',
                    gu: 'રાયગઢ(ખારઘર સહિત),પુણે,રત્નાગીરી,કોલ્હાપુર,સાંગલી,સાતારા (સર્વ જિલ્લા)'
                  },
                  'MUMBAI': {
                    en: 'Mumbai, Thane district, Navi Mumbai, Nashik, Ahmednagar district, Nagpur, Chandrapur, Madhya Pradesh, Rajasthan, West Bengal, Odisha, Haryana, Overseas area, and entire country',
                    gu: 'મુંબઈ,થાણા જિલ્લો,નવી મુંબઈ,નાસિક,અહેમદનગર જિલ્લો,નાગપુર,ચંદ્રપુર,મધ્યપ્રદેશ,રાજસ્થાન,પશ્ચિમ બંગાળ,ઓડિશા,હરિયાણા,વિદેશ વિસ્તાર,અને સમગ્ર દેશ'
                  },
                  'KARNATAKA_GOA': {
                    en: 'Karnataka and Goa states',
                    gu: 'કર્ણાટક અને ગોવા રાજ્ય'
                  },
                  'ABDASA_GARDA': {
                    en: 'Abdasa, Garda, Lakhpat, Nakhatrana taluka all villages',
                    gu: 'અબડાસા, ગરડા,લખપત, નખત્રાણા તાલુકાના તમામ ગામો'
                  },
                  'BHUJ': {
                    en: 'Bhuj, Mirzapar, Madhapar (taluka - Bhuj)',
                    gu: 'ભુજ,મીરઝાવપર,માધાપર (તાલુકો-ભુજ)'
                  },
                  'ANJAR_ANYA_GUJARAT': {
                    en: 'Ahmedabad, Valsad, Surat, Sachin, Vadodara, Ankleshwar, Anand, Mehsana, Bharuch, Dahegam, Kapadvanj, Jamnagar, Morbi, Rajkot, Anjar, Adipur, Mandvi, Mundra, Gandhidham taluka villages',
                    gu: 'અમદાવાદ,વલસાડ,સુરત,સચીન,વડોદરા,આણંદ,મહેસાણા,ભરૂચ,દહેગામ, કપડવંજ, જામનગર અને મોરબી, અંજાર,આડિપુર,માંડવી,મુંદ્રા,ગાંધીધામ તાલુકાના ગામો'
                  }
                }
                return zoneAreas[zoneCode] || { en: '', gu: '' }
              }
              
              const zoneArea = getZoneArea(zone.code || '')
              
              return (
                <Card key={zone.id} className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {selectedLanguage === 'english' ? `Zone ${zoneIndex + 1} - ${zone.name}` : `વિભાગ ${zoneIndex + 1} - ${zone.nameGujarati}`}
                    </CardTitle>
                    <CardDescription>
                      {zone.seats} {zone.seats > 1 ? content[selectedLanguage].seats : content[selectedLanguage].seat}
                    </CardDescription>
                    {zoneArea.en && (
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedLanguage === 'english' ? zoneArea.en : zoneArea.gu}
                      </p>
                    )}
                    {/* Zone-specific Search Bar - Moved after zone selector */}
                    <div className="mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder={`${content[selectedLanguage].searchPlaceholder} - ${selectedLanguage === 'english' ? zone.name : zone.nameGujarati}`}
                          value={zoneSearchTerms[zone.id] || ''}
                          onChange={(e) => handleZoneSearch(zone.id, e.target.value)}
                          ref={(el) => {
                            searchInputRefs.current[zone.id] = el
                          }}
                          className="pl-9 text-sm py-2"
                        />
                        {zoneSearchTerms[zone.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleZoneSearch(zone.id, '')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Table */}
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Age</th>
                            <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">City</th>
                            <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Vote</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const hasSearch = zoneSearchTerms[zone.id] && zoneSearchTerms[zone.id].trim().length > 0
                            
                            if (!hasSearch) {
                              return (
                                <tr>
                                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                      <Search className="h-8 w-8 text-gray-300 mb-2" />
                                      <p>{content[selectedLanguage].pleaseSearch}</p>
                                      <p className="text-sm mt-1">{content[selectedLanguage].enterSearchTerm}</p>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }
                            
                            if (zone.trustees.length > 0) {
                              return zone.trustees.map((trustee, index) => {
                              // Filter out NOTA votes to get actual trustee count
                              const actualTrusteeSelections = selectedTrusteeIds.filter(id => !id.startsWith('NOTA_'))
                              const isSelected = actualTrusteeSelections.includes(trustee.id)
                              // Always allow selection/unselection - users can freely change their choices
                              // Validation will happen on submit
                              const canSelect = true
                              
                              return (
                                <tr 
                                  key={trustee.id} 
                                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                                    isSelected ? 'bg-purple-50' : ''
                                  }`}
                                >
                                  <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium break-words">
                                    {selectedLanguage === 'english' ? trustee.name : (trustee.nameGujarati || trustee.name)}
                                  </td>
                                  <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">{trustee.age || '-'}</td>
                                  <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 hidden sm:table-cell">{trustee.city || trustee.region || '-'}</td>
                                  <td className="px-2 sm:px-4 py-3 text-center">
                                    {isSelected ? (
                                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                          {content[selectedLanguage].selected}
                                        </Badge>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleTrusteeSelect(zone.id, trustee.id)}
                                          className="border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600 whitespace-nowrap text-xs"
                                        >
                                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                          {content[selectedLanguage].unselect}
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => handleTrusteeSelect(zone.id, trustee.id)}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                                        disabled={!canSelect}
                                      >
                                        <Vote className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        {content[selectedLanguage].vote}
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })
                            } else {
                              const hasSearch = zoneSearchTerms[zone.id] && zoneSearchTerms[zone.id].trim().length > 0
                              return (
                                <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                      <Search className="h-8 w-8 text-gray-300 mb-2" />
                                      {hasSearch ? (
                                        <>
                                      <p>{content[selectedLanguage].noTrusteesFound} "{zoneSearchTerms[zone.id]}"</p>
                                      <p className="text-sm mt-1">{content[selectedLanguage].tryDifferentSearch}</p>
                                        </>
                                      ) : (
                                        <p>No trustees available in this zone</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Display Selected Candidates */}
                    {selectedTrusteeList.length > 0 && (
                      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-3">
                          {content[selectedLanguage].selected} {content[selectedLanguage].candidate}{selectedTrusteeList.length > 1 ? 's' : ''}:
                        </h4>
                        <div className="space-y-2">
                          {selectedTrusteeList.map((trustee, index) => {
                            // Find the zone this trustee belongs to
                            const trusteeZone = zones.find(z => z.trustees.some(t => t.id === trustee.id))
                            return (
                              <div key={trustee.id} className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {selectedLanguage === 'english' ? trustee.name : (trustee.nameGujarati || trustee.name)}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {content[selectedLanguage].seat}: {trustee.seat || '-'} | {content[selectedLanguage].age}: {trustee.age || '-'} | {content[selectedLanguage].zone}: {trustee.city || trustee.region || '-'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-purple-100 text-purple-800">
                                    {content[selectedLanguage].selected}
                                  </Badge>
                                  {trusteeZone && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTrusteeSelect(trusteeZone.id, trustee.id)}
                                      className="border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      {content[selectedLanguage].unselect}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
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
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Trustee Profile Modal */}
      <CandidateProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfile}
        candidate={selectedCandidateProfile}
      />
    </>
  )
}
