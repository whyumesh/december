"use client";

import { useState, useEffect } from "react";
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
import {
    Settings,
    Calendar,
    Users,
    Building,
    Award,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    LogOut,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface Election {
    id: string;
    title: string;
    description: string | null;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    isOnlineNomination: boolean;
    voterMinAge: number | null;
    voterMaxAge: number | null;
    candidateMinAge: number | null;
    candidateMaxAge: number | null;
}

export default function ElectionsManagementPage() {
    const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth();
    const [elections, setElections] = useState<Election[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && isAdmin && !authLoading) {
            fetchElections();
        }
    }, [isAuthenticated, isAdmin, authLoading]);

    const fetchElections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/admin/elections', {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch elections');
            }

            const data = await response.json();
            setElections(data.elections || []);
        } catch (error) {
            console.error('Error fetching elections:', error);
            setError('Failed to load elections. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateElectionStatus = async (electionType: string, newStatus: string) => {
        try {
            setIsUpdating(electionType);
            setError(null);
            setSuccess(null);

            const response = await fetch('/api/admin/elections', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    electionType,
                    status: newStatus,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update election status');
            }

            const data = await response.json();
            setSuccess(`Successfully updated ${data.election.title} status to ${newStatus}`);
            
            // Refresh elections list
            await fetchElections();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error updating election status:', error);
            setError(error instanceof Error ? error.message : 'Failed to update election status');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsUpdating(null);
        }
    };

    const getElectionIcon = (type: string) => {
        switch (type) {
            case 'YUVA_PANK':
                return <Users className="h-6 w-6 text-green-600" />;
            case 'KAROBARI_MEMBERS':
                return <Building className="h-6 w-6 text-blue-600" />;
            case 'TRUSTEES':
                return <Award className="h-6 w-6 text-purple-600" />;
            default:
                return <Calendar className="h-6 w-6 text-gray-600" />;
        }
    };

    const getElectionColor = (type: string) => {
        switch (type) {
            case 'YUVA_PANK':
                return 'green';
            case 'KAROBARI_MEMBERS':
                return 'blue';
            case 'TRUSTEES':
                return 'purple';
            default:
                return 'gray';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'UPCOMING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Upcoming
                    </Badge>
                );
            case 'COMPLETED':
                return (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getStatusButtons = (election: Election) => {
        const color = getElectionColor(election.type);
        const isUpdatingThis = isUpdating === election.type;

        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant={election.status === 'UPCOMING' ? 'default' : 'outline'}
                    className={election.status === 'UPCOMING' ? `bg-yellow-600 hover:bg-yellow-700 text-white` : ''}
                    onClick={() => updateElectionStatus(election.type, 'UPCOMING')}
                    disabled={isUpdatingThis || election.status === 'UPCOMING'}
                >
                    {isUpdatingThis && election.status !== 'UPCOMING' ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                        <Clock className="h-3 w-3 mr-1" />
                    )}
                    Set Upcoming
                </Button>
                <Button
                    size="sm"
                    variant={election.status === 'ACTIVE' ? 'default' : 'outline'}
                    className={
                        election.status === 'ACTIVE' 
                            ? (color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                               color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                               color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                               'bg-gray-600 hover:bg-gray-700 text-white')
                            : ''
                    }
                    onClick={() => updateElectionStatus(election.type, 'ACTIVE')}
                    disabled={isUpdatingThis || election.status === 'ACTIVE'}
                >
                    {isUpdatingThis && election.status !== 'ACTIVE' ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    Activate
                </Button>
                <Button
                    size="sm"
                    variant={election.status === 'COMPLETED' ? 'default' : 'outline'}
                    className={election.status === 'COMPLETED' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}
                    onClick={() => updateElectionStatus(election.type, 'COMPLETED')}
                    disabled={isUpdatingThis || election.status === 'COMPLETED'}
                >
                    {isUpdatingThis && election.status !== 'COMPLETED' ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                    )}
                    Complete
                </Button>
            </div>
        );
    };

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
                                    Election Management
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Manage election status and settings
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href="/admin/dashboard">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800">{success}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-800">{error}</span>
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl text-gray-900">Elections</h2>
                        <p className="text-gray-600 mt-1">Control when elections are active for voting</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchElections}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading elections...</p>
                        </div>
                    </div>
                ) : elections.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500">No elections found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {elections.filter(e => e.type !== 'KAROBARI_MEMBERS').map((election) => {
                            const color = getElectionColor(election.type);
                            return (
                                <Card key={election.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                {getElectionIcon(election.type)}
                                                <div>
                                                    <CardTitle className="text-xl">{election.title}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {election.description || 'Election for community leadership'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            {getStatusBadge(election.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Election Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Type</p>
                                                    <p className="font-medium">{election.type.replace(/_/g, ' ')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Online Nomination</p>
                                                    <p className="font-medium">
                                                        {election.isOnlineNomination ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Start Date</p>
                                                    <p className="font-medium">
                                                        {new Date(election.startDate).toLocaleDateString('en-GB', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">End Date</p>
                                                    <p className="font-medium">
                                                        {new Date(election.endDate).toLocaleDateString('en-GB', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Voter Age Range</p>
                                                    <p className="font-medium">
                                                        {election.voterMinAge || 'No min'} - {election.voterMaxAge || 'No max'} years
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Candidate Age Range</p>
                                                    <p className="font-medium">
                                                        {election.candidateMinAge || 'No min'} - {election.candidateMaxAge || 'No max'} years
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Control */}
                                            <div className="border-t pt-4">
                                                <p className="text-sm font-medium text-gray-700 mb-3">Change Status</p>
                                                {getStatusButtons(election)}
                                            </div>

                                            {/* Special Note for Karobari - Hidden (election filtered out) */}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

