'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { calculateAge } from '@/lib/age-validation'

interface Zone {
  id: string
  code: string
  name: string
  nameGujarati: string
  description: string
  seats: number
  electionType: string
}

export default function VoterUploadPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth()
  const [zones, setZones] = useState<Zone[]>([])
  const [voters, setVoters] = useState<Array<{
    voterId?: string
    region: string
    name: string
    gender: string
    dob: string
    email: string
    mulgam: string
    phone: string
    yuvaPankhZoneId: string
    karobariZoneId: string
    trusteeZoneId: string
    isActive: boolean
    age?: number
  }>>([{
    voterId: '',
    region: 'Mumbai',
    name: '', 
    gender: 'M', 
    dob: '', 
    email: '', 
    mulgam: '', 
    phone: '', 
    yuvaPankhZoneId: '',
    karobariZoneId: '',
    trusteeZoneId: '',
    isActive: true,
    age: undefined
  }])
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingZones, setIsLoadingZones] = useState(true)

  // Helper function to calculate age from DOB
  const calculateAgeFromDOB = (dob: string): number | null => {
    if (!dob) return null
    
    // Handle DD/MM/YYYY format
    const parts = dob.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10)
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    
    // Validate date components
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear()) {
      return null
    }
    
    const birthDate = new Date(year, month, day)
    const today = new Date()
    
    // Check if the date is valid
    if (birthDate.getDate() !== day || birthDate.getMonth() !== month || birthDate.getFullYear() !== year) {
      return null
    }
    
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Helper function to check if date is complete and valid
  const isCompleteDate = (dob: string): boolean => {
    if (!dob) return false
    
    // Check if it matches DD/MM/YYYY format
    const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!dobRegex.test(dob)) return false
    
    const parts = dob.split('/')
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    // Basic validation
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
      return false
    }
    
    // Check if date is valid
    const birthDate = new Date(year, month - 1, day)
    return birthDate.getDate() === day && birthDate.getMonth() === month - 1 && birthDate.getFullYear() === year
  }

  // Helper function to calculate age as of a specific date from DOB
  const calculateAgeAsOf = (dob: string, referenceDate: Date): number | null => {
    if (!dob) return null
    
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
  }

  // Helper function to check if eligible for Yuva Pankh based on DOB (must be 39 or younger as of Aug 31, 2025)
  const isEligibleForYuvaPankh = (dob: string | null | undefined): boolean => {
    if (!dob) return false
    
    const cutoffDate = new Date('2025-08-31')
    const ageAsOfCutoff = calculateAgeAsOf(dob, cutoffDate)
    
    return ageAsOfCutoff !== null && ageAsOfCutoff >= 18 && ageAsOfCutoff <= 39
  }

  // Helper function to get zones by election type
  const getZonesByType = (electionType: string) => {
    return zones.filter(zone => zone.electionType === electionType)
  }

  // Helper function to get filtered zones based on age and election type
  const getFilteredZones = (electionType: string, age: number | null | undefined) => {
    let filtered = getZonesByType(electionType)
    
    // For Yuva Pankh, only show Karnataka & Goa and Raigad zones
    if (electionType === 'YUVA_PANK') {
      filtered = filtered.filter(zone => 
        zone.code === 'KARNATAKA_GOA' || zone.code === 'RAIGAD'
      )
    }
    
    return filtered
  }

  // Fetch zones on component mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await fetch('/api/zones')
        const data = await response.json()
        if (response.ok) {
          setZones(data.zones)
        } else {
          setError('Failed to load zones')
        }
      } catch (error) {
        console.error('Error fetching zones:', error)
        setError('Failed to load zones')
      } finally {
        setIsLoadingZones(false)
      }
    }

    if (isAuthenticated && isAdmin) {
      fetchZones()
    }
  }, [isAuthenticated, isAdmin])

  // Show loading state while checking authentication or loading zones
  if (authLoading || isLoadingZones) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not authenticated or not admin
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

  const addVoter = () => {
    setVoters([...voters, { 
      voterId: '',
      region: 'Mumbai',
      name: '', 
      gender: 'M', 
      dob: '', 
      email: '', 
      mulgam: '', 
      phone: '', 
      yuvaPankhZoneId: '',
      karobariZoneId: '',
      trusteeZoneId: '',
      isActive: true,
      age: undefined
    }])
  }

  const updateVoter = (index: number, field: string, value: string | number | boolean) => {
    const updatedVoters = [...voters]
    updatedVoters[index] = { ...updatedVoters[index], [field]: value }
    
    // If DOB is being updated, calculate age only when date is complete
    if (field === 'dob') {
      const dobValue = value as string
      
      // Only calculate age if the date is complete and valid
      if (isCompleteDate(dobValue)) {
        const age = calculateAgeFromDOB(dobValue)
        updatedVoters[index].age = age || undefined
        
        // Check Yuva Pankh eligibility based on DOB (must be 39 or younger as of Aug 31, 2025)
        if (dobValue && isCompleteDate(dobValue)) {
          if (!isEligibleForYuvaPankh(dobValue)) {
            updatedVoters[index].yuvaPankhZoneId = ''
          }
        } else if (age && (age < 18 || age > 39)) {
          // Fallback: if DOB is not available, use age check (conservative)
          updatedVoters[index].yuvaPankhZoneId = ''
        }
      } else {
        // Reset age if date is not complete
        updatedVoters[index].age = undefined
      }
    }
    
    setVoters(updatedVoters)
  }

  const removeVoter = (index: number) => {
    setVoters(voters.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (voters.length === 0) {
      setError('Please add at least one voter')
      return
    }

    // Validate all voters
    for (const voter of voters) {
      if (!voter.name.trim() || !voter.phone.trim() || !voter.mulgam.trim() || !voter.dob.trim() || !voter.gender.trim() || !voter.region.trim()) {
        setError('Name, phone, gender, region, current city, and date of birth are required for each voter')
        return
      }

      // At least one zone must be selected
      const hasYuvaPankhZone = voter.yuvaPankhZoneId.trim()
      // Karobari zone check removed - hidden from UI
      const hasTrusteeZone = voter.trusteeZoneId.trim()
      
      if (!hasYuvaPankhZone && !hasTrusteeZone) {
        setError(`Voter ${voter.name} must be assigned to at least one zone (Yuva Pankh or Trustee)`)
        return
      }
      
      // Validate phone number (exactly 10 digits)
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(voter.phone)) {
        setError(`Invalid phone number for voter ${voter.name}. Please enter exactly 10 digits`)
        return
      }
      
      // Validate DOB format (DD/MM/YYYY)
      const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/
      if (!dobRegex.test(voter.dob)) {
        setError(`Invalid date format for voter ${voter.name}. Please use DD/MM/YYYY format`)
        return
      }

      // Calculate age and validate minimum age requirement (18+)
      const age = calculateAgeFromDOB(voter.dob)
      if (!age || age < 18) {
        setError(`Voter ${voter.name} must be at least 18 years old. Current age: ${age || 'Invalid DOB'}`)
        return
      }

      // Yuva Pankh zone validation is handled in the UI (zone is hidden if not eligible)
    }

    setIsUploading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/voters/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voters }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setVoters([])
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (error) {
      setError('An error occurred during upload')
    } finally {
      setIsUploading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl text-gray-900 mb-2">Upload Successful!</h2>
              <p className="text-gray-600 mb-4">
                Voters have been added to the system successfully.
              </p>
              <div className="space-y-2">
                <Link href="/admin/voters/upload">
                  <Button className="w-full" onClick={() => setSuccess(false)}>
                    Upload More Voters
                  </Button>
                </Link>
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="w-full">
                    Previous
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900">Upload Voter List</h1>
                <p className="text-gray-600">Add voters to the election system</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Voter Information</CardTitle>
            <CardDescription>
              Add voter details below. Each voter will be able to participate in the election.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {voters.map((voter, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Voter {index + 1}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVoter(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`voterId-${index}`}>VID Number (Optional)</Label>
                      <Input
                        id={`voterId-${index}`}
                        value={voter.voterId || ''}
                        onChange={(e) => updateVoter(index, 'voterId', e.target.value)}
                        placeholder="Auto-generated if left empty"
                      />
                      <p className="text-xs text-gray-500">Leave empty to auto-generate</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`region-${index}`}>Voting Region *</Label>
                      <Select
                        value={voter.region}
                        onValueChange={(value) => updateVoter(index, 'region', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mumbai">Mumbai</SelectItem>
                          <SelectItem value="Raigad">Raigad</SelectItem>
                          <SelectItem value="Karnataka & Goa">Karnataka & Goa</SelectItem>
                          <SelectItem value="Kutch">Kutch</SelectItem>
                          <SelectItem value="Bhuj">Bhuj</SelectItem>
                          <SelectItem value="Anjar">Anjar</SelectItem>
                          <SelectItem value="Abdasa">Abdasa</SelectItem>
                          <SelectItem value="Garda">Garda</SelectItem>
                          <SelectItem value="Anya Gujarat">Anya Gujarat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>Full Name *</Label>
                      <Input
                        id={`name-${index}`}
                        value={voter.name}
                        onChange={(e) => updateVoter(index, 'name', e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`gender-${index}`}>
                        Gender *
                      </Label>
                      <Select
                        value={voter.gender}
                        onValueChange={(value) => updateVoter(index, 'gender', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`dob-${index}`}>
                        Date of Birth *
                      </Label>
                      <Input
                        id={`dob-${index}`}
                        value={voter.dob}
                        onChange={(e) => {
                          let value = e.target.value
                          
                          // Remove all non-numeric characters
                          value = value.replace(/\D/g, '')
                          
                          // Add slashes automatically
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2)
                          }
                          if (value.length >= 5) {
                            value = value.substring(0, 5) + '/' + value.substring(5, 9)
                          }
                          
                          // Limit to DD/MM/YYYY format (10 characters)
                          if (value.length > 10) {
                            value = value.substring(0, 10)
                          }
                          
                          updateVoter(index, 'dob', value)
                        }}
                        placeholder="DD/MM/YYYY (e.g., 15/03/1990)"
                        maxLength={10}
                        required
                      />
                      {voter.age !== undefined && (
                        <p className="text-sm text-gray-600">
                          Age: {voter.age} years
                          {voter.age < 18 && <span className="text-red-500 ml-2">(Must be 18+)</span>}
                          {voter.age > 39 && <span className="text-orange-500 ml-2">(Not eligible for Yuva Pankh)</span>}
                        </p>
                      )}
                      {voter.dob && !isCompleteDate(voter.dob) && (
                        <p className="text-sm text-gray-500">
                          Please enter a complete and valid date
                        </p>
                      )}
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={voter.email}
                        onChange={(e) => updateVoter(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`mulgam-${index}`}>
                        Current City *
                      </Label>
                      <Input
                        id={`mulgam-${index}`}
                        value={voter.mulgam}
                        onChange={(e) => updateVoter(index, 'mulgam', e.target.value)}
                        placeholder="Enter current city (e.g., Mumbai, Ahmedabad, Bangalore)"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`phone-${index}`}>Phone Number *</Label>
                      <Input
                        id={`phone-${index}`}
                        value={voter.phone}
                        onChange={(e) => {
                          // Only allow numeric input
                          const numericValue = e.target.value.replace(/[^0-9]/g, '')
                          updateVoter(index, 'phone', numericValue)
                        }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        type="tel"
                      />
                    </div>


                    {/* Yuva Pankh Zone - Only show if age is between 18-39 or not calculated yet */}
                    {(!voter.age || (voter.age >= 18 && voter.age <= 39)) && (
                      <div className="space-y-2">
                        <Label htmlFor={`yuva-pankh-zone-${index}`}>Yuva Pankh Zone</Label>
                        <Select
                          value={voter.yuvaPankhZoneId}
                          onValueChange={(value) => updateVoter(index, 'yuvaPankhZoneId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Yuva Pankh zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingZones ? (
                              <SelectItem value="" disabled>
                                Loading zones...
                              </SelectItem>
                            ) : (
                              getFilteredZones('YUVA_PANK', voter.age).map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  {zone.name} ({zone.nameGujarati})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Show message when Yuva Pankh is not available due to age/DOB */}
                    {voter.dob && isCompleteDate(voter.dob) && !isEligibleForYuvaPankh(voter.dob) && (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm text-gray-600">
                            {(() => {
                              const cutoffDate = new Date('2025-08-31')
                              const ageAsOfCutoff = calculateAgeAsOf(voter.dob, cutoffDate)
                              if (ageAsOfCutoff !== null && ageAsOfCutoff < 18) {
                                return "Yuva Pankh zones are not available for voters under 18 years"
                              } else {
                                return "Yuva Pankh zones are not available. Must be 39 years old or younger as of August 31, 2025"
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Karobari Zone */}
                    {voter.age !== undefined && voter.age >= 18 && (
                      <div className="space-y-2">
                        <Label htmlFor={`karobari-zone-${index}`}>Karobari Zone</Label>
                        <Select
                          value={voter.karobariZoneId}
                          onValueChange={(value) => updateVoter(index, 'karobariZoneId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Karobari zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingZones ? (
                              <SelectItem value="" disabled>
                                Loading zones...
                              </SelectItem>
                            ) : (
                              getFilteredZones('KAROBARI_MEMBERS', voter.age).map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  {zone.name} ({zone.nameGujarati})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Trustee Zone */}
                    <div className="space-y-2">
                      <Label htmlFor={`trustee-zone-${index}`}>Trustee Zone</Label>
                      <Select
                        value={voter.trusteeZoneId}
                        onValueChange={(value) => updateVoter(index, 'trusteeZoneId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Trustee zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingZones ? (
                            <SelectItem value="" disabled>
                              Loading zones...
                            </SelectItem>
                          ) : (
                            getFilteredZones('TRUSTEES', voter.age).map((zone) => (
                              <SelectItem key={zone.id} value={zone.id}>
                                {zone.name} ({zone.nameGujarati})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Active Status */}
                    <div className="space-y-2 flex items-center">
                      <input
                        type="checkbox"
                        id={`isActive-${index}`}
                        checked={voter.isActive}
                        onChange={(e) => updateVoter(index, 'isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor={`isActive-${index}`} className="ml-2 cursor-pointer">
                        Active Voter
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={addVoter}
                  className="mb-6"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Voter
                </Button>
              </div>

              {voters.length > 0 && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-8"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${voters.length} Voter${voters.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
