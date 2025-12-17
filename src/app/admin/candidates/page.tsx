"use client";

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    ArrowLeft,
    Filter,
    Download,
    Image,
    File,
    FileText,
    MapPin,
} from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { extractFileKeyFromUrl } from "@/lib/file-utils";

interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    party: string;
    position: string;
    region: string;
    status: string;
    experience: any; // Can be string or parsed object
    education: any; // Can be string or parsed object
    manifesto: string;
    rejectionReason?: string;
    submittedAt: string;
    zone: {
        name: string;
        nameGujarati: string;
        seats: number;
        code: string;
    } | null;
}

interface Zone {
    id: string;
    name: string;
    nameGujarati: string;
    seats: number;
    code: string;
    electionType: string;
}

function CandidatesContent() {
    const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth();
    const searchParams = useSearchParams();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(
        [],
    );
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingZones, setIsLoadingZones] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedCandidate, setSelectedCandidate] =
        useState<Candidate | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showDocumentPreview, setShowDocumentPreview] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<{
        url: string
        title: string
        type: 'aadhaar' | 'photo' | 'proposer_aadhaar'
    } | null>(null);

    // Move useEffect hooks before early returns
    useEffect(() => {
        // Only fetch data if authenticated and admin
        if (isAuthenticated && isAdmin && !authLoading) {
            fetchZones();
        }
    }, [isAuthenticated, isAdmin, authLoading]);

    useEffect(() => {
        // Fetch candidates when a zone is selected
        if (selectedZone) {
            fetchCandidates();
        }
    }, [selectedZone]);

    useEffect(() => {
        // Only filter if we have candidates and are authenticated
        if (isAuthenticated && isAdmin && !authLoading) {
            filterCandidates();
        }
    }, [candidates, searchTerm, statusFilter, isAuthenticated, isAdmin, authLoading]);

    // Handle URL parameters to auto-select candidate from dashboard
    useEffect(() => {
        const candidateId = searchParams.get('candidateId');
        const candidateType = searchParams.get('type');

        if (candidateId && candidates.length > 0) {
            // Find the candidate by ID
            const candidate = candidates.find(c => c.id === candidateId);
            if (candidate) {
                setSelectedCandidate(candidate);
            }
        }
    }, [candidates, searchParams]);

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying authentication...</p>
                </div>
            </div>
        );
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
        );
    }

    const getFileIcon = (fileUrl: string) => {
        if (fileUrl.includes('image') || fileUrl.includes('.jpg') || fileUrl.includes('.jpeg') || fileUrl.includes('.png')) {
            return <Image className="h-4 w-4 text-blue-500" />;
        }
        return <File className="h-4 w-4 text-gray-500" />;
    };

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

    const handleDocumentPreview = async (fileUrl: string, title: string, type: 'aadhaar' | 'photo' | 'proposer_aadhaar') => {
        try {
            console.log('Preview requested for:', fileUrl);
            let finalUrl = fileUrl;
            
            // Check if this is a Storj URL that might need refresh
            if (fileUrl.includes('storj') || fileUrl.includes('link.storjshare')) {
                console.log('Detected Storj URL');
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
                        }
                    }
                }
            } else if (fileUrl.includes('_serverless') || fileUrl.includes('_mock')) {
                // For serverless/mock files, we can't preview them
                alert('This document was uploaded in a serverless environment and cannot be previewed.');
                return;
            } else if (fileUrl.includes('/api/upload/view')) {
                // This is a local file URL, extract the path and use admin endpoint
                console.log('Detected local file URL');
                const pathMatch = fileUrl.match(/path=([^&]+)/);
                if (pathMatch) {
                    const filePath = decodeURIComponent(pathMatch[1]);
                    console.log('Extracted file path:', filePath);
                    
                    // Check if this is a serverless file
                    if (filePath.includes('_serverless') || filePath.includes('_mock')) {
                        console.log('File is serverless, cannot preview');
                        alert('This document was uploaded in a serverless environment and cannot be previewed.');
                        return;
                    }
                    
                    finalUrl = `/api/admin/view-document?path=${encodeURIComponent(filePath)}`;
                } else {
                    console.error('Could not extract path from URL:', fileUrl);
                    alert('Invalid file URL format. Cannot preview this document.');
                    return;
                }
            } else if (fileUrl.startsWith('nominations/')) {
                // This is a direct file path from the database (most common case)
                console.log('Detected database file path');
                finalUrl = `/api/admin/view-document?path=${encodeURIComponent(fileUrl)}`;
            } else if (fileUrl.includes('uploads/') || fileUrl.includes('uploads\\')) {
                // Direct file path, use admin endpoint
                console.log('Detected direct file path');
                finalUrl = `/api/admin/view-document?path=${encodeURIComponent(fileUrl)}`;
            } else {
                console.error('Unknown file URL format:', fileUrl);
                alert('Unknown file format. Cannot preview this document.');
                return;
            }
            
            console.log('Final URL for preview:', finalUrl);
            
            setPreviewDocument({
                url: finalUrl,
                title,
                type
            });
            setShowDocumentPreview(true);
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Failed to preview document. Please try again.');
        }
    };

    function formatBirthDate(dateStr: String) {
        // First, check if the date string is valid to avoid errors
        if (!dateStr || typeof dateStr !== 'string') {
            return "N/A"; // Or return null, or an empty string
        }

        // The input is 'yyyy-dd-mm'
        const parts = dateStr.split('-'); // -> ["yyyy", "dd", "mm"]

        // Ensure the string was in the expected format
        if (parts.length !== 3) {
            return "Invalid Date Format";
        }

        // Rearrange to ["dd", "mm", "yyyy"] and join with a hyphen
        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        return formattedDate; // -> "dd-mm-yyyy"
    }

    const fetchZones = async () => {
        try {
            setIsLoadingZones(true);
            const response = await fetch('/api/zones');
            const data = await response.json();

            if (response.ok) {
                // Filter out Karobari zones - hidden from UI
                let filteredZones = data.zones.filter((zone: Zone) => zone.electionType !== 'KAROBARI_MEMBERS');
                
                // For Yuva Pankh, only show Karnataka & Goa and Raigad zones
                filteredZones = filteredZones.map((zone: Zone) => {
                    if (zone.electionType === 'YUVA_PANK') {
                        if (zone.code !== 'KARNATAKA_GOA' && zone.code !== 'RAIGAD') {
                            return null
                        }
                    }
                    return zone
                }).filter((zone: Zone | null): zone is Zone => zone !== null);
                
                setZones(filteredZones);
            }
        } catch (error) {
            console.error("Error fetching zones:", error);
        } finally {
            setIsLoadingZones(false);
        }
    };

    const fetchCandidates = async () => {
        if (!selectedZone) return;
        
        try {
            setIsLoading(true);
            // Add cache-busting parameter to ensure fresh data
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/admin/candidates?t=${timestamp}&zoneId=${selectedZone.id}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await response.json();

            if (response.ok) {
                setCandidates(data.candidates);
            }
        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterCandidates = () => {
        let filtered = candidates;

        if (searchTerm) {
            filtered = filtered.filter(
                (candidate) =>
                    candidate.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    candidate.party
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    candidate.position
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (candidate) => candidate.status === statusFilter,
            );
        }

        setFilteredCandidates(filtered);
    };

    const updateCandidateStatus = async (
        candidateId: string,
        status: string,
        reason?: string,
    ) => {
        setIsUpdating(true);

        // Optimistic update - immediately update the UI
        const originalCandidates = [...candidates];
        setCandidates(prevCandidates =>
            prevCandidates.map(candidate =>
                candidate.id === candidateId
                    ? { ...candidate, status, rejectionReason: reason || undefined }
                    : candidate
            )
        );

        // Update selected candidate if it's the one being updated
        if (selectedCandidate && selectedCandidate.id === candidateId) {
            setSelectedCandidate(prev =>
                prev ? { ...prev, status, rejectionReason: reason || undefined } : null
            );
        }

        try {
            const response = await fetch(
                `/api/admin/candidates/${candidateId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ status, rejectionReason: reason }),
                },
            );

            if (response.ok) {
                // Refresh data to ensure consistency
                await fetchCandidates();
                setSelectedCandidate(null);
                setRejectionReason("");
            } else {
                // Revert optimistic update on error
                setCandidates(originalCandidates);
                const errorData = await response.json();
                console.error("Error updating candidate:", errorData.error);
                alert(`Failed to update candidate: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            // Revert optimistic update on error
            setCandidates(originalCandidates);
            console.error("Error updating candidate:", error);
            alert("Failed to update candidate. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge className="status-badge status-pending">
                        Pending
                    </Badge>
                );
            case "APPROVED":
                return (
                    <Badge className="status-badge status-approved">
                        Approved
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge className="status-badge status-rejected">
                        Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getStatusCardClass = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
            case "APPROVED":
                return "bg-green-50 border-green-200 hover:bg-green-100";
            case "REJECTED":
                return "bg-red-50 border-red-200 hover:bg-red-100";
            default:
                return "hover:bg-gray-50";
        }
    };

    if (isLoadingZones) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading regions...</p>
                </div>
            </div>
        );
    }

    // Show zone selection if no zone is selected
    if (!selectedZone) {
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
                                        Back to Dashboard
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-2xl text-gray-900">
                                        Candidate Management
                                    </h1>
                                    <p className="text-gray-600">
                                        Select a region to view candidates
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Region Selection */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                            Select Region to Manage Candidates
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {zones.map((zone) => (
                                <Card 
                                    key={zone.id} 
                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => setSelectedZone(zone)}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <MapPin className="h-5 w-5 text-blue-600" />
                                            <span>{zone.name}</span>
                                        </CardTitle>
                                        <CardDescription>
                                            {zone.nameGujarati}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    Election Type:
                                                </span>
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {zone.electionType}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    Seats:
                                                </span>
                                                <span className="text-sm text-gray-900">
                                                    {zone.seats} Seats
                                                </span>
                                            </div>
                                            <div className="pt-4">
                                                <Button className="w-full">
                                                    View Candidates
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading candidates...</p>
                </div>
            </div>
        );
    }

    if (selectedCandidate) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedCandidate(null)}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">
                                        {selectedCandidate.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedCandidate.zone ? (
                                            <span>
                                                <span className="font-medium">{selectedCandidate.zone.name}</span>
                                                <span className="mx-2">•</span>
                                                <span className="text-gray-500">{selectedCandidate.zone.nameGujarati}</span>
                                                <span className="mx-2">•</span>
                                                <span className="text-blue-600 font-medium">{selectedCandidate.zone.seats} seats</span>
                                            </span>
                                        ) : (
                                            selectedCandidate.region
                                        )}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(selectedCandidate.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Contact Information
                                    </h4>
                                    <p>
                                        <strong>Email:</strong>{" "}
                                        {selectedCandidate.email}
                                    </p>
                                    <p>
                                        <strong>Phone:</strong>{" "}
                                        {selectedCandidate.phone}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Election Details
                                    </h4>
                                    <p>
                                        <strong>Region:</strong>{" "}
                                        {selectedCandidate.zone?.name}
                                    </p>
                                    <p>
                                        <strong>Party:</strong>{" "}
                                        {selectedCandidate.party}
                                    </p>
                                </div>
                            </div>

                            {/* Education and Personal Details */}
                            {selectedCandidate.education && (
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Personal Details
                                    </h4>
                                    {typeof selectedCandidate.education ===
                                        "object" ? (
                                        <div className="space-y-2">
                                            <p>
                                                <strong>Gender:</strong>{" "}
                                                {
                                                    selectedCandidate.education
                                                        .gender
                                                }
                                            </p>
                                            <p>
                                                <strong>Date of Birth:</strong>{" "}
                                                {
                                                    formatBirthDate(selectedCandidate.education
                                                        .birthDate)
                                                }
                                            </p>
                                            <p>
                                            </p>
                                            {selectedCandidate.education
                                                .proposerDetails && (
                                                    <div className="mt-4">
                                                        <h5 className="font-medium mb-2">
                                                            Proposer Details
                                                        </h5>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p>
                                                                <strong>
                                                                    Name:
                                                                </strong>{" "}
                                                                {
                                                                    selectedCandidate
                                                                        .education
                                                                        .proposerDetails
                                                                        .name
                                                                }
                                                            </p>
                                                            <p>
                                                                <strong>
                                                                    Father/Spouse Name:
                                                                </strong>{" "}
                                                                {
                                                                    selectedCandidate
                                                                        .education
                                                                        .proposerDetails
                                                                        .fatherSpouse
                                                                }
                                                            </p>
                                                            <p>
                                                                <strong>
                                                                    Address:
                                                                </strong>{" "}
                                                                {
                                                                    selectedCandidate
                                                                        .education
                                                                        .proposerDetails
                                                                        .address
                                                                }
                                                            </p>
                                                            <p>
                                                                <strong>
                                                                    Birth Date:
                                                                </strong>{" "}
                                                                {
                                                                    formatBirthDate(selectedCandidate
                                                                        .education
                                                                        .proposerDetails
                                                                        .birthDate)
                                                                }
                                                            </p>
                                                            <p>
                                                                <strong>
                                                                    Mobile:
                                                                </strong>{" "}
                                                                {
                                                                    selectedCandidate
                                                                        .education
                                                                        .proposerDetails
                                                                        .mobile
                                                                }
                                                            </p>
                                                            <p>
                                                                <strong>
                                                                    Email:
                                                                </strong>{" "}
                                                                {
                                                                    selectedCandidate
                                                                        .education
                                                                        .proposerDetails
                                                                        .email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
                                        <p>{selectedCandidate.education}</p>
                                    )}
                                </div>
                            )}

                            {/* Experience and Additional Details */}
                            {selectedCandidate.experience && (
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Additional Information
                                    </h4>
                                    {typeof selectedCandidate.experience ===
                                        "object" ? (
                                        <div className="space-y-2">
                                            <p>
                                                <strong>Father/Spouse:</strong>{" "}
                                                {
                                                    selectedCandidate.experience
                                                        .fatherSpouse
                                                }
                                            </p>
                                            <p>
                                                <strong>Alias:</strong>{" "}
                                                {
                                                    selectedCandidate.experience
                                                        .alias
                                                }
                                            </p>
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {
                                                    selectedCandidate.experience
                                                        .address
                                                }
                                            </p>
                                            {selectedCandidate.experience
                                                .filePaths && (
                                                    <div className="mt-4">
                                                        <h5 className="font-medium mb-3">
                                                            Uploaded Documents
                                                        </h5>
                                                        <div className="space-y-3">
                                                            {/* Candidate Aadhaar Card */}
                                                            {selectedCandidate.experience.filePaths.candidateAadhaar && (
                                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                                    <div className="flex items-center space-x-3">
                                                                        {getFileIcon(selectedCandidate.experience.filePaths.candidateAadhaar)}
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                Candidate Aadhaar Card
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {getFileName(selectedCandidate.experience.filePaths.candidateAadhaar, 'candidate-aadhaar')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleDocumentPreview(selectedCandidate.experience?.filePaths?.candidateAadhaar, 'Candidate Aadhaar Card', 'aadhaar')}
                                                                            className="text-blue-600 hover:text-blue-700"
                                                                        >
                                                                            <Eye className="h-4 w-4 mr-1" />
                                                                            Preview
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                downloadFile(
                                                                                    selectedCandidate.experience.filePaths.candidateAadhaar,
                                                                                    getFileName(selectedCandidate.experience.filePaths.candidateAadhaar, 'candidate-aadhaar')
                                                                                );
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700"
                                                                        >
                                                                            <Download className="h-4 w-4 mr-1" />
                                                                            Download
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Candidate Photo */}
                                                            {selectedCandidate.experience.filePaths.candidatePhoto && (
                                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                                    <div className="flex items-center space-x-3">
                                                                        {getFileIcon(selectedCandidate.experience.filePaths.candidatePhoto)}
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                Candidate Photo
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {getFileName(selectedCandidate.experience.filePaths.candidatePhoto, 'candidate-photo')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleDocumentPreview(selectedCandidate.experience.filePaths.candidatePhoto, 'Candidate Photo', 'photo')}
                                                                            className="text-blue-600 hover:text-blue-700"
                                                                        >
                                                                            <Eye className="h-4 w-4 mr-1" />
                                                                            Preview
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                downloadFile(
                                                                                    selectedCandidate.experience.filePaths.candidatePhoto,
                                                                                    getFileName(selectedCandidate.experience.filePaths.candidatePhoto, 'candidate-photo')
                                                                                );
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700"
                                                                        >
                                                                            <Download className="h-4 w-4 mr-1" />
                                                                            Download
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Proposer Aadhaar Card */}
                                                            {selectedCandidate.experience.filePaths.proposerAadhaar && (
                                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                                    <div className="flex items-center space-x-3">
                                                                        {getFileIcon(selectedCandidate.experience.filePaths.proposerAadhaar)}
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                Proposer Aadhaar Card
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {getFileName(selectedCandidate.experience.filePaths.proposerAadhaar, 'proposer-aadhaar')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleDocumentPreview(selectedCandidate.experience.filePaths.proposerAadhaar, 'Proposer Aadhaar Card', 'proposer_aadhaar')}
                                                                            className="text-blue-600 hover:text-blue-700"
                                                                        >
                                                                            <Eye className="h-4 w-4 mr-1" />
                                                                            Preview
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                downloadFile(
                                                                                    selectedCandidate.experience.filePaths.proposerAadhaar,
                                                                                    getFileName(selectedCandidate.experience.filePaths.proposerAadhaar, 'proposer-aadhaar')
                                                                                );
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700"
                                                                        >
                                                                            <Download className="h-4 w-4 mr-1" />
                                                                            Download
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Show message if no files are uploaded */}
                                                            {!selectedCandidate.experience.filePaths.candidateAadhaar &&
                                                                !selectedCandidate.experience.filePaths.candidatePhoto &&
                                                                !selectedCandidate.experience.filePaths.proposerAadhaar && (
                                                                    <div className="text-center py-6 text-gray-500">
                                                                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                                        <p>No documents uploaded for this candidate</p>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
                                        <p>{selectedCandidate.experience}</p>
                                    )}
                                </div>
                            )}

                            {/* <div>
                                <h4 className="font-semibold mb-2">
                                    Manifesto
                                </h4>
                                <p className="text-gray-700">
                                    {selectedCandidate.manifesto}
                                </p>
                            </div> */}

                            {/* Only show rejection reason if it's an actual rejection */}
                            {selectedCandidate.rejectionReason &&
                                selectedCandidate.status === "REJECTED" && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-red-600">
                                            Rejection Reason
                                        </h4>
                                        <p className="text-red-700">
                                            {selectedCandidate.rejectionReason}
                                        </p>
                                    </div>
                                )}

                            {selectedCandidate.status === "PENDING" && (
                                <div className="border-t pt-6">
                                    <h4 className="font-semibold mb-4">
                                        Review Actions
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Rejection Reason (if rejecting)
                                            </label>
                                            <Textarea
                                                value={rejectionReason}
                                                onChange={(e) =>
                                                    setRejectionReason(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter reason for rejection..."
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex space-x-4">
                                            <Button
                                                onClick={() =>
                                                    updateCandidateStatus(
                                                        selectedCandidate.id,
                                                        "APPROVED",
                                                    )
                                                }
                                                disabled={isUpdating}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    updateCandidateStatus(
                                                        selectedCandidate.id,
                                                        "REJECTED",
                                                        rejectionReason,
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    !rejectionReason.trim()
                                                }
                                                variant="destructive"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

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
                                        downloadFile(
                                            previewDocument.url,
                                            getFileName(previewDocument.url, previewDocument.type)
                                        );
                                    }}
                                    className="text-green-600 hover:text-green-700"
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Button 
                                variant="outline"
                                onClick={() => setSelectedZone(null)}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Regions
                            </Button>
                            <div>
                                <h1 className="text-2xl text-gray-900">
                                    Candidate Management
                                </h1>
                                <p className="text-gray-600">
                                    {selectedZone?.name} - {selectedZone?.electionType} ({selectedZone?.seats} seats)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search candidates..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="PENDING">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="APPROVED">
                                            Approved
                                        </SelectItem>
                                        <SelectItem value="REJECTED">
                                            Rejected
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Candidates List */}
                <div className="space-y-4">
                    {filteredCandidates.length > 0 ? (
                        filteredCandidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${getStatusCardClass(candidate.status)}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <h4 className="font-medium">
                                                {candidate.name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {candidate.zone ? (
                                                    <span>
                                                        <span className="font-medium">{candidate.zone.name}</span>
                                                        <span className="mx-2">•</span>
                                                        <span className="text-gray-500">{candidate.zone.nameGujarati}</span>
                                                        <span className="mx-2">•</span>
                                                        <span className="text-blue-600 font-medium">{candidate.zone.seats} seats</span>
                                                    </span>
                                                ) : (
                                                    candidate.region
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Submitted: {new Date(candidate.submittedAt).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {getStatusBadge(candidate.status)}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        Review
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 mb-2">No candidates found</p>
                            <p className="text-sm text-gray-400">
                                {searchTerm || statusFilter !== "all"
                                    ? "Try adjusting your search or filter criteria."
                                    : "No candidates have registered yet."}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function CandidatesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <CandidatesContent />
        </Suspense>
    );
}
