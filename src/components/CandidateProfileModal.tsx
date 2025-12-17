'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, User, Mail, Phone, MapPin, GraduationCap, Briefcase, Flag, Quote, FileText } from 'lucide-react'

interface CandidateProfileModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: {
    id: string
    name: string
    email?: string
    phone?: string
    region?: string
    party?: string
    manifesto?: string
    experience?: string
    education?: string
    position?: string
    photoUrl?: string
    zone?: {
      id: string
      name: string
      nameGujarati: string
      code: string
      seats: number
    }
  } | null
}

export default function CandidateProfileModal({ isOpen, onClose, candidate }: CandidateProfileModalProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  if (!isOpen || !candidate) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-blue-600 flex-shrink-0 shadow-lg relative">
              {candidate.photoUrl && !imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 bg-blue-600 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  <img
                    src={candidate.photoUrl}
                    alt={`${candidate.name} photo`}
                    className="w-full h-full object-cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true)
                      setImageLoading(false)
                    }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl text-gray-900 break-words">{candidate.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600">{candidate.position || 'Candidate'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidate.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                    </div>
                  </div>
                )}
                
                {candidate.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{candidate.phone}</p>
                    </div>
                  </div>
                )}
                
                {candidate.region && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Region</p>
                      <p className="text-sm text-gray-600">{candidate.region}</p>
                    </div>
                  </div>
                )}
                
                {candidate.zone && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Zone</p>
                      <p className="text-sm text-gray-600">
                        {candidate.zone.nameGujarati} ({candidate.zone.name})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Party Information */}
          {candidate.party && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flag className="h-5 w-5 text-green-600" />
                  <span>Party Affiliation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    {candidate.party}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slogan/Motto */}
          {candidate.manifesto && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Quote className="h-5 w-5 text-purple-600" />
                  <span>Slogan & Motto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-800 italic text-center text-lg">
                    "{candidate.manifesto}"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Only show if there's actual meaningful content beyond system-generated data */}
          {candidate.manifesto && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>Manifesto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{candidate.manifesto}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
          <Button onClick={onClose} className="px-4 sm:px-6 w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
