'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Vote, AlertCircle, CheckCircle } from 'lucide-react'

interface FormData {
  name: string
  email: string
  phone: string
  party: string
  position: string
  region: string
  experience: string
  education: string
  manifesto: string
}

export default function CandidateRegistrationPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    party: '',
    position: '',
    region: '',
    experience: '',
    education: '',
    manifesto: ''
  })
  const [electionType, setElectionType] = useState('yuva-pank')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Get election type from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const election = urlParams.get('election')
    if (election) {
      setElectionType(election)
    }
  }, [])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/candidate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          electionType
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/candidate/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen election-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl text-white mb-2">Registration Successful!</h2>
              <p className="text-white/80 mb-4">
                Your nomination has been submitted for review. You will be notified once it's approved.
              </p>
              <p className="text-white/60 text-sm">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen election-gradient py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Vote className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Candidate Registration</CardTitle>
              <CardDescription className="text-white/80">
                Fill out the form below to submit your nomination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      placeholder="+1234567890"
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="party" className="text-white">Political Party</Label>
                    <Input
                      id="party"
                      value={formData.party}
                      onChange={(e) => handleInputChange('party', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      placeholder="Enter party name or 'Independent'"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-white">Position *</Label>
                    <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {electionType === 'yuva-pank' ? (
                          <>
                            <SelectItem value="YOUTH_PRESIDENT">Youth President</SelectItem>
                            <SelectItem value="YOUTH_VICE_PRESIDENT">Youth Vice President</SelectItem>
                            <SelectItem value="YOUTH_SECRETARY">Youth Secretary</SelectItem>
                            <SelectItem value="YOUTH_TREASURER">Youth Treasurer</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="PRESIDENT">President</SelectItem>
                            <SelectItem value="VICE_PRESIDENT">Vice President</SelectItem>
                            <SelectItem value="SECRETARY">Secretary</SelectItem>
                            <SelectItem value="TREASURER">Treasurer</SelectItem>
                            <SelectItem value="MEMBER">Board Member</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-white">Region *</Label>
                    <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORTH">North Region</SelectItem>
                        <SelectItem value="SOUTH">South Region</SelectItem>
                        <SelectItem value="EAST">East Region</SelectItem>
                        <SelectItem value="WEST">West Region</SelectItem>
                        <SelectItem value="CENTRAL">Central Region</SelectItem>
                        <SelectItem value="NORTHEAST">Northeast Region</SelectItem>
                        <SelectItem value="NORTHWEST">Northwest Region</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education" className="text-white">Education</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    placeholder="Enter your educational background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-white">Experience</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    placeholder="Describe your relevant experience"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manifesto" className="text-white">Manifesto *</Label>
                  <Textarea
                    id="manifesto"
                    value={formData.manifesto}
                    onChange={(e) => handleInputChange('manifesto', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    placeholder="Describe your vision and plans if elected"
                    rows={4}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-blue-600 hover:bg-gray-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Nomination'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-white/80 text-sm">
                  Already have an account?{' '}
                  <a href="/auth/signin" className="text-white hover:underline">
                    Sign in
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
