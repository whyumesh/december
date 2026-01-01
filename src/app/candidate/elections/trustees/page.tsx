'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Vote, UserCheck, Search, Filter, Users, MapPin, Award, Phone, Mail, ArrowLeft } from 'lucide-react'

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

interface Zone {
  id: string
  name: string
  nameGujarati: string
  seats: number
}

export default function TrusteesPage() {
  const [trustees, setTrustees] = useState<Trustee[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [filteredTrustees, setFilteredTrustees] = useState<Trustee[]>([])
  const [selectedZone, setSelectedZone] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterTrustees()
  }, [trustees, selectedZone, searchTerm])

  const fetchData = async () => {
    try {
      const [trusteesResponse, zonesResponse] = await Promise.all([
        fetch('/api/trustees'),
        fetch('/api/zones')
      ])

      const trusteesData = await trusteesResponse.json()
      const zonesData = await zonesResponse.json()

      if (trusteesResponse.ok) {
        setTrustees(trusteesData.trustees)
      }

      if (zonesResponse.ok) {
        setZones(zonesData.zones)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTrustees = () => {
    let filtered = trustees

    if (selectedZone !== 'all') {
      filtered = filtered.filter(trustee => trustee.zone.id === selectedZone)
    }

    if (searchTerm) {
      filtered = filtered.filter(trustee =>
        trustee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trustee.nameGujarati?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trustee.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trustee.zone.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTrustees(filtered)
  }

  const getZoneStats = () => {
    const stats: Record<string, { total: number; filled: number }> = {}
    
    zones.forEach(zone => {
      const zoneTrustees = trustees.filter(t => t.zone.id === zone.id)
      stats[zone.id] = {
        total: zone.seats,
        filled: zoneTrustees.length
      }
    })
    
    return stats
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trustees...</p>
        </div>
      </div>
    )
  }

  const zoneStats = getZoneStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trustees Election</h1>
                <p className="text-gray-600">Select your regional trustees based on zones and seats</p>
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
              <UserCheck className="h-6 w-6 text-green-600" />
              <span>About Trustees Election</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Eligibility</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All registered Samaj members</li>
                  <li>• Age: 21+ years</li>
                  <li>• Active member for 3+ years</li>
                  <li>• No criminal record</li>
                  <li>• Good standing in community</li>
                </ul>
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Zone Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {zones.map((zone) => {
            const stats = zoneStats[zone.id]
            return (
              <Card key={zone.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.nameGujarati}</h3>
                      <p className="text-sm text-gray-600">{zone.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl text-green-600">
                        {stats?.filled || 0}/{stats?.total || 0}
                      </div>
                      <p className="text-xs text-gray-500">Seats Filled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg px-6 py-3 text-center">
            <p className="text-sm font-semibold text-red-700">
              The online voting process is closed now.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Trustees</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Zone
                </label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.nameGujarati} ({zone.name}) - {zone.seats} seats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Trustees
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, voter ID, or zone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trustees List */}
        <div className="space-y-6">
          {zones.map((zone) => {
            const zoneTrustees = filteredTrustees.filter(t => t.zone.id === zone.id)
            if (selectedZone !== 'all' && selectedZone !== zone.id) return null

            return (
              <Card key={zone.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span>{zone.nameGujarati}</span>
                      <Badge variant="outline">{zone.name}</Badge>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {zoneTrustees.length}/{zone.seats} Seats
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {zoneTrustees.length > 0 
                      ? `Select from ${zoneTrustees.length} available trustee${zoneTrustees.length === 1 ? '' : 's'}`
                      : 'No trustees available for this zone'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {zoneTrustees.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {zoneTrustees.map((trustee) => (
                        <Card key={trustee.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">{trustee.name}</h4>
                                <Badge variant="outline">{trustee.seat}</Badge>
                              </div>
                              
                              {trustee.nameGujarati && (
                                <p className="text-sm text-gray-600">{trustee.nameGujarati}</p>
                              )}
                              
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Award className="h-4 w-4" />
                                  <span>ID: {trustee.voterId}</span>
                                </div>
                                
                                {trustee.phone && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Phone className="h-4 w-4" />
                                    <span>{trustee.phone}</span>
                                  </div>
                                )}
                                
                                {trustee.email && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{trustee.email}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="pt-2">
                                <Button 
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  disabled={!trustee.isEligible}
                                >
                                  <Vote className="h-4 w-4 mr-2" />
                                  {trustee.isEligible ? 'Vote for Trustee' : 'Not Eligible'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Trustees Available</h3>
                      <p className="text-gray-500">
                        No trustees are currently available for this zone.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredTrustees.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Trustees Found</h3>
                <p className="text-gray-500">
                  No trustees match your current search criteria.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}