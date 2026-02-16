"use client";

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Users,
    User,
    Vote,
    UserCheck,
    UserX,
    BarChart3,
    Download,
    Upload,
    Settings,
    LogOut,
    MapPin,
    Eye,
    Image,
    File,
    FileIcon,
    FileText,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Building,
    Calendar,
    Copy,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { extractFileKeyFromUrl } from "@/lib/file-utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from '@/components/ChartsWrapper';

interface CommitteeStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface VoterStatistics {
    total: number;
    active: number;
    inactive: number;
    voted: number;
    notVoted: number;
    votePercentage: string;
    gender: {
        male: number;
        female: number;
        other: number;
    };
    ageDistribution: {
        '18-25': number;
        '26-35': number;
        '36-45': number;
        '46-55': number;
        '56-65': number;
        '65+': number;
        unknown: number;
    };
    trusteeEligible: number;
    dataQuality: {
        withDob: number;
        withoutDob: number;
        dobPercentage: string;
    };
    zoneAssignments: {
        yuvaPankh: number;
        trustee: number;
        unassigned: number;
    };
    regionDistribution: Array<{ region: string; count: number }>;
    yuvaPankZoneDistribution: Array<{ zoneId: string; zoneName: string; zoneNameGujarati: string; zoneCode: string; count: number }>;
    trusteeZoneDistribution: Array<{ zoneId: string; zoneName: string; zoneNameGujarati: string; zoneCode: string; count: number }>;
}

interface DashboardStats {
    yuvaPankh: CommitteeStats;
    karobari: CommitteeStats;
    totalVoters: number;
    totalVotes: number;
    voterStats?: VoterStatistics;
}

interface OfflineVoteZoneCount {
    zoneId: string;
    zoneName: string;
    count: number;
}

interface OfflineVoteStats {
    total: number;
    merged: number;
    unmerged: number;
    byZone?: OfflineVoteZoneCount[];
}

interface RegionTurnout {
    zoneId: string;
    zoneCode: string;
    zoneName: string;
    zoneNameGujarati: string;
    seats: number;
    totalVoters: number;
    totalVotes: number;
    uniqueVoters?: number;
    turnoutPercentage: number;
    actualVotes?: number;
    notaVotes?: number;
}

interface ResultsData {
    karobari?: {
        name: string;
        regions: RegionTurnout[];
        totalRegions: number;
        totalVoters: number;
        totalVotes: number;
    };
    trustee: {
        name: string;
        regions: RegionTurnout[];
        totalRegions: number;
        totalVoters: number;
        totalVotes: number;
    };
    yuvaPankh: {
        name: string;
        regions: RegionTurnout[];
        totalRegions: number;
        totalVoters: number;
        totalVotes: number;
    };
    totalVotersInSystem?: number;
    timestamp: string;
}

interface RecentCandidate {
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
    electionType: string;
    candidateType: string;
    voteCount?: number; // Vote count for this candidate
    zone: {
        name: string;
        nameGujarati: string;
        seats: number;
        code: string;
    } | null;
    filePaths: {
        candidateAadhaar: string | null;
        candidatePhoto: string | null;
        proposerAadhaar: string | null;
    };
}

export default function AdminDashboard() {
    const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth();
    const [stats, setStats] = useState<DashboardStats>({
        yuvaPankh: { total: 0, pending: 0, approved: 0, rejected: 0 },
        karobari: { total: 0, pending: 0, approved: 0, rejected: 0 },
        totalVoters: 0,
        totalVotes: 0,
    });
    const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingOfflineVotes, setIsExportingOfflineVotes] = useState(false);
    const [isExportingOnlineVotes, setIsExportingOnlineVotes] = useState(false);
    const [results, setResults] = useState<ResultsData | null>(null);
    const [isLoadingResults, setIsLoadingResults] = useState(false);
    const [offlineVotes, setOfflineVotes] = useState<OfflineVoteStats>({ total: 0, merged: 0, unmerged: 0, byZone: [] });
    const [isMerging, setIsMerging] = useState(false);
    const [isCopyingWinners, setIsCopyingWinners] = useState(false);
    const router = useRouter();

    const formatWinnersAsText = (data: { yuvaPankh: Array<{ name: string; zoneName: string; zoneCode: string; rank: number; votes: number; election: string }>; trustee: Array<{ name: string; zoneName: string; zoneCode: string; rank: number; votes: number; election: string }> }) => {
        const lines: string[] = ['ALL WINNERS - SKMMMS Election 2026', '='.repeat(50), ''];
        if (data.yuvaPankh.length > 0) {
            lines.push('--- Yuva Pankh Samiti ---');
            data.yuvaPankh.forEach(w => {
                lines.push(`${w.zoneName} (${w.zoneCode}) | Rank ${w.rank} | ${w.name} | ${w.votes} votes`);
            });
            lines.push('');
        }
        if (data.trustee.length > 0) {
            lines.push('--- Trust Mandal ---');
            data.trustee.forEach(w => {
                lines.push(`${w.zoneName} (${w.zoneCode}) | Rank ${w.rank} | ${w.name} | ${w.votes} votes`);
            });
        }
        return lines.join('\n');
    };

    const handleCopyWinnersList = async () => {
        setIsCopyingWinners(true);
        try {
            const res = await fetch('/api/admin/winners-list');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load winners');
            const text = formatWinnersAsText(data);
            await navigator.clipboard.writeText(text);
            alert('Winners list copied to clipboard.');
        } catch (e) {
            alert('Failed to copy winners list: ' + (e instanceof Error ? e.message : 'Unknown error'));
        } finally {
            setIsCopyingWinners(false);
        }
    };

    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            console.log('Fetching dashboard data...');
            // Add cache-busting query parameter and headers
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/admin/dashboard?t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            console.log('Dashboard response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Dashboard data received:', data);

            // Check if API returned an error response
            if (data.error) {
                throw new Error(data.details || data.error || 'API returned an error');
            }

            if (data.stats) {
                setStats(data.stats);
                console.log('Stats set:', data.stats);
            } else {
                console.warn('No stats in response:', data);
            }

            if (data.offlineVotes) {
                setOfflineVotes(data.offlineVotes);
            }

            if (data.recentCandidates) {
                setRecentCandidates(data.recentCandidates);
                console.log('Recent candidates set:', data.recentCandidates.length);
            } else {
                console.warn('No recent candidates in response:', data);
                setRecentCandidates([]);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
            setError(errorMessage);
            // Set empty stats to prevent showing stale data
            setStats({
                yuvaPankh: { total: 0, pending: 0, approved: 0, rejected: 0 },
                karobari: { total: 0, pending: 0, approved: 0, rejected: 0 },
                totalVoters: 0,
                totalVotes: 0,
            });
            setRecentCandidates([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const fetchResults = useCallback(async () => {
        setIsLoadingResults(true);
        try {
            console.log('Fetching election results...');
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/admin/results?t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
            
            console.log('Results response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Results data received:', data);
                setResults(data);
            } else {
                console.error('Failed to fetch results:', response.status, response.statusText);
                const errorData = await response.json().catch(() => ({}));
                console.error('Error details:', errorData);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch election results');
        } finally {
            setIsLoadingResults(false);
        }
    }, []);

    // Move useEffect before early returns
    useEffect(() => {
        // Only fetch data if authenticated and admin
        if (isAuthenticated && isAdmin && !authLoading) {
            fetchDashboardData();
            fetchResults();
        }
    }, [isAuthenticated, isAdmin, authLoading, fetchDashboardData, fetchResults]);

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

    const openCandidateReview = (candidate: RecentCandidate) => {
        // Redirect to candidates page with the specific candidate ID
        router.push(`/admin/candidates?candidateId=${candidate.id}&type=${candidate.candidateType}`);
    };

    const openFileModal = (candidate: RecentCandidate) => {
        // Redirect to candidates page with the specific candidate ID
        router.push(`/admin/candidates?candidateId=${candidate.id}&type=${candidate.candidateType}`);
    };

    const updateCandidateStatus = async (
        candidateId: string,
        status: string,
        reason?: string,
    ) => {
        setIsUpdating(true);

        // Optimistic update - immediately update the UI
        const originalCandidates = [...recentCandidates];
        setRecentCandidates(prevCandidates =>
            prevCandidates.map(candidate =>
                candidate.id === candidateId
                    ? { ...candidate, status, rejectionReason: reason || undefined }
                    : candidate
            )
        );

        // Note: Candidate updates are now handled on the candidates page

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
                await fetchDashboardData();
            } else {
                // Revert optimistic update on error
                setRecentCandidates(originalCandidates);
                const errorData = await response.json();
                console.error("Error updating candidate:", errorData.error);
                alert(`Failed to update candidate: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            // Revert optimistic update on error
            setRecentCandidates(originalCandidates);
            console.error("Error updating candidate:", error);
            alert("Failed to update candidate. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };



    const handleLogout = async () => {
        try {
            await signOut({
                callbackUrl: "/admin/login",
                redirect: false,
            });
            router.push("/admin/login");
        } catch (error) {
            console.error("Error during logout:", error);
            router.push("/admin/login");
        }
    };

    const handleMergeOfflineVotes = async () => {
        if (!confirm(`Are you sure you want to merge ${offlineVotes.unmerged} unmerged offline vote(s) into online results (offline + online)? This action cannot be undone.`)) {
            return
        }

        setIsMerging(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/offline-votes/trustees/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const contentType = response.headers.get('Content-Type') || ''
            let data: { error?: string; mergedCount?: number; voterCount?: number } = {}
            if (contentType.includes('application/json')) {
                try {
                    data = await response.json()
                } catch {
                    throw new Error('Invalid response from server. Please try again.')
                }
            } else {
                const text = await response.text()
                throw new Error(response.ok ? 'Unexpected response from server.' : (text || `Request failed (${response.status})`))
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to merge offline votes')
            }

            alert(`Successfully merged ${data.mergedCount} offline vote(s) from ${data.voterCount} voter(s).`)
            
            // Refresh dashboard data
            await fetchDashboardData(true)
        } catch (error: any) {
            const message = error.message || 'Failed to merge offline votes'
            setError(message)
            alert(`Merge failed: ${message}`)
        } finally {
            setIsMerging(false)
        }
    }

    const handleExportInsights = async () => {
        try {
            setIsExporting(true);
            setError(null); // Clear any previous errors
            
            console.log('Starting export...');
            // Add cache-busting timestamp to ensure fresh data
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/admin/export-insights?t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                // Don't set Content-Type for GET requests expecting binary response
            });
            
            console.log('Export response status:', response.status);
            
            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = 'Failed to export data';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Check if response is actually a blob
            const contentType = response.headers.get('Content-Type');
            console.log('Content-Type:', contentType);
            
            // Check for Excel content type (various possible formats)
            const isExcelFile = contentType && (
                contentType.includes('spreadsheet') || 
                contentType.includes('excel') ||
                contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
                contentType.includes('application/vnd.ms-excel')
            );
            
            if (!isExcelFile) {
                // Might be an error response
                const text = await response.text();
                console.error('Non-Excel response received:', text.substring(0, 500));
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || errorData.details || 'Invalid response format');
                } catch (e) {
                    throw new Error(`Invalid response format from server. Content-Type: ${contentType}`);
                }
            }

            // Get the blob from the response
            const blob = await response.blob();
            console.log('Blob size:', blob.size, 'bytes');
            console.log('Blob type:', blob.type);
            
            if (blob.size === 0) {
                // Try to read as text to see if it's an error message
                const text = await blob.text();
                console.error('Empty blob, response text:', text.substring(0, 500));
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || errorData.details || 'Exported file is empty');
                } catch (e) {
                    throw new Error('Exported file is empty. Please try again.');
                }
            }
            
            // Validate blob type
            if (!blob.type || (!blob.type.includes('spreadsheet') && !blob.type.includes('excel') && !blob.type.includes('octet-stream'))) {
                // Might be an error response, try to parse as text
                const text = await blob.text();
                console.error('Invalid blob type, response text:', text.substring(0, 500));
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || errorData.details || 'Invalid file format received');
                } catch (e) {
                    throw new Error(`Invalid file format. Expected Excel file, got: ${blob.type || 'unknown'}`);
                }
            }
            
            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.style.display = 'none';
            
            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `election-insights-${new Date().toISOString().split('T')[0]}.xlsx`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup with a small delay to ensure download starts
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
            }, 100);
            
            console.log('Export completed successfully, file:', filename);
        } catch (error) {
            console.error('Error exporting insights:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to export election insights';
            setError(`Export failed: ${errorMessage}. Please check the console for more details.`);
            alert(`Export failed: ${errorMessage}\n\nPlease check the browser console for more details or contact support.`);
        } finally {
            setIsExporting(false);
        }
    };

    const downloadExcelFromApi = async (url: string, fallbackFilename: string) => {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = new Date().getTime();
        const sep = url.includes('?') ? '&' : '?';
        const response = await fetch(`${url}${sep}t=${timestamp}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.details || errorMessage;
            } catch { /* ignore */ }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('Content-Type');
        const isExcelFile = contentType && (
            contentType.includes('spreadsheet') ||
            contentType.includes('excel') ||
            contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
            contentType.includes('application/vnd.ms-excel') ||
            contentType.includes('application/octet-stream')
        );

        if (!isExcelFile) {
            const text = await response.text();
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || errorData.details || 'Invalid response format');
            } catch {
                throw new Error(`Invalid response format from server. Content-Type: ${contentType}`);
            }
        }

        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('Exported file is empty. Please try again.');
        }

        const urlObj = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.style.display = 'none';

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = fallbackFilename;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            window.URL.revokeObjectURL(urlObj);
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
        }, 100);
    }

    const handleExportOfflineVotes = async () => {
        try {
            setIsExportingOfflineVotes(true);
            setError(null);
            const ts = new Date().toISOString().split('T')[0];
            await downloadExcelFromApi('/api/admin/export-offline-votes', `offline-votes-${ts}.xlsx`);
        } catch (error) {
            console.error('Error exporting offline votes:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to export offline votes';
            setError(`Export failed: ${errorMessage}`);
            alert(`Export Offline Votes failed: ${errorMessage}`);
        } finally {
            setIsExportingOfflineVotes(false);
        }
    }

    const handleExportOnlineVotes = async () => {
        try {
            setIsExportingOnlineVotes(true);
            setError(null);
            const ts = new Date().toISOString().split('T')[0];
            await downloadExcelFromApi('/api/admin/export-online-votes', `online-votes-${ts}.xlsx`);
        } catch (error) {
            console.error('Error exporting online votes:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to export online votes';
            setError(`Export failed: ${errorMessage}`);
            alert(`Export Online Votes failed: ${errorMessage}`);
        } finally {
            setIsExportingOnlineVotes(false);
        }
    }

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Logo size="sm" />
                            <div>
                                <h1 className="text-lg sm:text-2xl text-gray-900">
                                    SKMMMS Election 2026
                                </h1>
                                <p className="text-xs text-gray-600 mt-0.5">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-800">{error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchDashboardData(true)}
                            className="ml-auto"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Global Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <Card className="bg-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100">
                                Total Voters
                            </CardTitle>
                            <Users className="h-4 w-4 text-blue-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">
                                {stats.totalVoters.toLocaleString()}
                            </div>
                            <p className="text-xs text-blue-100">
                                Registered voters
                            </p>
                            {stats.voterStats && (
                                <p className="text-xs text-blue-200 mt-1">
                                    Active: {stats.voterStats.active.toLocaleString()} | 
                                    Voted: {stats.voterStats.voted.toLocaleString()} ({stats.voterStats.votePercentage}%)
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100">
                                Total Candidates
                            </CardTitle>
                            <UserCheck className="h-4 w-4 text-blue-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">
                                {stats.yuvaPankh.total}
                            </div>
                            <p className="text-xs text-blue-100">
                                Registered candidates
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100">
                                Total Votes
                            </CardTitle>
                            <Vote className="h-4 w-4 text-blue-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">
                                {stats.totalVotes.toLocaleString()}
                            </div>
                            <p className="text-xs text-blue-100">Votes cast</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100">
                                Pending Nominations
                            </CardTitle>
                            <UserX className="h-4 w-4 text-blue-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">
                                {stats.yuvaPankh.pending}
                            </div>
                            <p className="text-xs text-blue-100">
                                Awaiting approval
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Administrative tasks and navigation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Button
                            variant="default"
                            size="sm"
                            className="text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleExportInsights}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Export Election Insights
                                </>
                            )}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleExportOfflineVotes}
                            disabled={isExportingOfflineVotes}
                        >
                            {isExportingOfflineVotes ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Export Offline Votes
                                </>
                            )}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={handleExportOnlineVotes}
                            disabled={isExportingOnlineVotes}
                        >
                            {isExportingOnlineVotes ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Export Online Votes
                                </>
                            )}
                        </Button>
                        <Link href="/admin/candidates">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Manage Candidates
                            </Button>
                        </Link>
                        <Link href="/admin/voters">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <Users className="h-3 w-3 mr-1" />
                                Voter Management
                            </Button>
                        </Link>
                        <Link href="/admin/voters/upload">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload Voter List
                            </Button>
                        </Link>
                        <Link href="/admin/results">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                    View Results
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={handleCopyWinnersList}
                            disabled={isCopyingWinners}
                        >
                            {isCopyingWinners ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Copy className="h-3 w-3 mr-1" />}
                            {isCopyingWinners ? 'Copying…' : 'Copy winners list'}
                        </Button>
                        <Link href="/admin/election-results">
                            <Button
                                variant="outline"
                                size="sm"
                                    className="text-xs bg-red-600 hover:bg-red-700 text-white border-red-600"
                            >
                                <Vote className="h-3 w-3 mr-1" />
                                    Result Declaration
                            </Button>
                        </Link>
                        <Link href="/admin/withdrawn-candidates">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <UserX className="h-3 w-3 mr-1" />
                                Withdrawn Candidates
                            </Button>
                        </Link>
                        <Link href="/admin/elections">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <Settings className="h-3 w-3 mr-1" />
                                Manage Elections
                            </Button>
                        </Link>
                    </div>
                    </CardContent>
                </Card>

                {/* Offline Vote Management Section */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Offline Vote Management</CardTitle>
                        <CardDescription>
                            Manage offline votes for trustee elections
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold">{offlineVotes.total}</div>
                                    <div className="text-sm text-gray-600">Total Offline Votes</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{offlineVotes.merged}</div>
                                    <div className="text-sm text-gray-600">Merged</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">{offlineVotes.unmerged}</div>
                                    <div className="text-sm text-gray-600">Unmerged</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Offline vote count per zone */}
                        {offlineVotes.byZone && offlineVotes.byZone.length > 0 && (
                            <div className="mb-4">
                                <div className="text-sm font-medium text-gray-700 mb-2">Offline votes per zone</div>
                                <div className="flex flex-wrap gap-2">
                                    {offlineVotes.byZone.map((z) => (
                                        <Badge key={z.zoneId} variant="secondary" className="text-xs py-1.5 px-2">
                                            {z.zoneName}: <span className="font-semibold ml-1">{z.count}</span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions - Enter Offline Vote is only via /admin/offline-votes/login (15 offline admins) */}
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <Link href="/admin/offline-votes/trustees/list">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Offline Votes
                                </Button>
                            </Link>
                            {offlineVotes.unmerged > 0 && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={handleMergeOfflineVotes}
                                    disabled={isMerging}
                                >
                                    {isMerging ? (
                                        <>
                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                            Merging...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Merge offline + online ({offlineVotes.unmerged})
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Yuva Pankh Samiti Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-2xl text-yellow-600">Yuva Pankh Samiti</h2>
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                                Elections 2026-2029
                            </Badge>
                </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchDashboardData(true)}
                                disabled={isRefreshing}
                                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Link href="/admin/yuva-pank-nominations">
                                <Button
                                    size="sm"
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Manage
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <p className="text-gray-600 mb-4">Youth wing nominations and management</p>
                    
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl text-yellow-700">{stats.yuvaPankh.total}</div>
                                <div className="text-sm text-yellow-600">Total</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-100 border-yellow-300">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl text-yellow-700">{stats.yuvaPankh.pending}</div>
                                <div className="text-sm text-yellow-600">Pending</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl text-green-700">{stats.yuvaPankh.approved}</div>
                                <div className="text-sm text-green-600">Approved</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl text-red-700">{stats.yuvaPankh.rejected}</div>
                                <div className="text-sm text-red-600">Rejected</div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Main Action Button */}
                    <div className="text-center">
                        <Link href="/admin/yuva-pank-nominations">
                            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3">
                                <User className="h-5 w-5 mr-2" />
                                View All Yuva Pankh Nominations
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Karobari Samiti Section - Hidden from UI */}


                {/* Election Results Charts */}
                {results && (
                    <div className="grid grid-cols-1 gap-8 mb-8">
                        {/* Yuva Pankh Members Chart */}
                        {results.yuvaPankh && results.yuvaPankh.regions && Array.isArray(results.yuvaPankh.regions) && results.yuvaPankh.regions.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <BarChart3 className="h-5 w-5 text-purple-600" />
                                        <span>Yuva Pankh Members - Zone Wise Voter Turnout</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Regional voter participation for Yuva Pankh Members election
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Recharts Bar Chart */}
                                        <div className="h-80 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={results.yuvaPankh.regions.map(region => {
                                                        const turnout = Number(region.turnoutPercentage) || 0;
                                                        return {
                                                            name: region.zoneName,
                                                            turnout: turnout,
                                                            votes: region.totalVotes || 0,
                                                            voters: region.totalVoters || 0,
                                                            uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                                                            zoneCode: region.zoneCode || '',
                                                            zoneNameGujarati: region.zoneNameGujarati || '',
                                                            isCompleted: turnout >= 100
                                                        };
                                                    })}
                                                    margin={{
                                                        top: 20,
                                                        right: 30,
                                                        left: 20,
                                                        bottom: 60,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                        fontSize={12}
                                                        stroke="#666"
                                                    />
                                                    <YAxis 
                                                        label={{ value: 'Voter Turnout %', angle: -90, position: 'insideLeft' }}
                                                        fontSize={12}
                                                        stroke="#666"
                                                        domain={[0, 100]}
                                                        ticks={[0, 25, 50, 75, 100]}
                                                    />
                                                    <Tooltip 
                                                        formatter={(value: any, name: any, props: any) => {
                                                            const data = props.payload;
                                                            const uniqueVoters = data.uniqueVoters !== undefined 
                                                                ? data.uniqueVoters 
                                                                : Math.round((data.turnout / 100) * data.voters);
                                                            const totalVoters = data.voters || 0;
                                                            const status = data.isCompleted 
                                                                ? ' (Completed)'
                                                                : (data.turnout > 0 
                                                                    ? ' (In Progress)'
                                                                    : ' (Pending)');
                                                            return [`${value}%${status}`, `${uniqueVoters} out of ${totalVoters} voters voted`];
                                                        }}
                                                        labelFormatter={(label: any, payload: any) => {
                                                            if (payload && payload[0]) {
                                                                const data = payload[0].payload;
                                                                return data.name;
                                                            }
                                                            return label;
                                                        }}
                                                        contentStyle={{
                                                            backgroundColor: '#fff',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Bar dataKey="turnout" radius={[4, 4, 0, 0]}>
                                                        {results.yuvaPankh.regions.map((region, index) => {
                                                            const turnout = Number(region.turnoutPercentage) || 0;
                                                            return (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={turnout >= 100 ? '#10b981' : turnout > 0 ? '#8b5cf6' : '#e5e7eb'} 
                                                                />
                                                            );
                                                        })}
                                                        <LabelList 
                                                            dataKey="turnout" 
                                                            position="top" 
                                                            formatter={(value: number) => `${value.toFixed(1)}%`} 
                                                            fill="#333" 
                                                            fontSize={12} 
                                                            fontWeight="bold" 
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Summary Statistics */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-xl sm:text-2xl text-purple-600">
                                                    {results.yuvaPankh.totalRegions}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">Total Regions</div>
                                            </div>
                                            <div>
                                                <div className="text-xl sm:text-2xl text-green-600">
                                                    {results.yuvaPankh.regions.length > 0 ? Math.max(...results.yuvaPankh.regions.map(r => Number(r.turnoutPercentage) || 0)).toFixed(1) : '0'}%
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">Highest Turnout</div>
                                            </div>
                                            <div>
                                                <div className="text-xl sm:text-2xl text-purple-600">
                                                    {results.yuvaPankh.totalVoters.toLocaleString()}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">Total Voters</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Trustee Members Chart */}
                        {results.trustee && results.trustee.regions && Array.isArray(results.trustee.regions) && results.trustee.regions.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                        <span>Trustee Members - Zone Wise Voter Turnout</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Regional voter participation for Trustee Members election
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Recharts Bar Chart */}
                                        <div className="h-80 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={results.trustee.regions.map(region => {
                                                        const turnout = Number(region.turnoutPercentage) || 0;
                                                        return {
                                                            name: region.zoneName,
                                                            turnout: turnout,
                                                            votes: region.totalVotes || 0,
                                                            voters: region.totalVoters || 0,
                                                            uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                                                            zoneCode: region.zoneCode || '',
                                                            zoneNameGujarati: region.zoneNameGujarati || '',
                                                            isCompleted: turnout >= 100
                                                        };
                                                    })}
                                                    margin={{
                                                        top: 20,
                                                        right: 30,
                                                        left: 20,
                                                        bottom: 60,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                        fontSize={12}
                                                        stroke="#666"
                                                    />
                                                    <YAxis 
                                                        label={{ value: 'Voter Turnout %', angle: -90, position: 'insideLeft' }}
                                                        fontSize={12}
                                                        stroke="#666"
                                                        domain={[0, 100]}
                                                        ticks={[0, 25, 50, 75, 100]}
                                                    />
                                                    <Tooltip 
                                                        formatter={(value: any, name: any, props: any) => {
                                                            const data = props.payload;
                                                            const uniqueVoters = data.uniqueVoters !== undefined 
                                                                ? data.uniqueVoters 
                                                                : Math.round((data.turnout / 100) * data.voters);
                                                            const totalVoters = data.voters || 0;
                                                            const status = data.isCompleted 
                                                                ? ' (Completed)'
                                                                : (data.turnout > 0 
                                                                    ? ' (In Progress)'
                                                                    : ' (Pending)');
                                                            return [`${value}%${status}`, `${uniqueVoters} out of ${totalVoters} voters voted`];
                                                        }}
                                                        labelFormatter={(label: any, payload: any) => {
                                                            if (payload && payload[0]) {
                                                                const data = payload[0].payload;
                                                                return data.name;
                                                            }
                                                            return label;
                                                        }}
                                                        contentStyle={{
                                                            backgroundColor: '#fff',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Bar dataKey="turnout" radius={[4, 4, 0, 0]}>
                                                        {results.trustee.regions.map((region, index) => {
                                                            const turnout = Number(region.turnoutPercentage) || 0;
                                                            return (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={turnout >= 100 ? '#10b981' : turnout > 0 ? '#3b82f6' : '#e5e7eb'} 
                                                                />
                                                            );
                                                        })}
                                                        <LabelList 
                                                            dataKey="turnout" 
                                                            position="top" 
                                                            formatter={(value: number) => `${value.toFixed(1)}%`} 
                                                            fill="#333" 
                                                            fontSize={12} 
                                                            fontWeight="bold" 
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Summary Statistics */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-xl sm:text-2xl text-green-600">
                                                    {results.trustee.totalRegions}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">Total Regions</div>
                                            </div>
                                            <div>
                                                <div className="text-xl sm:text-2xl text-green-600">
                                                    {Math.max(...results.trustee.regions.map(r => Number(r.turnoutPercentage) || 0)).toFixed(1)}%
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">Highest Turnout</div>
                                            </div>
                                            <div>
                                                <div className="text-xl sm:text-2xl text-green-600">
                                                    {results.trustee.totalVoters.toLocaleString()}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">Total Voters</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}