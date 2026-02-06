'use client'

import { useState } from 'react'
import { signIn, getSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, AlertCircle, ArrowLeft, LogIn, Eye, EyeOff } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

export default function OfflineTrusteesLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials. Please check your email and password.')
        return
      }

      const session = await getSession()
      if (!session?.user) {
        setError('Login failed. Please try again.')
        return
      }

      if (session.user.role !== 'ADMIN') {
        setError('Access denied. This login is for offline vote admins only.')
        return
      }

      if (!session.user.isOfflineVoteAdmin) {
        await signOut({ redirect: false })
        setError('This login is for offline vote admins only. Use the main admin login for full dashboard access.')
        return
      }

      router.push('/admin/offline-votes/trustees')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SKMMMS Election 2026</h1>
                <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 py-8">
        <Card className="border-2 border-indigo-100 shadow-lg mb-6">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex justify-center">
              <div className="rounded-full bg-indigo-100 p-4">
                <ClipboardCheck className="h-10 w-10 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Offline Trustee Vote – Login</CardTitle>
            <CardDescription>
              Sign in with your offline vote admin account to enter trustee votes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-gray-500 pt-2">
                Main admin?{' '}
                <Link href="/admin/login" className="text-indigo-600 hover:underline font-medium">
                  Log in here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
