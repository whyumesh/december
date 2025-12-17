'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function KarobariMembersElectionsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Karobari election is hidden from UI - show error and redirect
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election information...</p>
        </div>
      </div>
    )
  }

  // Karobari election is hidden - show error message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl text-red-900 mb-2">Election Not Available</h2>
            <p className="text-red-700 mb-4">Karobari Members election is not available at this time.</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
