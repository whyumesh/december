'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Vote, AlertCircle, MapPin, ArrowLeft } from 'lucide-react'
import { getHiddenLocation } from '@/lib/geolocation'
import Logo from '@/components/Logo'

export default function VoterLoginPage() {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limitedDigits = digitsOnly.slice(0, 10)
    
    setPhone(limitedDigits)
  }
  const router = useRouter()

  useEffect(() => {
    // Silently get location in background
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    try {
      const locationData = await getHiddenLocation()
      if (locationData && locationData.latitude && locationData.longitude) {
        setLocation({
          lat: locationData.latitude,
          lng: locationData.longitude
        })
      }
      // Silently fail - no error messages for location
    } catch (error) {
      // Silently fail - no error messages for location
    }
  }

  const sendOTP = async () => {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    // Validate based on login method
    if (loginMethod === 'phone') {
      if (!phone || phone.length !== 10) {
        setError('Please enter a valid 10-digit phone number')
        setIsLoading(false)
        return
      }
    } else {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }
    }

    try {
      console.log(`Sending OTP request for ${loginMethod}:`, loginMethod === 'phone' ? phone : email)
      
      const response = await fetch('/api/voter/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ 
          phone: loginMethod === 'phone' ? phone : null,
          email: loginMethod === 'email' ? email : null
        }),
      })

      console.log('Send OTP response status:', response.status)
      console.log('Send OTP response headers:', Object.fromEntries(response.headers.entries()))
      
      // Check if response has content
      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)
      
      // Read response as text first, then parse as JSON
      const responseText = await response.text()
      console.log('Response text length:', responseText.length)
      console.log('Response text (first 500 chars):', responseText.substring(0, 500))
      
      let data
      try {
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server')
        }
        data = JSON.parse(responseText)
        console.log('Send OTP response data:', data)
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        console.error('Response text:', responseText)
        setError(`Server error: ${responseText || 'Empty response'}. Please check server logs.`)
        setIsLoading(false)
        return
      }

      if (response.ok) {
        const method = data.method === 'email' ? 'email' : 'phone'
        const defaultMessage = method === 'email' 
          ? 'OTP has been sent to your registered email address'
          : 'OTP has been sent to your registered phone number'
        setSuccessMessage(data.message || defaultMessage)
        setStep('otp')
      } else {
        // Show the actual error message from the API
        let errorMessage = data.error || data.message || 'Failed to send OTP'
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          errorMessage = data.message || 'Too many requests. Please wait a few minutes and try again.'
        }
        
        console.error('Send OTP failed:', {
          status: response.status,
          error: errorMessage,
          data: data
        })
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Send OTP network error:', error)
      if (error instanceof Error) {
        setError(`Network error: ${error.message}. Please check your connection and try again.`)
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async () => {
    setIsLoading(true)
    setError('')

    try {
      console.log('Verifying OTP...', { 
        method: loginMethod,
        phone: loginMethod === 'phone' ? phone : 'N/A',
        email: loginMethod === 'email' ? email : 'N/A',
        otp: otp ? '***' : 'missing' 
      })
      
      const response = await fetch('/api/voter/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ 
          phone: loginMethod === 'phone' ? phone : null,
          email: loginMethod === 'email' ? email : null,
          otp 
        }),
      })

      console.log('Verify OTP response status:', response.status)
      
      // Read response as text first, then parse as JSON
      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
        console.log('Verify OTP response data:', data)
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        console.error('Response text:', responseText)
        setError('Invalid response from server. Please try again.')
        setIsLoading(false)
        return
      }

      if (response.ok) {
        // Proceed directly to login completion - await it to ensure it completes
        await completeLogin()
      } else {
        const errorMessage = data.error || data.message || 'Invalid OTP'
        console.error('Verify OTP failed:', errorMessage)
        setError(errorMessage)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const completeLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Use location if available, otherwise use default
      const locationData = location || { lat: 19.0760, lng: 72.8777 } // Mumbai default
      
      console.log('Attempting voter login...', { phone, otp: otp ? '***' : 'missing', location: locationData })
      
      const response = await fetch('/api/voter/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ 
          phone: loginMethod === 'phone' ? phone : null,
          email: loginMethod === 'email' ? email : null,
          otp, 
          location: {
            latitude: locationData.lat,
            longitude: locationData.lng
          }
        }),
      })

      console.log('Login response status:', response.status)
      
      // Read response as text first, then parse as JSON
      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
        console.log('Login response data:', data)
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        console.error('Response text:', responseText)
        setError('Invalid response from server. Please try again.')
        setIsLoading(false)
        return
      }

      if (response.ok) {
        console.log('Login successful, redirecting to dashboard...')
        console.log('Response cookies:', document.cookie)
        
        // Small delay to ensure cookie is set before redirect
        setTimeout(() => {
          router.push('/voter/dashboard')
        }, 100)
      } else {
        const errorMessage = data.error || data.message || 'Login failed'
        console.error('Login failed:', errorMessage, data)
        setError(errorMessage)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof Error) {
        setError(`An error occurred: ${error.message}`)
      } else {
        setError('An error occurred. Please try again.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">KMS ELECTION 2026</h1>
                <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
              </div>
            </div>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-sm flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-8 sm:py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="mx-auto mb-3 sm:mb-4">
              <Logo size="md" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Voter Login</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {step === 'phone' && (
                <>
                  Enter your registered phone number or email address
                  <br />
                  <span className="text-xs text-gray-500">તમારો નોંધાયેલો ફોન નંબર અથવા ઈ-મેલ સરનામું દાખલ કરો</span>
                </>
              )}
              {step === 'otp' && (
                <>
                  Enter the OTP sent to your phone or email
                  <br />
                  <span className="text-xs text-gray-500">તમારા ફોન અથવા ઈ-મેલ પર મોકલેલ OTP દાખલ કરો</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              {/* Login Method Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={loginMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => {
                    setLoginMethod('phone')
                    setEmail('')
                    setError('')
                  }}
                  className="flex-1"
                >
                  Phone / ફોન
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => {
                    setLoginMethod('email')
                    setPhone('')
                    setError('')
                  }}
                  className="flex-1"
                >
                  Email / ઈ-મેલ
                </Button>
              </div>

              {loginMethod === 'phone' ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number / ફોન નંબર
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="7875XXXXXX"
                    autoComplete="tel"
                    maxLength={10}
                    required
                  />
                  {/* Note for Indian users */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      Note / નોંધ:
                    </p>
                    <p className="text-xs text-blue-700 mb-1">
                      Email service is only available for overseas users. For Indian users, please use mobile number.
                    </p>
                    <p className="text-xs text-blue-700">
                      ઈ-મેલ સેવા ફક્ત વિદેશી સભ્યો માટે ઉપલબ્ધ છે. ભારતીય સભ્યો માટે, કૃપા કરીને મોબાઇલ નંબરનો ઉપયોગ કરો.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address / ઈ-મેલ સરનામું
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    required
                  />
                  {/* Note for overseas users */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      Note / નોંધ:
                    </p>
                    <p className="text-xs text-blue-700 mb-1">
                      Email service is only available for overseas users. For Indian users, please use mobile number.
                    </p>
                    <p className="text-xs text-blue-700">
                      ઈ-મેલ સેવા ફક્ત વિદેશી સભ્યો માટે ઉપલબ્ધ છે. ભારતીય સભ્યો માટે, કૃપા કરીને મોબાઇલ નંબરનો ઉપયોગ કરો.
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={sendOTP}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  isLoading || 
                  (loginMethod === 'phone' && phone.length !== 10) ||
                  (loginMethod === 'email' && (!email || !email.includes('@')))
                }
              >
                {isLoading ? 'Sending OTP... / OTP મોકલી રહ્યા છીએ...' : 'Send OTP / OTP મોકલો'}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-800">{successMessage}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter the 6-digit OTP sent to your registered phone number or email address
                </p>
              </div>
              
              <Button 
                onClick={verifyOTP}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              
            </div>
          )}

          </CardContent>
        </Card>
      </div>

      {/* Footer with subtitle */}
      <footer className="bg-gray-50 border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-500 text-center">
            Election 2026: Shree Panvel Kutchi Maheshwari Mahajan
          </p>
        </div>
      </footer>
    </div>
  )
}
