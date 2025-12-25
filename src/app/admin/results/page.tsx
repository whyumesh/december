"use client";

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic'

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
import {
    BarChart3,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from '@/components/ChartsWrapper';

interface RegionTurnout {
    zoneId: string;
    zoneCode: string;
    zoneName: string;
    zoneNameGujarati: string;
    seats: number;
    totalVoters: number;
    totalVotes: number;
    turnoutPercentage: number;
}

interface ElectionData {
    name: string;
    regions: RegionTurnout[];
    totalRegions: number;
    totalVoters: number;
    totalVotes: number;
}

interface ResultsData {
    karobari?: ElectionData; // Karobari data removed - hidden from UI
    trustee: ElectionData;
    yuvaPankh: ElectionData;
    timestamp: string;
}

export default function AdminResults() {
    const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth();
    const [results, setResults] = useState<ResultsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Move useEffect before early returns
    useEffect(() => {
        // Only fetch data if authenticated and admin
        if (isAuthenticated && isAdmin && !authLoading) {
            fetchResults();
        }
    }, [isAuthenticated, isAdmin, authLoading]);

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

    const fetchResults = async (isRefresh = false) => {
        // Check if we have recent cached data (less than 30 seconds old)
        const cacheKey = 'election_results_cache'
        const cached = localStorage.getItem(cacheKey)
        const now = Date.now()
        
        if (!isRefresh && cached) {
            try {
                const { data, timestamp } = JSON.parse(cached)
                if (now - timestamp < 30000) { // 30 seconds cache
                    console.log('Using cached election results')
                    setResults(data)
                    return
                }
            } catch (e) {
                // Invalid cache, continue with API call
            }
        }

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            console.log('Fetching voter turnout data...');
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/admin/results?t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Results response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Voter turnout data received:', data);

            setResults(data);
            
            // Cache the response
            localStorage.setItem(cacheKey, JSON.stringify({
                data,
                timestamp: now
            }))

        } catch (error) {
            console.error("Error fetching voter turnout data:", error);
            setError(error instanceof Error ? error.message : 'Failed to fetch voter turnout data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading voter turnout data...</p>
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
                                    Voter Turnout by Region
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    View voter participation statistics by region
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => fetchResults(true)}
                                disabled={isRefreshing}
                                className="w-full sm:w-auto text-sm"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <Link
                                href="/admin/dashboard"
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto text-sm"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            </Link>
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
                            onClick={() => fetchResults(true)}
                            className="ml-auto"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {results && (
                    <>
                        {/* Karobari Charts hidden from UI */}
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">

                            {/* Yuva Pankh Members Chart */}
                            <div>
                                <h2 className="text-2xl text-gray-900 mb-6">Yuva Pankh Members - Voter Turnout by Region</h2>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <BarChart3 className="h-5 w-5 text-purple-600" />
                                            <span>Yuva Pankh Members (6 Regions)</span>
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
                                                        data={results.yuvaPankh.regions.map(region => ({
                                                            name: region.zoneName,
                                                            turnout: region.turnoutPercentage,
                                                            votes: region.totalVotes,
                                                            voters: region.totalVoters,
                                                            zoneCode: region.zoneCode
                                                        }))}
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
                                                            label={{ value: 'Turnout %', angle: -90, position: 'insideLeft' }}
                                                            fontSize={12}
                                                            stroke="#666"
                                                        />
                                                        <Tooltip 
                                                            formatter={(value, name) => [
                                                                `${value}%`, 
                                                                name === 'turnout' ? 'Turnout' : name
                                                            ]}
                                                            labelFormatter={(label, payload) => {
                                                                if (payload && payload[0]) {
                                                                    const data = payload[0].payload;
                                                                    return `${data.zoneCode}: ${data.votes}/${data.voters} votes`;
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
                                                            {results.yuvaPankh.regions.map((region, index) => (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={region.turnoutPercentage > 0 ? '#8b5cf6' : '#e5e7eb'} 
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            
                                            {/* Summary Statistics */}
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                                                <div>
                                                    <div className="text-2xl text-purple-600">
                                                        {results.yuvaPankh.totalRegions}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Total Regions</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl text-green-600">
                                                        {Math.max(...results.yuvaPankh.regions.map(r => r.turnoutPercentage)).toFixed(1)}%
                                                    </div>
                                                    <div className="text-sm text-gray-500">Highest Turnout</div>
                                                        </div>
                                                <div>
                                                    <div className="text-2xl text-orange-600">
                                                        {(() => {
                                                            const totalVoters = results.yuvaPankh.regions.reduce((sum, r) => sum + (r.totalVoters || 0), 0);
                                                            const uniqueVoters = results.yuvaPankh.regions.reduce((sum, r) => sum + (r.uniqueVoters || 0), 0);
                                                            return totalVoters > 0 ? ((uniqueVoters / totalVoters) * 100).toFixed(1) : '0.0';
                                                        })()}%
                                                            </div>
                                                    <div className="text-sm text-gray-500">Average Turnout</div>
                                                        </div>
                                                <div>
                                                    <div className="text-2xl text-purple-600">
                                                        {results.yuvaPankh.totalVoters.toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Total Voters</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Trustee Members Chart */}
                        <div className="mb-8">
                            <h2 className="text-2xl text-gray-900 mb-6">Trustee Members - Voter Turnout by Region</h2>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                        <span>Trustee Members (6 Regions)</span>
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
                                                    data={results.trustee.regions.map(region => ({
                                                        name: region.zoneName,
                                                        turnout: region.turnoutPercentage,
                                                        votes: region.totalVotes,
                                                        voters: region.totalVoters,
                                                        zoneCode: region.zoneCode
                                                    }))}
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
                                                        label={{ value: 'Turnout %', angle: -90, position: 'insideLeft' }}
                                                        fontSize={12}
                                                        stroke="#666"
                                                    />
                                                    <Tooltip 
                                                        formatter={(value, name) => [
                                                            `${value}%`, 
                                                            name === 'turnout' ? 'Turnout' : name
                                                        ]}
                                                        labelFormatter={(label, payload) => {
                                                            if (payload && payload[0]) {
                                                                const data = payload[0].payload;
                                                                return `${data.zoneCode}: ${data.votes}/${data.voters} votes`;
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
                                                        {results.trustee.regions.map((region, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={region.turnoutPercentage > 0 ? '#10b981' : '#e5e7eb'} 
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Summary Statistics */}
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                                            <div>
                                                <div className="text-2xl text-green-600">
                                                    {results.trustee.totalRegions}
                                                        </div>
                                                <div className="text-sm text-gray-500">Total Regions</div>
                                                    </div>
                                            <div>
                                                <div className="text-2xl text-green-600">
                                                    {Math.max(...results.trustee.regions.map(r => r.turnoutPercentage)).toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-gray-500">Highest Turnout</div>
                                            </div>
                                                            <div>
                                                <div className="text-2xl text-orange-600">
                                                    {(() => {
                                                        const totalVoters = results.trustee.regions.reduce((sum, r) => sum + (r.totalVoters || 0), 0);
                                                        const uniqueVoters = results.trustee.regions.reduce((sum, r) => sum + (r.uniqueVoters || 0), 0);
                                                        return totalVoters > 0 ? ((uniqueVoters / totalVoters) * 100).toFixed(1) : '0.0';
                                                    })()}%
                                                                </div>
                                                <div className="text-sm text-gray-500">Average Turnout</div>
                                                            </div>
                                            <div>
                                                <div className="text-2xl text-purple-600">
                                                    {results.trustee.totalVoters.toLocaleString()}
                                                        </div>
                                                <div className="text-sm text-gray-500">Total Voters</div>
                                            </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                    </>
                )}
            </main>
        </div>
    );
}