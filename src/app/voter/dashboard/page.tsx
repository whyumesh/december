'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useVoterLanguage } from '@/hooks/useVoterLanguage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Vote, Users, Building, Award, CheckCircle, Clock, MapPin, ArrowRight, LogOut, BarChart3, RefreshCw, AlertCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from '@/components/ChartsWrapper';

interface VoterData {
  id: string
  voterId: string
  name: string
  phone: string
  region?: string
  age?: number
  dob?: string | null
  zone: {
    id: string
    name: string
    nameGujarati: string
    seats: number
  } | null
  yuvaPankZone: {
    id: string
    name: string
    nameGujarati: string
    seats: number
    code?: string
    isFrozen?: boolean
  } | null
  karobariZone: {
    id: string
    name: string
    nameGujarati: string
    seats: number
    code?: string
    isFrozen?: boolean
  } | null
  trusteeZone: {
    id: string
    name: string
    nameGujarati: string
    seats: number
  } | null
  hasVoted: {
    yuvaPank: boolean
    karobariMembers: boolean
    trustees: boolean
  }
}

interface RegionTurnout {
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  zoneNameGujarati: string;
  seats: number;
  totalVoters: number;
  totalVotes: number;
  uniqueVoters?: number; // Number of unique voters who voted
  turnoutPercentage: number;
  actualVotes?: number;
  notaVotes?: number;
}

interface ElectionData {
  name: string;
  regions: RegionTurnout[];
  totalRegions: number;
  totalVoters: number;
  totalVotes: number;
}

interface ResultsData {
  karobari?: ElectionData;
  trustee: ElectionData;
  yuvaPankh: ElectionData;
  totalVotersInSystem?: number;
  timestamp: string;
}

// Helper function to calculate age as of a specific date (moved outside component to prevent redefinition)
const calculateAgeAsOf = (dob: string | null | undefined, referenceDate: Date): number | null => {
  if (!dob) return null
  
  try {
    // Handle DD/MM/YYYY format
    const parts = dob.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10)
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    
    const birthDate = new Date(year, month, day)
    if (birthDate.getDate() !== day || birthDate.getMonth() !== month || birthDate.getFullYear() !== year) {
      return null
    }
    
    let age = referenceDate.getFullYear() - birthDate.getFullYear()
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  } catch {
    return null
  }
}

export default function VoterDashboard() {
  const [voterData, setVoterData] = useState<VoterData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const { selectedLanguage, setSelectedLanguage } = useVoterLanguage()
  const router = useRouter()

  // Language-specific content
  const content = {
    english: {
      loading: 'Loading your dashboard...',
      accessDenied: 'Access Denied',
      pleaseLogin: 'Please log in to access your voter dashboard.',
      goToLogin: 'Go to Login',
      voterDashboard: 'Voter Dashboard',
      welcomeBack: 'Welcome back,',
      yourZoneInformation: 'Your Zone Information',
      yuvaPankhZone: 'Yuva Pankh Zone',
      trusteeZone: 'Trustee Zone',
      eligibleFor: 'Eligible for',
      elections: 'elections',
      election: 'election',
      zoneBasedVoting: 'Zone-based voting for each election type',
      regionalRepresentation: 'Regional representation rights',
      yuvaPankhNotAvailable: 'Yuva Pankh election is only available for voters from Karnataka & Goa or Raigad regions',
      yuvaPankhNotAvailableAge: 'Yuva Pankh election is only available for voters who are 39 years old or younger as of August 31, 2025',
      yourVotingProgress: 'Your Voting Progress',
      trackParticipation: 'Track your participation across all elections',
      electionsVoted: 'Elections Voted',
      participationRate: 'Participation Rate',
      remaining: 'Remaining',
      individualElections: 'Individual Elections',
      totalSeats: 'Total Seats:',
      regionalSeats: 'Regional Seats:',
      zone: 'Zone:',
      tenure: 'Tenure:',
      notAssigned: 'Not assigned',
      alreadyVoted: 'Already Voted',
      castYourVote: 'Cast Your Vote',
      logout: 'Logout',
      voterId: 'Voter ID:',
      yuvaPankhMembers: 'Yuva Pankh Members (6 Regions)',
      regionalParticipation: 'Regional voter participation for Yuva Pankh Members election',
      karobariMembers: 'Karobari Members (6 Regions)',
      karobariParticipation: 'Regional voter participation for Karobari Members election',
      trusteeMembers: 'Trustee Members (6 Regions)',
      trusteeParticipation: 'Regional voter participation for Trustee Members election',
      karobariZone: 'Karobari Zone',
      votingCompleted: 'Voting Completed',
      votingCompletedMessage: 'Voting for this zone has been completed. All eligible voters have cast their votes.',
      zoneVotingCompleted: 'Voting is already completed in this zone',
      zoneVotingCompletedGuj: 'આ વિભાગમાં મતદાન પહેલેથી પૂર્ણ થયું છે',
      totalRegions: 'Total Regions',
      highestTurnout: 'Highest Voter Turnout',
      averageTurnout: 'Average Turnout',
      totalVoters: 'Total Voters',
      failedToLoad: 'Failed to load election results',
      electionTitle: 'SKMMMS Election 2026',
      electionCommission: 'Election Commission : Shree Panvel Kutchi Maheshwari Mahajan',
      yuvaPankhWinners: 'Yuva Pankh Winners',
      yuvaPankhWinnersDescription: 'Elected members for completed zones',
      zoneLabel: 'Zone',
      winners: 'Winners',
      viewWinners: 'View Winners',
      viewElectedMembers: 'View Elected Members'
    },
    gujarati: {
      loading: 'તમારા ડેશબોર્ડને લોડ કરી રહ્યા છીએ...',
      accessDenied: 'પ્રવેશ નકાર્યો',
      pleaseLogin: 'કૃપા કરીને તમારા મતદાતા ડેશબોર્ડને ઍક્સેસ કરવા માટે લૉગ ઇન કરો.',
      goToLogin: 'લૉગ ઇન પર જાઓ',
      voterDashboard: 'મતદાતા ડેશબોર્ડ',
      welcomeBack: 'પાછા આવો,',
      yourZoneInformation: 'તમારા વિભાગ ની માહિતી',
      yuvaPankhZone: 'યુવા પાંખ વિભાગ',
      trusteeZone: 'ટ્રસ્ટી વિભાગ',
      eligibleFor: 'પાત્ર',
      elections: 'ચૂંટણીઓ',
      election: 'ચૂંટણી',
      zoneBasedVoting: 'દરેક ચૂંટણી પ્રકાર માટે વિભાગ-આધારિત મતદાન',
      regionalRepresentation: 'પ્રાદેશિક પ્રતિનિધિત્વ અધિકારો',
      yuvaPankhNotAvailable: 'યુવા પાંખ ચૂંટણી ફક્ત કર્ણાટક અને ગોવા અથવા રાયગઢ પ્રદેશના મતદાતાઓ માટે ઉપલબ્ધ છે',
      yuvaPankhNotAvailableAge: 'યુવા પાંખ ચૂંટણી ફક્ત 31 ઓગસ્ટ 2025 સુધી 39 વર્ષ અથવા તેનાથી ઓછી ઉંમરના મતદાતાઓ માટે ઉપલબ્ધ છે',
      yourVotingProgress: 'તમારી મતદાન પ્રગતિ',
      trackParticipation: 'બધી ચૂંટણીઓમાં તમારી ભાગીદારી ટ્રૅક કરો',
      electionsVoted: 'મત આપેલી ચૂંટણીઓ',
      participationRate: 'ભાગીદારી દર',
      remaining: 'બાકી',
      individualElections: 'વ્યક્તિગત ચૂંટણીઓ',
      totalSeats: 'કુલ બેઠકો:',
      regionalSeats: 'પ્રાદેશિક બેઠકો:',
      zone: 'વિભાગ:',
      tenure: 'કાર્યકાળ:',
      notAssigned: 'સોંપાયેલ નથી',
      alreadyVoted: 'પહેલેથી મત આપ્યો',
      castYourVote: 'તમારો મત આપો',
      logout: 'લૉગઆઉટ',
      voterId: 'મતદાતા ID:',
      yuvaPankhMembers: 'યુવા પાંખ સભ્યો (6 પ્રદેશો)',
      regionalParticipation: 'યુવા પાંખ સભ્યો ચૂંટણી માટે પ્રાદેશિક મતદાતા ભાગીદારી',
      karobariMembers: 'કારોબારી સભ્યો (6 પ્રદેશો)',
      karobariParticipation: 'કારોબારી સભ્યો ચૂંટણી માટે પ્રાદેશિક મતદાતા ભાગીદારી',
      trusteeMembers: 'ટ્રસ્ટ મંડળ (કુલ ૭ બેઠક અને ૬ વિભાગ)',
      trusteeParticipation: 'વિભાગવાર મતદાન ટકાવારી',
      karobariZone: 'કારોબારી વિભાગ',
      votingCompleted: 'સમિતિમાં મતદાન સંપન્ન',
      votingCompletedMessage: 'આ વિભાગ માટે મતદાન પૂર્ણ થયું છે. બધા પાત્ર મતદાતાઓએ મત આપ્યા છે.',
      zoneVotingCompleted: 'આ વિભાગમાં મતદાન પહેલેથી પૂર્ણ થયું છે',
      zoneVotingCompletedGuj: 'આ વિભાગમાં મતદાન પહેલેથી પૂર્ણ થયું છે',
      totalRegions: 'કુલ વિભાગ',
      highestTurnout: 'મતદાન ટકાવારી',
      averageTurnout: 'સરેરાશ મતદાન',
      totalVoters: 'કુલ મતદાતાઓ',
      failedToLoad: 'ચૂંટણી પરિણામો લોડ કરવામાં નિષ્ફળ',
      electionTitle: 'શ્રી કચ્છી માહેશ્વરી મધ્યસ્થ મહાજન સમિતિ - ચુંટણી વર્ષ ૨૦૨૬',
      electionCommission: 'ચૂંટણી નિયામક : શ્રી પનવેલ કચ્છી માહેશ્વરી મહાજન',
      yuvaPankhWinners: 'યુવા પાંખ વિજેતાઓ',
      yuvaPankhWinnersDescription: 'પૂર્ણ થયેલ વિભાગો માટે નિર્વાચિત સભ્યો',
      zoneLabel: 'વિભાગ',
      winners: 'વિજેતાઓ',
      viewWinners: 'વિજેતાઓ જુઓ',
      viewElectedMembers: 'નિર્વાચિત સભ્યો જુઓ'
    }
  }

  // Yuva Pankh Winners Data
  const yuvaPankhWinners = {
    'ABDASA_LAKHPAT_NAKHATRANA': {
      zoneName: 'Abdasa, Lakhpat and Nakhatrana',
      zoneNameGujarati: 'અબડાસા, લખપત અને નખત્રાણા',
      seats: 2,
      winners: [
        { name: 'Jigar Arvind Bhedakiya', nameGujarati: 'જીગર અરવિંદ ભેડકિયા' }
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

  useEffect(() => {
    // Check if user is logged in (only run once on mount)
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/voter/me')
        if (!isMounted) return // Prevent state updates if component unmounted
        
        if (response.ok) {
          const data = await response.json()
          if (isMounted) {
            setVoterData(data.voter)
          }
        } else {
          if (isMounted) {
            router.push('/voter/login')
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        if (isMounted) {
          router.push('/voter/login')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
    
    return () => {
      isMounted = false // Cleanup: prevent state updates after unmount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  const handleLogout = () => {
    // Clear any stored tokens/session
    localStorage.removeItem('voter-token')
    router.push('/')
  }

  const fetchResults = useCallback(async (forceRefresh = false) => {
    // Check if we have recent cached data (less than 30 seconds old)
    const cacheKey = 'election_results_cache'
    const cached = localStorage.getItem(cacheKey)
    const now = Date.now()
    
    if (!forceRefresh && cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        // Check if cached data has uniqueVoters field (new format)
        const hasNewFormat = data?.trustee?.regions?.some((r: any) => r.uniqueVoters !== undefined) ||
                             data?.yuvaPankh?.regions?.some((r: any) => r.uniqueVoters !== undefined)
        // If cache is old or doesn't have new format, refresh
        if (now - timestamp < 30000 && hasNewFormat) { // 30 seconds cache
          console.log('Using cached election results')
          setResults(data)
          return
        }
      } catch (e) {
        // Invalid cache, continue with API call
      }
    }

    setIsLoadingResults(true)
    setResultsError(null)
    try {
      const response = await fetch('/api/admin/results')
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        
        // Cache the response
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: now
        }))
      } else {
        setResultsError('Failed to load election results')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setResultsError('Failed to load election results')
      // Set empty results structure to prevent undefined errors
      setResults({
        karobari: { name: 'Karobari Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
        trustee: { name: 'Trustee Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
        yuvaPankh: { name: 'Yuva Pankh Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoadingResults(false)
    }
  }, []) // Empty dependency array - fetchResults doesn't depend on any props/state

  // Auto-load results when voterData is available (only once, prevent infinite loops)
  useEffect(() => {
    // Only fetch if we have voterData and haven't loaded results yet
    if (voterData?.id && !results && !isLoadingResults) {
      fetchResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voterData?.id]) // Only depend on voterData.id - fetchResults is stable, results/isLoadingResults checked inside

  // Helper function to check if a Yuva Pankh zone is completed dynamically based on results
  // This checks the actual turnout percentage from the results data
  // Made safe to handle null/undefined results
  const isYuvaPankhZoneCompleted = (zoneCode: string | null | undefined, zoneId: string | null | undefined): boolean => {
    if (!results?.yuvaPankh?.regions || (!zoneCode && !zoneId)) return false
    
    try {
      // Find the zone in results by code or ID and check if turnout is 100%
      const zoneResult = results.yuvaPankh.regions.find(
        r => (zoneCode && r.zoneCode === zoneCode) || (zoneId && r.zoneId === zoneId)
      )
      
      // Zone is completed if turnout is 100% or more
      return zoneResult ? (Number(zoneResult.turnoutPercentage) >= 100) : false
    } catch (error) {
      console.error('Error checking zone completion:', error)
      return false
    }
  }

  // Calculate voting progress using useMemo to prevent unnecessary recalculations
  // MUST be called before any early returns to comply with Rules of Hooks
  // Logic:
  // 1. For voters 40+ (not age-eligible for Yuva Pankh): show X/2 (Karobari + Trustee only)
  // 2. For voters with Yuva Pankh zone but not age-eligible: show X/2 (Karobari + Trustee only)
  // 3. For voters age-eligible for Yuva Pankh: show X/3 (Karobari + Yuva Pankh + Trustee)
  // 4. For Raigad/Karnataka zones: Karobari counts as done if frozen/completed (even if not voted)
  const { totalElections, totalVotes } = useMemo(() => {
    // Early return if voterData is not available
    if (!voterData) {
      return { totalElections: 0, totalVotes: 0 }
    }
    
    try {
      const voterAge = voterData.age || 0
    
      // Check age eligibility for Yuva Pankh (must be 39 or younger as of August 31, 2025)
      const dob = voterData.dob
      const cutoffDate = new Date('2025-08-31T23:59:59') // End of day cutoff for accurate age calculation
      const ageAsOfCutoff = dob ? calculateAgeAsOf(dob, cutoffDate) : null
      const isAgeEligibleForYuvaPankh = ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39
      
      // Check if voter has zones for each election type
      const hasKarobariZone = voterData.karobariZone !== null
      const hasYuvaPankhZone = voterData.yuvaPankZone !== null
      const hasTrusteeZone = voterData.trusteeZone !== null
      
      // Get Yuva Pankh zone code to check if it's Raigad or Karnataka
      const yuvaPankhZoneCode = voterData.yuvaPankZone?.code
      const isRaigadOrKarnataka = yuvaPankhZoneCode === 'RAIGAD' || yuvaPankhZoneCode === 'KARNATAKA_GOA'
      
      // Determine eligibility: voter must have zone AND meet age requirements
      const isEligibleForKarobari = hasKarobariZone
      // Only count Yuva Pankh if voter has zone AND is age-eligible
      const isEligibleForYuvaPankh = hasYuvaPankhZone && isAgeEligibleForYuvaPankh
      const isEligibleForTrustee = hasTrusteeZone && voterAge >= 18
      
      // Count total eligible elections
      // Rule 1: For Raigad/Karnataka zones: always count all 3 elections = X/3 (even if not age-eligible)
      // Rule 2: For other zones (Mumbai, etc.) with Yuva Pankh zone: always count all 3 elections = X/3 (even if not age-eligible)
      // Rule 3: For voters without Yuva Pankh zone: count only Karobari + Trustee (2 elections) = X/2
      let totalElections = 0
      if (isEligibleForKarobari) totalElections++
      
      // Count Yuva Pankh in total if voter has a zone (regardless of age eligibility)
      // This applies to both Raigad/Karnataka and other zones (Mumbai, etc.)
      if (hasYuvaPankhZone) {
        totalElections++ // Always count if voter has Yuva Pankh zone
      }
      
      if (isEligibleForTrustee) totalElections++
      
      // Count completed votes:
      // - Karobari: ALWAYS counted if voter has karobariZone (all Karobari elections are completed)
      // - Yuva Pankh: counted if voted OR if zone is completed (100% turnout) - only if age-eligible
      // - Trustee: counted only if actually voted
      let totalVotes = 0
      
      // Karobari: ALWAYS count as done if voter has karobariZone
      // All Karobari elections are completed, so having a zone means it's done
      if (isEligibleForKarobari) {
        // Always count Karobari as done since all elections are completed
        totalVotes += 1
      }
      
      // Yuva Pankh: count if voted OR if zone is completed (100% turnout)
      // For Raigad/Karnataka: only count if voted (not based on zone completion)
      // For other zones (Mumbai, etc.): count if voted OR if zone has winners (completed) - regardless of age eligibility
      if (hasYuvaPankhZone && voterData.yuvaPankZone) {
        if (isRaigadOrKarnataka) {
          // For Raigad/Karnataka: only count if voted (regardless of age eligibility)
          if (voterData.hasVoted.yuvaPank) {
            totalVotes += 1
          }
        } else {
          // For other zones (Mumbai, etc.): count if voted OR if zone has winners (completed)
          // This applies regardless of age eligibility - if zone is completed, it counts
          let zoneCompleted = false
          
          // Check if zone has winners (completed zones)
          if (yuvaPankhZoneCode && yuvaPankhZoneCode in yuvaPankhWinners) {
            zoneCompleted = true
          }
          
          // Also check dynamically if the zone is completed based on results data (turnout >= 100%)
          if (!zoneCompleted && results?.yuvaPankh?.regions) {
            try {
              zoneCompleted = isYuvaPankhZoneCompleted(
                voterData.yuvaPankZone.code, 
                voterData.yuvaPankZone.id
              )
            } catch (error) {
              console.error('Error checking zone completion in progress calc:', error)
            }
          }
          
          // Count as done if voter voted OR if zone is completed (regardless of age eligibility)
          if (voterData.hasVoted.yuvaPank || zoneCompleted) {
            totalVotes += 1
          }
        }
      }
      
      // Trustee: count only if voted
      if (isEligibleForTrustee && voterData.hasVoted.trustees) {
        totalVotes += 1
      }
    
      return { totalElections, totalVotes }
    } catch (error) {
      console.error('Error calculating voting progress:', error)
      // Return safe defaults on error
      return { totalElections: 0, totalVotes: 0 }
    }
  }, [
    voterData?.id, 
    voterData?.hasVoted?.karobariMembers, 
    voterData?.hasVoted?.yuvaPank, 
    voterData?.hasVoted?.trustees,
    voterData?.karobariZone?.id, 
    voterData?.yuvaPankZone?.id, 
    voterData?.yuvaPankZone?.code,
    voterData?.trusteeZone?.id, 
    voterData?.age, 
    voterData?.dob,
    // Only recalculate when results are first loaded or when regions count changes
    results ? results.yuvaPankh?.regions?.length ?? 0 : 0
  ])

  // Early return checks - MUST be after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{content[selectedLanguage].loading}</p>
        </div>
      </div>
    )
  }

  if (!voterData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-gray-900 mb-4">{content[selectedLanguage].accessDenied}</h1>
          <p className="text-gray-600 mb-4">{content[selectedLanguage].pleaseLogin}</p>
          <Link href="/voter/login">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              {content[selectedLanguage].goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Determine why Yuva Pankh is not available (if applicable)
  const getYuvaPankhEligibilityReason = () => {
    if (voterData.yuvaPankZone) return null // Eligible
    
    const dob = voterData.dob
    const region = voterData.region?.trim() || ''
    
    // Check DOB eligibility (must be 39 or younger as of August 31, 2025)
    const cutoffDate = new Date('2025-08-31')
    const ageAsOfCutoff = dob ? calculateAgeAsOf(dob, cutoffDate) : null
    const isAgeEligible = ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39
    
    // Check region eligibility - Yuva Pankh is only for Karnataka & Goa or Raigad
    const allowedRegions = ['Karnataka & Goa', 'Karnataka-Goa', 'Raigad']
    const normalizedRegion = region.toLowerCase()
    const isRegionEligible = allowedRegions.some(allowed => {
      const normalizedAllowed = allowed.toLowerCase()
      return normalizedRegion === normalizedAllowed || 
             normalizedRegion.includes(normalizedAllowed) || 
             normalizedAllowed.includes(normalizedRegion)
    })
    
    // If age is not eligible, return 'age'
    if (!isAgeEligible) {
      return 'age' // Not eligible due to age
    }
    // If age is eligible but region is not, return 'region'
    if (!isRegionEligible) {
      return 'region' // Not eligible due to region
    }
    return 'unknown' // Unknown reason (shouldn't happen if logic is correct)
  }

  // Create elections array - show all elections (always show Yuva Pankh, even if not eligible)
  const elections = [
    // Always show Yuva Pankh election (show disabled if voter doesn't have zone)
    {
      id: 'yuva-pank',
      title: selectedLanguage === 'english' ? 'Yuva Pankh Samiti' : 'યુવા પાંખ સમિતિ',
      icon: Users,
      color: 'green',
      hasVoted: voterData.hasVoted.yuvaPank,
      href: '/voter/vote/yuva-pank',
      totalSeats: 15,
      regionalSeats: voterData.yuvaPankZone?.seats || 0,
      zone: voterData.yuvaPankZone,
      isFrozen: voterData.yuvaPankZone?.isFrozen || false,
      isNotEligible: !voterData.yuvaPankZone, // Mark if not eligible
      eligibilityReason: getYuvaPankhEligibilityReason(), // Reason for ineligibility
      tenure: '2026-2029'
    },
    {
      id: 'trustees',
      title: selectedLanguage === 'english' ? 'Trust Mandal' : 'ટ્રસ્ટ મંડળ',
      icon: Award,
      color: 'purple',
      hasVoted: voterData.hasVoted.trustees,
      href: '/voter/vote/trustees',
      totalSeats: 7,
      regionalSeats: voterData.trusteeZone?.seats || 0,
      zone: voterData.trusteeZone,
      isAgeRestricted: (voterData.age || 0) < 18, // Only voters 18+ can vote
      tenure: '2026-2032'
    },
    // Show Karobari Samiti if voter has karobariZone (all Karobari elections are completed)
    ...(voterData.karobariZone ? [{
      id: 'karobari-members',
      title: selectedLanguage === 'english' ? 'Karobari Samiti' : 'કારોબારી સમિતિ',
      icon: Building,
      color: 'blue',
      hasVoted: voterData.hasVoted.karobariMembers,
      href: '/voter/vote/karobari-members',
      totalSeats: 21,
      regionalSeats: voterData.karobariZone.seats || 0,
      zone: voterData.karobariZone,
      isFrozen: voterData.karobariZone.isFrozen || false, // All Karobari elections are completed
      tenure: '2026-2029'
    }] : [])
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-2xl text-gray-900">{content[selectedLanguage].electionTitle}</h1>
                <p className="text-xs text-gray-600 mt-0.5">{content[selectedLanguage].electionCommission}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'gujarati' : 'english')}
                  className="text-sm"
                >
                  {selectedLanguage === 'english' ? 'ગુજરાતી' : 'English'}
                </Button>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-600"><strong>{content[selectedLanguage].voterId}</strong> <strong>{voterData.voterId}</strong></p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto text-sm">
                <LogOut className="h-4 w-4 mr-2" />
                {content[selectedLanguage].logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl text-gray-900">{content[selectedLanguage].voterDashboard}</h2>
          <p className="text-gray-600">
            {selectedLanguage === 'gujarati' 
              ? `${voterData.name}, સ્વાગત છે`
              : `${content[selectedLanguage].welcomeBack} ${voterData.name}`
            }
          </p>
        </div>

        {/* Zone Information */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <span>{content[selectedLanguage].yourZoneInformation}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {voterData.yuvaPankZone && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-medium text-gray-900">{content[selectedLanguage].yuvaPankhZone}</h5>
                  <p className="text-lg text-gray-900">{selectedLanguage === 'english' ? voterData.yuvaPankZone.name : voterData.yuvaPankZone.nameGujarati}</p>
                </div>
              )}
              {voterData.karobariZone && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-gray-900">{content[selectedLanguage].karobariZone}</h5>
                  <p className="text-lg text-gray-900">{selectedLanguage === 'english' ? voterData.karobariZone.name : voterData.karobariZone.nameGujarati}</p>
                  {results?.karobari?.regions && Array.isArray(results.karobari.regions) && (() => {
                    const zoneResult = results.karobari.regions.find(r => r.zoneId === voterData.karobariZone?.id);
                    const isCompleted = zoneResult && zoneResult.turnoutPercentage >= 100;
                    return isCompleted ? (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                        <div className="flex items-center space-x-2 text-amber-800">
                          <AlertCircle className="h-4 w-4" />
                          <span>{content[selectedLanguage].votingCompleted}</span>
                        </div>
                        <p className="text-amber-700 mt-1 text-xs">{content[selectedLanguage].votingCompletedMessage}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              {voterData.trusteeZone && (
                <div className="border-l-4 border-purple-500 pl-4">
                  <h5 className="font-medium text-gray-900">{content[selectedLanguage].trusteeZone}</h5>
                  <p className="text-lg text-gray-900">{selectedLanguage === 'english' ? voterData.trusteeZone.name : voterData.trusteeZone.nameGujarati}</p>
                </div>
              )}
            </div>
            {!voterData.yuvaPankZone && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>• {content[selectedLanguage].yuvaPankhNotAvailable}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unified Voting Option */}
        {/* {totalVotes < totalElections && (
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Vote className="h-6 w-6 text-blue-600" />
                <span>Unified Voting System</span>
              </CardTitle>
              <CardDescription>
                Cast all your votes in one streamlined process with preview and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Complete all elections in one go with our new unified voting system
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>• Progress tracking</span>
                    <span>• Vote preview</span>
                    <span>• Batch submission</span>
                  </div>
                </div>
                <Link href="/voter/vote">
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <Vote className="h-4 w-4 mr-2" />
                    Start Unified Voting
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Elections */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6">{content[selectedLanguage].individualElections}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {elections.map((election) => {
              const IconComponent = election.icon
              return (
                <Card key={election.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`h-6 w-6 text-${election.color}-600`} />
                        <span>{election.title}</span>
                      </div>
                      {election.isFrozen ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {selectedLanguage === 'english' ? 'Voted' : 'મત આપ્યો'}
                        </Badge>
                      ) : election.hasVoted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {selectedLanguage === 'english' ? 'Voted' : 'મત આપ્યો'}
                        </Badge>
                      ) : election.id === 'karobari-members' ? null : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{content[selectedLanguage].totalSeats}</span>
                        <span className="font-medium">{election.totalSeats}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{content[selectedLanguage].regionalSeats}</span>
                        <span className="font-medium">{election.regionalSeats}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{content[selectedLanguage].zone}</span>
                        <span className="font-medium">{selectedLanguage === 'english' ? (election.zone?.name || content[selectedLanguage].notAssigned) : (election.zone?.nameGujarati || content[selectedLanguage].notAssigned)}</span>
                      </div>
                      {election.tenure && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{content[selectedLanguage].tenure}</span>
                          <span className="font-medium">{election.tenure}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      {election.id === 'yuva-pank' ? (() => {
                        // Check if voter's zone is RAIGAD or KARNATAKA_GOA
                        const zoneCode = 'code' in (election.zone || {}) ? (election.zone as { code?: string })?.code : undefined
                        const isRaigadOrKarnataka = zoneCode === 'RAIGAD' || zoneCode === 'KARNATAKA_GOA'
                        
                        // For Raigad and Karnataka zones, show "Cast Your Vote" instead of "View Elected Members"
                        // After voting, the card should freeze
                        if (isRaigadOrKarnataka) {
                          if (election.hasVoted) {
                            // After voting, show frozen state
                            return (
                              <Button className="w-full" disabled>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {content[selectedLanguage].votingCompleted}
                              </Button>
                            )
                          } else {
                            // Show "Cast Your Vote" button for Raigad and Karnataka zones
                            return (
                              <Link href={election.href}>
                                <Button className={`w-full bg-${election.color}-600 hover:bg-${election.color}-700 text-white`}>
                                  <Vote className="h-4 w-4 mr-2" />
                                  {content[selectedLanguage].castYourVote}
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </Link>
                            )
                          }
                        }
                        
                        // Check if there are any winners in completed zones
                        // For voters with a zone: check if their zone has winners
                        // For voters without a zone: check if any winners exist (they can view all winners)
                        let hasYuvaPankhWinners = false
                        if (zoneCode) {
                          // Voter has a zone - check if their zone has winners
                          hasYuvaPankhWinners = zoneCode in yuvaPankhWinners && yuvaPankhWinners[zoneCode as keyof typeof yuvaPankhWinners]?.winners?.length > 0
                        } else {
                          // Voter doesn't have a zone - check if any winners exist
                          hasYuvaPankhWinners = Object.keys(yuvaPankhWinners).some(key => {
                            const zoneData = yuvaPankhWinners[key as keyof typeof yuvaPankhWinners]
                            return zoneData?.winners?.length > 0
                          })
                        }
                        
                        // Show "View Elected Members" if winners exist (for all except Raigad/Karnataka voters)
                        // Winners should be visible to all, except for Raigad and Karnataka zone voters
                        if (hasYuvaPankhWinners && !isRaigadOrKarnataka) {
                          return (
                            <Link href={election.href}>
                              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                <Eye className="h-4 w-4 mr-2" />
                                {content[selectedLanguage].viewElectedMembers}
                              </Button>
                            </Link>
                          )
                        }
                        
                        // If no winners and voter is not eligible, show disabled button
                        if (election.isNotEligible) {
                          return (
                            <>
                              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                <div className="flex items-start">
                                  <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                                  <p className="text-sm text-gray-700">
                                    {election.eligibilityReason === 'age' 
                                      ? content[selectedLanguage].yuvaPankhNotAvailableAge
                                      : content[selectedLanguage].yuvaPankhNotAvailable}
                                  </p>
                                </div>
                              </div>
                              <Button className="w-full" disabled>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {selectedLanguage === 'english' ? 'Not Eligible' : 'પાત્ર નથી'}
                              </Button>
                            </>
                          )
                        }
                        
                        // Default case - should not reach here for yuva-pank, but return null for safety
                        return null
                      })() : election.isNotEligible ? (
                        <>
                          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <div className="flex items-start">
                              <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                              <p className="text-sm text-gray-700">
                                {election.eligibilityReason === 'age' 
                                  ? content[selectedLanguage].yuvaPankhNotAvailableAge
                                  : content[selectedLanguage].yuvaPankhNotAvailable}
                              </p>
                            </div>
                          </div>
                          <Button className="w-full" disabled>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {selectedLanguage === 'english' ? 'Not Eligible' : 'પાત્ર નથી'}
                          </Button>
                        </>
                      ) : election.isFrozen ? (
                        <Button className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {content[selectedLanguage].votingCompleted}
                        </Button>
                      ) : election.hasVoted ? (
                        <Button className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {content[selectedLanguage].alreadyVoted}
                        </Button>
                      ) : election.id === 'trustees' && election.isAgeRestricted ? (
                        <>
                          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <div className="flex items-start">
                              <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                              <p className="text-sm text-gray-700">
                                {selectedLanguage === 'english' 
                                  ? 'Trust Mandal voting is only available for voters aged 18 and above.'
                                  : 'ટ્રસ્ટ મંડળ મતદાન ફક્ત 18 વર્ષ અને તેનાથી વધુ ઉંમરના મતદાતાઓ માટે ઉપલબ્ધ છે.'}
                              </p>
                            </div>
                          </div>
                          <Button className="w-full" disabled>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {selectedLanguage === 'english' ? 'Not Eligible' : 'પાત્ર નથી'}
                          </Button>
                        </>
                      ) : (
                        <Link href={election.href}>
                          <Button className={`w-full bg-${election.color}-600 hover:bg-${election.color}-700 text-white`}>
                            {election.id === 'karobari-members' ? (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                {selectedLanguage === 'english' ? 'View Elected Members' : 'નિર્વાચિત સભ્યો જુઓ'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            ) : (
                              <>
                            <Vote className="h-4 w-4 mr-2" />
                            {content[selectedLanguage].castYourVote}
                            <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Voting Progress */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              <span>{content[selectedLanguage].yourVotingProgress}</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {content[selectedLanguage].trackParticipation}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-3xl text-green-600 mb-2">
                  {totalVotes ?? 0}/{totalElections ?? 0}{totalElections > 0 && totalVotes === totalElections ? ' done' : ''}
                </div>
                <p className="text-sm text-gray-600">{content[selectedLanguage].electionsVoted}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl text-blue-600 mb-2">
                  {totalElections > 0 && totalVotes !== undefined && totalElections !== undefined 
                    ? Math.round((totalVotes / totalElections) * 100) 
                    : 0}%
                </div>
                <p className="text-sm text-gray-600">{content[selectedLanguage].participationRate}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl text-purple-600 mb-2">
                  {Math.max(0, (totalElections ?? 0) - (totalVotes ?? 0))}
                </div>
                <p className="text-sm text-gray-600">{content[selectedLanguage].remaining}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Election Results Charts */}
        <div className="mb-6 sm:mb-8">

          {resultsError && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{content[selectedLanguage].failedToLoad}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {results && (
            <>
              <div className={`grid grid-cols-1 ${voterData.yuvaPankZone ? 'lg:grid-cols-1' : 'lg:grid-cols-1'} gap-8 mb-8`}>

                {/* Yuva Pankh Members Chart - Show all zones with completion status */}
                {voterData.yuvaPankZone && results?.yuvaPankh?.regions && Array.isArray(results.yuvaPankh.regions) && (() => {
                  // Filter to show only pending zones: Karnataka & Goa and Raigad
                  const processedData = results.yuvaPankh.regions
                    .filter(region => {
                      const zoneCode = region.zoneCode || ''
                      // Only show Karnataka & Goa and Raigad (pending zones)
                      return zoneCode === 'KARNATAKA_GOA' || zoneCode === 'RAIGAD'
                    })
                    .map(region => {
                      const turnout = Number(region.turnoutPercentage) || 0
                      return {
                        name: region.zoneName,
                        turnout: turnout,
                        votes: region.totalVotes || 0,
                        voters: region.totalVoters || 0,
                        uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                        zoneCode: region.zoneCode || '',
                        notaVotes: region.notaVotes || 0,
                        actualVotes: region.actualVotes || 0,
                        isCompleted: false // These are pending zones
                      }
                    })
                    .sort((a, b) => b.turnout - a.turnout)
                  
                  return (
                  <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <span>{content[selectedLanguage].yuvaPankhMembers}</span>
                      </CardTitle>
                      <CardDescription>
                        {selectedLanguage === 'english' 
                          ? content[selectedLanguage].regionalParticipation
                          : 'યુવા પાંખ સમિતિ ચૂંટણી'}
                        <span className="block mt-1 text-xs text-amber-600">
                          {selectedLanguage === 'english' 
                            ? 'Note: Karnataka & Goa and Raigad zones are pending. All other zones are completed.'
                            : (
                              <span className="block space-y-1">
                                <span className="block">૧- યુવા પાંખ સમિતિ (૨ પ્રદેશો)</span>
                                <span className="block">૨- ફક્ત કર્ણાટક-ગોવા અને રાયગઢ વિભાગ માં જ મતદાન થશે. અન્ય વિભાગ ના ઉમેદવારો બિનહરીફ ચુંટાઇ આવેલ છે</span>
                              </span>
                            )}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Recharts Bar Chart */}
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={processedData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                fontSize={12}
                                stroke="#666"
                              />
                              <YAxis 
                                label={{ value: 'Voter Turnout', angle: -90, position: 'insideLeft' }}
                                fontSize={12}
                                stroke="#666"
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                              />
                              <Tooltip 
                                formatter={(value: any, name: any, props: any) => {
                                  const data = props.payload;
                                  const uniqueVoters = data.uniqueVoters !== undefined 
                                    ? data.uniqueVoters 
                                    : Math.round((data.turnout / 100) * data.voters);
                                  const totalVoters = data.voters || 0;
                                  const status = data.isCompleted 
                                    ? (selectedLanguage === 'english' ? ' (Completed)' : ' (પૂર્ણ)')
                                    : (data.turnout > 0 
                                      ? (selectedLanguage === 'english' ? ' (In Progress)' : ' (પ્રગતિમાં)')
                                      : (selectedLanguage === 'english' ? ' (Pending)' : ' (બાકી)'));
                                  return [`${value}%${status}`, `${uniqueVoters} ${selectedLanguage === 'english' ? 'out of' : 'માંથી'} ${totalVoters} ${selectedLanguage === 'english' ? 'voters voted' : 'મતદાતાઓએ મતદાન કર્યા'}`];
                                }}
                                labelFormatter={(label: any, payload: any) => {
                                  if (payload && payload[0]) {
                                    const data = payload[0].payload;
                                    const zoneName = selectedLanguage === 'english' 
                                      ? data.name 
                                      : (results?.yuvaPankh?.regions?.find(r => r.zoneCode === data.zoneCode)?.zoneNameGujarati || data.name);
                                    return zoneName;
                                  }
                                  return label;
                                }}
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Bar dataKey="turnout" radius={[4, 4, 0, 0]}>
                                {processedData.map((item, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={item.isCompleted ? '#10b981' : item.turnout > 0 ? '#8b5cf6' : '#e5e7eb'} 
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Summary Statistics */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-xl sm:text-2xl text-purple-600">
                              {processedData.length}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">{content[selectedLanguage].totalRegions}</div>
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl text-green-600">
                              {processedData.length > 0 ? Math.max(...processedData.map(r => r.turnout)).toFixed(1) : '0'}%
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">{content[selectedLanguage].highestTurnout}</div>
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl text-blue-600">
                              {processedData.reduce((sum, r) => sum + (r.uniqueVoters || 0), 0).toLocaleString()} / {processedData.reduce((sum, r) => sum + r.voters, 0).toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {selectedLanguage === 'english' ? 'Voters Voted / Total Voters' : 'મતદાન કરેલ મતદાતાઓ / કુલ મતદાતાઓ'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl text-purple-600">
                              {processedData.reduce((sum, r) => sum + r.voters, 0).toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">{content[selectedLanguage].totalVoters}</div>
                          </div>
                        </div>
                        
                        {/* Completion Status Legend */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-green-500"></div>
                              <span className="text-gray-600">
                                {selectedLanguage === 'english' ? 'Completed (100%)' : 'પૂર્ણ (100%)'}
                              </span>
                              <span className="text-gray-500">
                                ({processedData.filter(r => r.isCompleted).length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-purple-500"></div>
                              <span className="text-gray-600">
                                {selectedLanguage === 'english' ? 'In Progress' : 'પ્રગતિમાં'}
                              </span>
                              <span className="text-gray-500">
                                ({processedData.filter(r => !r.isCompleted && r.turnout > 0 && r.turnout < 100).length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-gray-300"></div>
                              <span className="text-gray-600">
                                {selectedLanguage === 'english' ? 'Pending' : 'બાકી'}
                              </span>
                              <span className="text-gray-500">
                                ({processedData.filter(r => !r.isCompleted && r.turnout === 0).length})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                  )
                })()}
              </div>

              {/* Trustee Members Chart */}
              {results?.trustee?.regions && Array.isArray(results.trustee.regions) && (
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <span>{content[selectedLanguage].trusteeMembers}</span>
                    </CardTitle>
                    <CardDescription>
                      {content[selectedLanguage].trusteeParticipation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Recharts Bar Chart */}
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={results.trustee.regions.map(region => ({
                              name: region.zoneName,
                              turnout: Number(region.turnoutPercentage) || 0,
                              votes: region.totalVotes || 0,
                              voters: region.totalVoters || 0,
                              uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                              zoneCode: region.zoneCode,
                              notaVotes: region.notaVotes || 0,
                              actualVotes: region.actualVotes || 0,
                              isCompleted: (Number(region.turnoutPercentage) || 0) >= 100
                            }))}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 60,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              fontSize={12}
                              stroke="#666"
                            />
                            <YAxis 
                              label={{ value: 'Voter Turnout', angle: -90, position: 'insideLeft' }}
                              fontSize={12}
                              stroke="#666"
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                            />
                            <Tooltip 
                              formatter={(value: any, name: any, props: any) => {
                                const data = props.payload;
                                const uniqueVoters = data.uniqueVoters !== undefined 
                                  ? data.uniqueVoters 
                                  : Math.round((data.turnout / 100) * data.voters);
                                const totalVoters = data.voters || 0;
                                const status = data.isCompleted 
                                  ? (selectedLanguage === 'english' ? ' (Completed)' : ' (પૂર્ણ)')
                                  : (data.turnout > 0 
                                    ? (selectedLanguage === 'english' ? ' (In Progress)' : ' (પ્રગતિમાં)')
                                    : (selectedLanguage === 'english' ? ' (Pending)' : ' (બાકી)'));
                                return [`${value}%${status}`, `${uniqueVoters} ${selectedLanguage === 'english' ? 'out of' : 'માંથી'} ${totalVoters} ${selectedLanguage === 'english' ? 'voters voted' : 'મતદાતાઓએ મતદાન કર્યા'}`];
                              }}
                              labelFormatter={(label: any, payload: any) => {
                                if (payload && payload[0]) {
                                  const data = payload[0].payload;
                                  const zoneName = selectedLanguage === 'english' 
                                    ? data.name 
                                    : (results?.trustee?.regions?.find(r => r.zoneCode === data.zoneCode)?.zoneNameGujarati || data.name);
                                  return zoneName;
                                }
                                return label;
                              }}
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar dataKey="turnout" radius={[4, 4, 0, 0]}>
                              {results.trustee.regions.map((region, index) => {
                                const turnout = Number(region.turnoutPercentage) || 0
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={turnout >= 100 ? '#10b981' : turnout > 0 ? '#3b82f6' : '#e5e7eb'} 
                                  />
                                )
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Summary Statistics */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xl sm:text-2xl text-green-600">
                            {results.trustee.totalRegions}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">{content[selectedLanguage].totalRegions}</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl text-green-600">
                            {Math.max(...results.trustee.regions.map(r => r.turnoutPercentage)).toFixed(1)}%
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">{content[selectedLanguage].highestTurnout}</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl text-blue-600">
                            {results.trustee.regions.reduce((sum, r) => sum + (r.uniqueVoters !== undefined ? r.uniqueVoters : 0), 0).toLocaleString()} / {results.trustee.totalVoters.toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {selectedLanguage === 'english' ? 'Voters Voted / Total Voters' : 'મતદાન કરેલ મતદાતાઓ / કુલ મતદાતાઓ'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl text-purple-600">
                            {results?.totalVotersInSystem ? results.totalVotersInSystem.toLocaleString() : results.trustee.totalVoters.toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">{content[selectedLanguage].totalVoters}</div>
                        </div>
                      </div>
                      
                      {/* Completion Status Legend */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span className="text-gray-600">
                              {selectedLanguage === 'english' ? 'Completed (100%)' : 'પૂર્ણ (100%)'}
                            </span>
                            <span className="text-gray-500">
                              ({results.trustee.regions.filter(r => r.turnoutPercentage >= 100).length})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500"></div>
                            <span className="text-gray-600">
                              {selectedLanguage === 'english' ? 'In Progress' : 'પ્રગતિમાં'}
                            </span>
                            <span className="text-gray-500">
                              ({results.trustee.regions.filter(r => r.turnoutPercentage > 0 && r.turnoutPercentage < 100).length})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-300"></div>
                            <span className="text-gray-600">
                              {selectedLanguage === 'english' ? 'Pending' : 'બાકી'}
                            </span>
                            <span className="text-gray-500">
                              ({results.trustee.regions.filter(r => r.turnoutPercentage === 0).length})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}
            </>
          )}
        </div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
