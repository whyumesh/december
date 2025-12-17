"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    ArrowLeft,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    Download,
    Eye,
    Image,
    File,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { viewDocument, downloadDocument } from "@/lib/document-viewer";

interface CandidateDetails {
    name: string;
    email: string;
    phone: string;
    fatherSpouse: string;
    alias: string;
    address: string;
    gender: string;
    birthDate: string;
    filePaths: {
        candidateAadhaar?: string;
        candidatePhoto?: string;
        proposerAadhaar?: string;
    };
}

interface ProposerDetails {
    name: string;
    fatherSpouse: string;
    address: string;
    birthDate: string;
    mobile: string;
    email: string;
}

interface NominationData {
    id: string;
    name: string;
    region: string;
    status: string;
    submittedAt: string;
    rejectionReason?: string;
    candidateDetails: CandidateDetails;
    proposerDetails: ProposerDetails;
}

export default function CandidateDashboard() {
    const [nomination, setNomination] = useState<NominationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showNominationDetails, setShowNominationDetails] = useState(false);
    const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Function to format date from YYYY-MM-DD to DD/MM/YYYY
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    };

    // Function to get zone name by ID
    const getZoneName = (zoneId: string): string => {
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.name : zoneId; // Fallback to ID if zone not found
    };

    useEffect(() => {
        fetchNominationData();
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const response = await fetch('/api/zones?electionType=YUVA_PANK');
            const data = await response.json();
            if (response.ok) {
                setZones(data.zones || []);
            }
        } catch (error) {
            console.error('Error fetching zones:', error);
        }
    };

    const fetchNominationData = async () => {
        try {
            // Add cache-busting parameter to ensure fresh data
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/candidate/dashboard?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await response.json();

            if (response.ok) {
                setNomination(data.nomination);
            } else {
                setError(data.error || "Failed to load nomination data");
            }
        } catch (error) {
            setError("An error occurred while loading data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawNomination = async () => {
        if (!withdrawReason.trim()) {
            alert('Please provide a reason for withdrawal');
            return;
        }

        setIsWithdrawing(true);
        try {
            const response = await fetch('/api/candidate/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: withdrawReason }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Nomination withdrawn successfully. You will be redirected to the home page.');
                window.location.href = '/';
            } else {
                alert(data.error || 'Failed to withdraw nomination');
            }
        } catch (error) {
            console.error('Error withdrawing nomination:', error);
            alert('An error occurred while withdrawing nomination');
        } finally {
            setIsWithdrawing(false);
            setShowWithdrawModal(false);
            setWithdrawReason('');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge className="status-badge status-pending">
                        Pending Review
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case "APPROVED":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "REJECTED":
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getFileIcon = (fileUrl: string) => {
        if (fileUrl.includes('image') || fileUrl.includes('.jpg') || fileUrl.includes('.jpeg') || fileUrl.includes('.png')) {
            return <Image className="h-5 w-5 text-blue-500" />;
        }
        return <File className="h-5 w-5 text-gray-500" />;
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
            // Fetch the file
            const response = await fetch(fileUrl);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading your dashboard...
                    </p>
                </div>
                </div>
                
                {/* Footer */}
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <Link href="/candidate/login">
                                <Button variant="outline" className="text-sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl text-gray-900">
                                    Candidate Dashboard
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600">
                                    Manage your nomination and election details
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {!nomination ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Nomination Found
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    You haven't submitted a nomination yet.
                                    Start by filling out the nomination form.
                                </p>
                                <Link href="/candidate/nomination">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Submit Nomination
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Nomination Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    {getStatusIcon(nomination.status)}
                                    <span>Nomination Status</span>
                                </CardTitle>
                                <CardDescription>
                                    Current status of your Yuva Pankh nomination
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {nomination.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Submitted:{" "}
                                            {formatDateForDisplay(nomination.submittedAt)}
                                        </p>
                                    </div>
                                    {getStatusBadge(nomination.status)}
                                </div>

                                {nomination.status === "PENDING" && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <h4 className="font-medium text-yellow-800">
                                                    Under Review
                                                </h4>
                                                <p className="text-sm text-yellow-700">
                                                    Your nomination is currently
                                                    being reviewed by the admin.
                                                    You will be notified once a
                                                    decision is made.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {nomination.status === "APPROVED" && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <h4 className="font-medium text-green-800">
                                                    Nomination Approved
                                                </h4>
                                                <p className="text-sm text-green-700">
                                                    Congratulations! Your
                                                    nomination has been
                                                    approved. You are now
                                                    eligible to participate in
                                                    the election.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {nomination.status === "REJECTED" && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                        <div className="flex items-center space-x-2">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                            <div>
                                                <h4 className="font-medium text-red-800">
                                                    Nomination Rejected
                                                </h4>
                                                <p className="text-sm text-red-700 mb-2">
                                                    Your nomination has been
                                                    rejected. Please review the
                                                    reason below and consider
                                                    resubmitting.
                                                </p>
                                                {nomination.rejectionReason && (
                                                    <div className="mt-2 p-3 bg-red-100 rounded-md">
                                                        <p className="text-sm text-red-800">
                                                            <strong>
                                                                Reason:
                                                            </strong>{" "}
                                                            {
                                                                nomination.rejectionReason
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick File Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                                <CardDescription>
                                    Status of your submitted documents
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        {getFileIcon(nomination.candidateDetails.filePaths.candidateAadhaar || '')}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Aadhaar Card</p>
                                            <p className="text-xs text-gray-500">
                                                {nomination.candidateDetails.filePaths.candidateAadhaar ? '✓ Uploaded' : '✗ Not uploaded'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        {getFileIcon(nomination.candidateDetails.filePaths.candidatePhoto || '')}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Photo</p>
                                            <p className="text-xs text-gray-500">
                                                {nomination.candidateDetails.filePaths.candidatePhoto ? '✓ Uploaded' : '✗ Not uploaded'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        {getFileIcon(nomination.candidateDetails.filePaths.proposerAadhaar || '')}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Proposer Aadhaar</p>
                                            <p className="text-xs text-gray-500">
                                                {nomination.candidateDetails.filePaths.proposerAadhaar ? '✓ Uploaded' : '✗ Not uploaded'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Nomination Details
                                    </CardTitle>
                                    <CardDescription>
                                        View your submitted nomination
                                        information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                            setShowNominationDetails(
                                                !showNominationDetails,
                                            )
                                        }
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        {showNominationDetails
                                            ? "Hide Nomination"
                                            : "View Nomination"}
                                    </Button>
                                    
                                    {(nomination.status === "PENDING" || nomination.status === "SUBMITTED") && (
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => setShowWithdrawModal(true)}
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Withdraw Nomination
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {nomination.status === "REJECTED" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Resubmit Nomination
                                        </CardTitle>
                                        <CardDescription>
                                            Submit a new nomination after
                                            addressing the issues
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/candidate/nomination">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Resubmit Nomination
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}

                            {nomination.status === "APPROVED" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Election Information
                                        </CardTitle>
                                        <CardDescription>
                                            Access election details and voting
                                            information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/elections/yuva-pank">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                                <Users className="h-4 w-4 mr-2" />
                                                View Election Details
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Nomination Details Modal */}
                        {showNominationDetails && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <FileText className="h-5 w-5" />
                                        <span>Nomination Details</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Complete information about your
                                        submitted nomination
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Candidate Information */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                                                Candidate Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Full Name:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .candidateDetails
                                                                    .name
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Father/Husband Name:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .candidateDetails
                                                                    .fatherSpouse
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Alias/Nickname:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {nomination
                                                                .candidateDetails
                                                                .alias ||
                                                                "Not provided"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Gender:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .candidateDetails
                                                                    .gender
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Date of Birth:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {formatDateForDisplay(nomination.candidateDetails.birthDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Email:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .candidateDetails
                                                                    .email
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Mobile Number:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .candidateDetails
                                                                    .phone
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Permanent Address:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .candidateDetails
                                                                    .address
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Zone/Region:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {getZoneName(nomination.region)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Proposer Information */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                                                Proposer Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Proposer Name:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .proposerDetails
                                                                    .name
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Father/Husband Name:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .proposerDetails
                                                                    .fatherSpouse
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Date of Birth:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {formatDateForDisplay(nomination.proposerDetails.birthDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Email:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .proposerDetails
                                                                    .email
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Mobile Number:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .proposerDetails
                                                                    .mobile
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Address:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                nomination
                                                                    .proposerDetails
                                                                    .address
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Document Information */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                                                Submitted Documents
                                            </h4>
                                            <div className="space-y-3">
                                                {/* Candidate Aadhaar Card */}
                                                {nomination.candidateDetails.filePaths.candidateAadhaar && (
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center space-x-3">
                                                            {getFileIcon(nomination.candidateDetails.filePaths.candidateAadhaar)}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    Candidate Aadhaar Card
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {getFileName(nomination.candidateDetails.filePaths.candidateAadhaar, 'candidate-aadhaar')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => viewDocument(nomination.candidateDetails.filePaths.candidateAadhaar!)}
                                                                className="text-blue-600 hover:text-blue-700"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (nomination.candidateDetails.filePaths.candidateAadhaar) {
                                                                        downloadDocument(
                                                                            nomination.candidateDetails.filePaths.candidateAadhaar,
                                                                            getFileName(nomination.candidateDetails.filePaths.candidateAadhaar, 'candidate-aadhaar')
                                                                        );
                                                                    }
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
                                                {nomination.candidateDetails.filePaths.candidatePhoto && (
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center space-x-3">
                                                            {getFileIcon(nomination.candidateDetails.filePaths.candidatePhoto)}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    Candidate Photo
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {getFileName(nomination.candidateDetails.filePaths.candidatePhoto, 'candidate-photo')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => viewDocument(nomination.candidateDetails.filePaths.candidatePhoto!)}
                                                                className="text-blue-600 hover:text-blue-700"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (nomination.candidateDetails.filePaths.candidatePhoto) {
                                                                        downloadDocument(
                                                                            nomination.candidateDetails.filePaths.candidatePhoto,
                                                                            getFileName(nomination.candidateDetails.filePaths.candidatePhoto, 'candidate-photo')
                                                                        );
                                                                    }
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
                                                {nomination.candidateDetails.filePaths.proposerAadhaar && (
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center space-x-3">
                                                            {getFileIcon(nomination.candidateDetails.filePaths.proposerAadhaar)}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    Proposer Aadhaar Card
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {getFileName(nomination.candidateDetails.filePaths.proposerAadhaar, 'proposer-aadhaar')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => viewDocument(nomination.candidateDetails.filePaths.proposerAadhaar!)}
                                                                className="text-blue-600 hover:text-blue-700"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (nomination.candidateDetails.filePaths.proposerAadhaar) {
                                                                        downloadDocument(
                                                                            nomination.candidateDetails.filePaths.proposerAadhaar,
                                                                            getFileName(nomination.candidateDetails.filePaths.proposerAadhaar, 'proposer-aadhaar')
                                                                        );
                                                                    }
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
                                                {!nomination.candidateDetails.filePaths.candidateAadhaar && 
                                                 !nomination.candidateDetails.filePaths.candidatePhoto && 
                                                 !nomination.candidateDetails.filePaths.proposerAadhaar && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                                        <p>No documents uploaded yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submission Information */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                                                Submission Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Submitted On:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {formatDateForDisplay(nomination.submittedAt)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Status:
                                                        </span>
                                                        <div className="mt-1">
                                                            {getStatusBadge(
                                                                nomination.status,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {nomination.rejectionReason && (
                                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                                <h4 className="font-semibold text-red-800 mb-2">
                                                    Rejection Reason
                                                </h4>
                                                <p className="text-sm text-red-700">
                                                    {nomination.rejectionReason}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setShowNominationDetails(
                                                            false,
                                                        )
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    Close Details
                                                </Button>
                                                {nomination.status ===
                                                    "REJECTED" && (
                                                    <Link
                                                        href="/candidate/nomination"
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Resubmit Nomination
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Help Section */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                Need Help?
                            </h3>
                            <p className="text-xs text-blue-700 mb-3">
                                Contact our support team for any assistance with
                                your nomination or dashboard:
                            </p>
                            <div className="space-y-1 text-xs text-blue-800">
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Jay Deepak Bhutada:
                                    </span>
                                    <a 
                                        href="tel:+919820216044" 
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                    >
                                        9820216044
                                    </a>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Aditya Nirmal Mall:
                                    </span>
                                    <a 
                                        href="tel:+918097758892" 
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                    >
                                        8097758892
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            
            {/* Footer */}
            <Footer />

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center space-x-2 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Withdraw Nomination
                            </h3>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to withdraw your nomination? This action cannot be undone and your nomination will be permanently removed from the system.
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for withdrawal (required)
                            </label>
                            <textarea
                                value={withdrawReason}
                                onChange={(e) => setWithdrawReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={3}
                                placeholder="Please provide a reason for withdrawing your nomination..."
                            />
                        </div>
                        
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawReason('');
                                }}
                                disabled={isWithdrawing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleWithdrawNomination}
                                disabled={isWithdrawing || !withdrawReason.trim()}
                            >
                                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Nomination'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
