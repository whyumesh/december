'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Users, MapPin, Award, Phone, Mail, Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Trustee {
  id: string
  name: string
  nameGujarati?: string
  voterId: string
  phone?: string
  email?: string
  seat: string
  isEligible: boolean
  isActive: boolean
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

export default function TrusteesManagementPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth()
  const [trustees, setTrustees] = useState<Trustee[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [filteredTrustees, setFilteredTrustees] = useState<Trustee[]>([])
  const [selectedZone, setSelectedZone] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Move useEffect hooks before early returns
  useEffect(() => {
    // Only fetch data if authenticated and admin
    if (isAuthenticated && isAdmin && !authLoading) {
      fetchData()
    }
  }, [isAuthenticated, isAdmin, authLoading])

  useEffect(() => {
    // Only filter if we have trustees and are authenticated
    if (isAuthenticated && isAdmin && !authLoading) {
      filterTrustees()
    }
  }, [trustees, selectedZone, searchTerm, isAuthenticated, isAdmin, authLoading])

  // Show loading state while checking authentication
  if (authLoading) {
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
    const stats: Record<string, { total: number; filled: number; active: number }> = {}
    
    zones.forEach(zone => {
      const zoneTrustees = trustees.filter(t => t.zone.id === zone.id)
      const activeTrustees = zoneTrustees.filter(t => t.isActive)
      stats[zone.id] = {
        total: zone.seats,
        filled: zoneTrustees.length,
        active: activeTrustees.length
      }
    })
    
    return stats
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl text-gray-900">Trustees Management</h1>
                <p className="text-xs sm:text-sm text-gray-600">Manage trustees for each zone and seat</p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Trustee
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Zone Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {zones.map((zone) => {
            const stats = zoneStats[zone.id]
            return (
              <Card key={zone.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.nameGujarati}</h3>
                      <p className="text-sm text-gray-600">{zone.name}</p>
                    </div>
                    <Badge variant="outline">{zone.seats} Seats</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Trustees:</span>
                      <span className="font-semibold">{stats?.filled || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-semibold text-green-600">{stats?.active || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-semibold text-blue-600">
                        {(stats?.total || 0) - (stats?.filled || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
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
                        {zone.nameGujarati} ({zone.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Trustees
                </label>
                <Input
                  placeholder="Search by name, voter ID, or zone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">
                        {zoneTrustees.length}/{zone.seats} Seats
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Trustee
                      </Button>
                    </div>
                  </CardTitle>
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
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{trustee.seat}</Badge>
                                  <div className="flex space-x-1">
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
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
                              
                              <div className="flex space-x-2 pt-2">
                                <Badge 
                                  className={trustee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                >
                                  {trustee.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge 
                                  className={trustee.isEligible ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                                >
                                  {trustee.isEligible ? 'Eligible' : 'Not Eligible'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Trustees in this Zone</h3>
                      <p className="text-gray-500 mb-4">
                        No trustees are currently assigned to this zone.
                      </p>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Trustee
                      </Button>
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
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
