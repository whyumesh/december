'use client'

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download,
  Eye,
  Upload,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { extractFileKeyFromUrl } from '@/lib/file-utils'

interface NominationData {
  id: string
  userId?: string
  name: string
  email: string
  phone: string
  position: string
  region: string
  status: string
  submittedAt: string
  rejectionReason?: string
  documents?: {
    candidateAadhaar: string
    candidatePhoto: string
    proposerAadhaar: string
    proposerDetails: any
  }
  candidateDetails?: {
    fatherSpouse: string
    alias: string
    address: string
    gender: string
    birthDate: string
    filePaths: {
      candidateAadhaar?: string
      candidatePhoto?: string
      proposerAadhaar?: string
    }
  }
  proposerDetails?: {
    name: string
    fatherSpouse: string
    address: string
    birthDate: string
    mobile: string
    email: string
  }
}

export default function YuvaPankNominationsPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth()
  const [nominations, setNominations] = useState<NominationData[]>([])
  const [selectedNomination, setSelectedNomination] = useState<NominationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<{
    url: string
    title: string
    type: 'aadhaar' | 'photo' | 'proposer_aadhaar'
  } | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  
  // File input refs
  const candidateAadhaarRef = useRef<HTMLInputElement>(null)
  const candidatePhotoRef = useRef<HTMLInputElement>(null)
  const proposerAadhaarRef = useRef<HTMLInputElement>(null)

  const getFileName = (fileUrl: string, type: string) => {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      return fileName || `${type}.pdf`;
    } catch {
      return `${type}.pdf`;
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      let finalUrl = fileUrl;
      
      // First, try to fetch with the existing URL
      let response = await fetch(fileUrl);
      
      // If the URL is expired (403 or 400), generate a fresh one
      if (!response.ok && (response.status === 403 || response.status === 400)) {
        console.log('URL expired, generating fresh URL...');
        
        // Extract file key from the URL
        const fileKey = extractFileKeyFromUrl(fileUrl);
        if (fileKey) {
          // Generate fresh URL
          const freshUrlResponse = await fetch('/api/admin/view-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileKey }),
          });
          
          if (freshUrlResponse.ok) {
            const data = await freshUrlResponse.json();
            finalUrl = data.downloadUrl;
            response = await fetch(finalUrl);
          }
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create object URL
      const objectUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link method
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.click();
    }
  };
  const [error, setError] = useState('')

  const handleDocumentPreview = async (fileUrl: string, title: string, type: 'aadhaar' | 'photo' | 'proposer_aadhaar') => {
    try {
      console.log('Preview requested for:', fileUrl, 'Type:', type);
      
      // Determine if this is a fileKey (starts with nominations/) or a full URL
      let fileKey = fileUrl;
      
      // If it's a full URL, extract the file key
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Try to extract file key from Storj URL
        const keyMatch = fileUrl.match(/nominations\/[^?]+/);
        if (keyMatch) {
          fileKey = keyMatch[0];
        } else {
          // Try the extractFileKeyFromUrl function
          const extracted = extractFileKeyFromUrl(fileUrl);
          if (extracted) {
            fileKey = extracted;
          } else {
            // Check if URL is still valid
            try {
              const testResponse = await fetch(fileUrl, { method: 'HEAD' });
              if (testResponse.ok) {
                // URL is valid, use it directly
                setPreviewDocument({ url: fileUrl, title, type });
                setShowDocumentPreview(true);
                return;
              }
            } catch {
              // URL expired or invalid
            }
            alert('Cannot extract file key from URL. Please ensure the document was uploaded correctly.');
            return;
          }
        }
      } else if (fileUrl.includes('/api/upload/view')) {
        // Legacy local file URL - extract path
        const pathMatch = fileUrl.match(/path=([^&]+)/);
        if (pathMatch) {
          fileKey = decodeURIComponent(pathMatch[1]);
        } else {
          alert('Invalid file URL format. Cannot preview this document.');
          return;
        }
      }
      
      // Generate fresh URL from fileKey
      const response = await fetch('/api/admin/view-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate document URL');
      }
      
      const data = await response.json();
      const finalUrl = data.downloadUrl;
      
      setPreviewDocument({ url: finalUrl, title, type });
      setShowDocumentPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert(`Failed to preview document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Move useEffect before early returns
  useEffect(() => {
    // Only fetch data if authenticated and admin
    if (isAuthenticated && isAdmin && !authLoading) {
      fetchNominations()
    }
  }, [isAuthenticated, isAdmin, authLoading])

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600 mx-auto"></div>
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

    const fetchNominations = async () => {
      try {
        // Add cache-busting query parameter and headers
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/admin/yuva-pank-nominations?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
        const data = await response.json()
      
      if (response.ok) {
        setNominations(data.nominations)
      } else {
        setError(data.error || 'Failed to load nominations')
      }
    } catch (error) {
      setError('An error occurred while loading nominations')
    } finally {
      setIsLoading(false)
    }
  }

  const updateNominationStatus = async (nominationId: string, status: string, reason?: string) => {
    setIsUpdating(true)
    setError('')
    
    try {
      // Validate rejection reason if rejecting
      if (status === 'REJECTED' && !reason?.trim()) {
        setError('Rejection reason is required when rejecting a nomination')
        setIsUpdating(false)
        return
      }

      const response = await fetch(`/api/admin/yuva-pank-nominations/${nominationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, rejectionReason: reason }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Show success message
        alert(status === 'APPROVED' 
          ? '✅ Nomination approved successfully!' 
          : '✅ Nomination rejected successfully!')
        
        // Refresh nominations list
        await fetchNominations()
        
        // Close the detail view and reset form
        setSelectedNomination(null)
        setRejectionReason('')
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to update nomination'
        setError(errorMessage)
        alert(`❌ Error: ${errorMessage}`)
      }
    } catch (error) {
      const errorMessage = 'An error occurred while updating nomination'
      setError(errorMessage)
      console.error('Error updating nomination:', error)
      alert(`❌ ${errorMessage}. Please try again.`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDocumentUpload = async () => {
    if (!selectedNomination) return

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      
      // Add files if they exist
      if (candidateAadhaarRef.current?.files?.[0]) {
        formData.append('candidateAadhaar', candidateAadhaarRef.current.files[0])
      }
      if (candidatePhotoRef.current?.files?.[0]) {
        formData.append('candidatePhoto', candidatePhotoRef.current.files[0])
      }
      if (proposerAadhaarRef.current?.files?.[0]) {
        formData.append('proposerAadhaar', proposerAadhaarRef.current.files[0])
      }

      const response = await fetch(`/api/admin/yuva-pank-nominations/${selectedNomination.id}/upload-documents`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadSuccess('Documents uploaded successfully!')
        // Refresh the nominations to show updated documents
        await fetchNominations()
        // Reset file inputs
        if (candidateAadhaarRef.current) candidateAadhaarRef.current.value = ''
        if (candidatePhotoRef.current) candidatePhotoRef.current.value = ''
        if (proposerAadhaarRef.current) proposerAadhaarRef.current.value = ''
        // Close modal after a short delay
        setTimeout(() => {
          setShowUploadModal(false)
          setUploadSuccess('')
        }, 2000)
      } else {
        setUploadError(data.error || 'Failed to upload documents')
      }
    } catch (error) {
      setUploadError('An error occurred while uploading documents')
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="status-badge status-pending bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'SUBMITTED':
        return <Badge className="status-badge status-pending bg-blue-100 text-blue-800">Submitted</Badge>
      case 'APPROVED':
        return <Badge className="status-badge status-approved bg-green-100 text-green-800">Approved</Badge>
      case 'REJECTED':
        return <Badge className="status-badge status-rejected bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading nominations...</p>
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
              <Link href="/admin/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900">Yuva Pankh Nominations</h1>
                <p className="text-gray-600">Review and manage Yuva Pankh Elections (2026 – 2029) nominations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Nominations List */}
        <div className="grid gap-6">
          {nominations.length > 0 ? (
            nominations.map((nomination) => (
              <Card key={nomination.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold">{nomination.name}</h3>
                        {getStatusBadge(nomination.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Region:</strong> {nomination.region}
                        </div>
                        <div>
                          <strong>Submitted:</strong> {new Date(nomination.submittedAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Email:</strong> {nomination.email} • <strong>Phone:</strong> {nomination.phone}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNomination(nomination)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No nominations found</h3>
                  <p className="text-gray-500">
                    No Yuva Pankh nominations have been submitted yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Nomination Review Modal */}
        {selectedNomination && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Nomination Review</CardTitle>
                    <CardDescription>
                      Review nomination details for {selectedNomination.name}
                      {selectedNomination.userId && (
                        <span className="text-xs text-gray-500 ml-2">(User ID: {selectedNomination.userId})</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNomination(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Candidate Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Candidate Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Name:</strong> {selectedNomination.name}
                    </div>
                    <div>
                      <strong>Father/Husband Name:</strong> {selectedNomination.candidateDetails?.fatherSpouse || 'Not provided'}
                    </div>
                    <div>
                      <strong>Alias/Nickname:</strong> {selectedNomination.candidateDetails?.alias || 'Not provided'}
                    </div>
                    <div>
                      <strong>Gender:</strong> {selectedNomination.candidateDetails?.gender || 'Not provided'}
                    </div>
                    <div>
                      <strong>Birth Date:</strong> {selectedNomination.candidateDetails?.birthDate || 'Not provided'}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedNomination.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedNomination.phone}
                    </div>
                    <div>
                      <strong>Region:</strong> {selectedNomination.region}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedNomination.status}
                    </div>
                  </div>
                  <div className="mt-4">
                    <strong>Permanent Address:</strong> {selectedNomination.candidateDetails?.address || 'Not provided'}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Submitted Documents</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload Documents</span>
                    </Button>
                  </div>
                  
                  {(selectedNomination.candidateDetails?.filePaths || selectedNomination.documents) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span>Candidate Aadhaar Card (PDF)</span>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fileUrl = selectedNomination.candidateDetails?.filePaths?.candidateAadhaar || selectedNomination.documents?.candidateAadhaar;
                              if (fileUrl) {
                                handleDocumentPreview(fileUrl, 'Candidate Aadhaar Card', 'aadhaar');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fileUrl = selectedNomination.candidateDetails?.filePaths?.candidateAadhaar || selectedNomination.documents?.candidateAadhaar;
                              if (fileUrl) {
                                downloadFile(
                                  fileUrl,
                                  getFileName(fileUrl, 'candidate-aadhaar')
                                );
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span>Candidate Photo (JPEG/PNG)</span>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fileUrl = selectedNomination.candidateDetails?.filePaths?.candidatePhoto || selectedNomination.documents?.candidatePhoto;
                              if (fileUrl) {
                                handleDocumentPreview(fileUrl, 'Candidate Photo', 'photo');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fileUrl = selectedNomination.candidateDetails?.filePaths?.candidatePhoto || selectedNomination.documents?.candidatePhoto;
                              if (fileUrl) {
                                downloadFile(
                                  fileUrl,
                                  getFileName(fileUrl, 'candidate-photo')
                                );
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span>Proposer Aadhaar Card (PDF)</span>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fileUrl = selectedNomination.candidateDetails?.filePaths?.proposerAadhaar || selectedNomination.documents?.proposerAadhaar;
                              if (fileUrl) {
                                handleDocumentPreview(fileUrl, 'Proposer Aadhaar Card', 'proposer_aadhaar');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const fileUrl = selectedNomination.candidateDetails?.filePaths?.proposerAadhaar || selectedNomination.documents?.proposerAadhaar;
                              if (fileUrl) {
                                downloadFile(
                                  fileUrl,
                                  getFileName(fileUrl, 'proposer-aadhaar')
                                );
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!(selectedNomination.candidateDetails?.filePaths || selectedNomination.documents) && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm">Click &quot;Upload Documents&quot; to add candidate documents</p>
                    </div>
                  )}
                </div>

                {/* Proposer Details */}
                {selectedNomination.proposerDetails && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Proposer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong>Name:</strong> {selectedNomination.proposerDetails.name || 'Not provided'}
                      </div>
                      <div>
                        <strong>Father/Husband Name:</strong> {selectedNomination.proposerDetails.fatherSpouse || 'Not provided'}
                      </div>
                      <div>
                        <strong>Mobile:</strong> {selectedNomination.proposerDetails.mobile || 'Not provided'}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedNomination.proposerDetails.email || 'Not provided'}
                      </div>
                      <div>
                        <strong>Birth Date:</strong> {selectedNomination.proposerDetails.birthDate || 'Not provided'}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Address:</strong> {selectedNomination.proposerDetails.address || 'Not provided'}
                    </div>
                  </div>
                )}

                {/* Action Buttons - Show for PENDING and SUBMITTED statuses */}
                {(selectedNomination.status === 'PENDING' || selectedNomination.status === 'SUBMITTED') && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Review Actions</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Rejection Reason <span className="text-gray-400">(required if rejecting)</span>
                        </label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection (required for rejection)..."
                          rows={3}
                          className="w-full"
                        />
                      </div>
                      <div className="flex space-x-4">
                        <Button
                          onClick={() => updateNominationStatus(selectedNomination.id, 'APPROVED')}
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Approve Nomination
                        </Button>
                        <Button
                          onClick={() => updateNominationStatus(selectedNomination.id, 'REJECTED', rejectionReason)}
                          disabled={isUpdating || !rejectionReason.trim()}
                          variant="destructive"
                          className="px-6 py-2"
                          size="lg"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Reject Nomination
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show current status if already approved or rejected */}
                {selectedNomination.status === 'APPROVED' && (
                  <div className="border-t pt-6 mt-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 font-medium">
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        This nomination has been approved.
                      </p>
                    </div>
                  </div>
                )}

                {selectedNomination.status === 'REJECTED' && selectedNomination.rejectionReason && (
                  <div className="border-t pt-6 mt-6">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800 font-medium mb-2">
                        <XCircle className="h-4 w-4 inline mr-2" />
                        This nomination has been rejected.
                      </p>
                      <p className="text-sm text-red-700">
                        <strong>Reason:</strong> {selectedNomination.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Document Preview Modal */}
        {showDocumentPreview && previewDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {previewDocument.title}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDocumentPreview(false);
                    setPreviewDocument(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {previewDocument.type === 'photo' ? (
                  <div className="flex justify-center">
                    <img
                      src={previewDocument.url}
                      alt={previewDocument.title}
                      className="max-w-full max-h-[70vh] object-contain border border-gray-300 rounded"
                      onError={(e) => {
                        console.error('Image failed to load:', previewDocument.url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewDocument.url}
                    className="w-full h-[70vh] border border-gray-300 rounded"
                    title={previewDocument.title}
                    onError={() => {
                      console.error('Document failed to load:', previewDocument.url);
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between p-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (previewDocument.url) {
                      downloadFile(
                        previewDocument.url,
                        getFileName(previewDocument.url, previewDocument.type)
                      );
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDocumentPreview(false);
                    setPreviewDocument(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document Upload Modal */}
        {showUploadModal && selectedNomination && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Upload Documents</CardTitle>
                    <CardDescription>
                      Upload documents for {selectedNomination.name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false)
                      setUploadError('')
                      setUploadSuccess('')
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {uploadError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700">{uploadError}</span>
                    </div>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700">{uploadSuccess}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Candidate Aadhaar Card (PDF)
                    </label>
                    <input
                      ref={candidateAadhaarRef}
                      type="file"
                      accept=".pdf"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Candidate Photo (JPEG/PNG)
                    </label>
                    <input
                      ref={candidatePhotoRef}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Proposer Aadhaar Card (PDF)
                    </label>
                    <input
                      ref={proposerAadhaarRef}
                      type="file"
                      accept=".pdf"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false)
                      setUploadError('')
                      setUploadSuccess('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDocumentUpload}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
