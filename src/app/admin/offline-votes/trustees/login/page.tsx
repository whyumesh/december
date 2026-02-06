'use client'

import { useState } from 'react'
import { signIn, getSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, AlertCircle, ArrowLeft, LogIn, Eye, EyeOff, Users, ChevronDown, ChevronUp } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

const OFFLINE_VOTE_ADMIN_CREDENTIALS = [
  { id: 1, email: 'offline-admin-1@kms-election.com', password: 'OfflineVote1!' },
  { id: 2, email: 'offline-admin-2@kms-election.com', password: 'OfflineVote2!' },
  { id: 3, email: 'offline-admin-3@kms-election.com', password: 'OfflineVote3!' },
  { id: 4, email: 'offline-admin-4@kms-election.com', password: 'OfflineVote4!' },
  { id: 5, email: 'offline-admin-5@kms-election.com', password: 'OfflineVote5!' },
  { id: 6, email: 'offline-admin-6@kms-election.com', password: 'OfflineVote6!' },
  { id: 7, email: 'offline-admin-7@kms-election.com', password: 'OfflineVote7!' },
  { id: 8, email: 'offline-admin-8@kms-election.com', password: 'OfflineVote8!' },
  { id: 9, email: 'offline-admin-9@kms-election.com', password: 'OfflineVote9!' },
  { id: 10, email: 'offline-admin-10@kms-election.com', password: 'OfflineVote10!' },
  { id: 11, email: 'offline-admin-11@kms-election.com', password: 'OfflineVote11!' },
  { id: 12, email: 'offline-admin-12@kms-election.com', password: 'OfflineVote12!' },
  { id: 13, email: 'offline-admin-13@kms-election.com', password: 'OfflineVote13!' },
  { id: 14, email: 'offline-admin-14@kms-election.com', password: 'OfflineVote14!' },
  { id: 15, email: 'offline-admin-15@kms-election.com', password: 'OfflineVote15!' },
]

export default function OfflineTrusteesLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
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
        setError('Invalid credentials. Use one of the 15 offline vote admin accounts below.')
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
        setError('This login is for the 15 offline vote admins only. Use the main admin login for full dashboard access.')
        return
      }

      router.push('/admin/offline-votes/trustees')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredential = (cred: (typeof OFFLINE_VOTE_ADMIN_CREDENTIALS)[0]) => {
    setEmail(cred.email)
    setPassword(cred.password)
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
              Sign in with one of the 15 offline vote admin accounts to enter trustee votes
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
                  placeholder="e.g. offline-admin-1@kms-election.com"
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
                    placeholder="e.g. OfflineVote1!"
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

        {/* 15 login IDs */}
        <Card>
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-900">
              <Users className="h-5 w-5 text-indigo-600" />
              15 Offline Vote Admin Login IDs
            </span>
            {showCredentials ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {showCredentials && (
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                Click a row to fill the login form. Keep these credentials secure.
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-3 py-2 font-medium text-gray-700">#</th>
                      <th className="px-3 py-2 font-medium text-gray-700">Email</th>
                      <th className="px-3 py-2 font-medium text-gray-700">Password</th>
                      <th className="px-3 py-2 font-medium text-gray-700 w-20">Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OFFLINE_VOTE_ADMIN_CREDENTIALS.map((cred) => (
                      <tr
                        key={cred.id}
                        className="border-t hover:bg-indigo-50/50 cursor-pointer"
                        onClick={() => fillCredential(cred)}
                      >
                        <td className="px-3 py-2 text-gray-600">{cred.id}</td>
                        <td className="px-3 py-2 font-mono text-xs break-all">{cred.email}</td>
                        <td className="px-3 py-2 font-mono text-xs">{cred.password}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              fillCredential(cred)
                            }}
                          >
                            Use
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  )
}
