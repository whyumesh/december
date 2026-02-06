'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function OfflineVotesListPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, merged: 0, unmerged: 0 })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/offline-votes/trustees/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    fetchOfflineVotes()
  }, [])

  const fetchOfflineVotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/offline-votes/trustees')
      if (!response.ok) {
        throw new Error('Failed to fetch offline votes')
      }
      const data = await response.json()
      setStats({
        total: data.total ?? 0,
        merged: data.merged ?? 0,
        unmerged: data.unmerged ?? 0
      })
    } catch (error: unknown) {
      console.error('Error fetching offline votes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Logo />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Offline Votes List</CardTitle>
            <CardDescription>
              View all offline votes for trustee elections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Offline Votes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{stats.merged}</div>
                  <div className="text-sm text-gray-600">Merged</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{stats.unmerged}</div>
                  <div className="text-sm text-gray-600">Unmerged</div>
                </CardContent>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
