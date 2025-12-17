'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Users, Award } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import Footer from '@/components/Footer'

interface Zone {
  id: string
  code: string
  name: string
  nameGujarati: string
  description: string
  seats: number
  isActive: boolean
  createdAt: string
}

export default function ZonesPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth()
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Move useEffect before early returns
  useEffect(() => {
    // Only fetch data if authenticated and admin
    if (isAuthenticated && isAdmin && !authLoading) {
      fetchZones()
    }
  }, [isAuthenticated, isAdmin, authLoading])

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

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/zones')
      const data = await response.json()
      
      if (response.ok) {
        // Filter: For Yuva Pankh, only show Karnataka & Goa and Raigad zones
        // Filter out Karobari zones (hidden from UI)
        let filteredZones = data.zones.filter((zone: any) => zone.electionType !== 'KAROBARI_MEMBERS')
        
        filteredZones = filteredZones.map((zone: any) => {
          if (zone.electionType === 'YUVA_PANK') {
            if (zone.code !== 'KARNATAKA_GOA' && zone.code !== 'RAIGAD') {
              return null
            }
          }
          return zone
        }).filter((zone: any) => zone !== null)
        
        setZones(filteredZones)
      } else {
        setError(data.error || 'Failed to load zones')
      }
    } catch (error) {
      setError('An error occurred while loading zones')
    } finally {
      setIsLoading(false)
    }
  }

  const totalSeats = zones.reduce((sum, zone) => sum + zone.seats, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading zones...</p>
        </div>
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
              <Logo size="md" />
              <div>
                <h1 className="text-2xl text-gray-900">SKMMMS Election 2026</h1>
                <p className="text-xs text-gray-600 mt-0.5">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
              </div>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900">Zone Management</h2>
          <p className="text-gray-600">Yuva Pankh seat distribution and regional zones</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Zones</p>
                  <p className="text-2xl text-gray-900">{zones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Seats</p>
                  <p className="text-2xl text-gray-900">{totalSeats}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Zones</p>
                  <p className="text-2xl text-gray-900">
                    {zones.filter(zone => zone.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zones Table */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Zones & Seat Distribution</CardTitle>
            <CardDescription>
              Complete list of zones with their seat allocations for Yuva Pankh elections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Zone Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Gujarati Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Seats</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          {zone.code}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {zone.name}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {zone.nameGujarati}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-gray-900">
                            {zone.seats} {zone.seats === 1 ? 'Seat' : 'Seats'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          className={zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={zone.description}>
                          {zone.description}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Zone Details */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <Card key={zone.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{zone.name}</CardTitle>
                  <Badge variant="outline">{zone.code}</Badge>
                </div>
                <CardDescription className="text-base">
                  {zone.nameGujarati}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Seats Allocated:</span>
                    <span className="font-semibold text-lg text-blue-600">
                      {zone.seats} {zone.seats === 1 ? 'Seat' : 'Seats'}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 mb-2">Coverage Area:</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {zone.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Badge 
                      className={zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Created: {new Date(zone.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
