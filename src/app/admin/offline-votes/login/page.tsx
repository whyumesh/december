'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OfflineVoteLoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/offline-votes/trustees/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Redirecting to offline trustee vote login...</p>
    </div>
  )
}
