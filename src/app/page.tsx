"use client";

// Note: revalidate and dynamic cannot be exported from client components
// These are server-only route segment config options
// The layout.tsx handles dynamic rendering for the entire app

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Vote,
    UserCheck,
    Users,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Building,
    Award,
    Shield,
    Clock,
    CheckCircle,
    Menu,
    X,
    BarChart3,
    AlertCircle,
    Camera,
} from "lucide-react";
import Logo from "@/components/Logo";
import CountdownTimer from "@/components/CountdownTimer";
import SelfieBooth from "@/components/SelfieBooth";
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
    uniqueVoters?: number;
    turnoutPercentage: number;
    actualVotes?: number;
    notaVotes?: number;
}

interface ElectionData {
    name: string;
    regions: RegionTurnout[];
    totalRegions: number;
    totalVoters: number;
    totalVotes: number;
}

interface ResultsData {
    karobari?: ElectionData;
    trustee: ElectionData;
    yuvaPankh: ElectionData;
    totalVotersInSystem?: number;
    timestamp: string;
}

export default function HomePage() {
    // Target date: January 31, 2026, 11:59 PM IST (IST is UTC+5:30, so 6:29 PM UTC)
    const targetDate = useMemo(() => new Date('2026-01-31T18:29:00Z'), []);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [results, setResults] = useState<ResultsData | null>(null);
    const [isLoadingResults, setIsLoadingResults] = useState(false);
    const [resultsError, setResultsError] = useState<string | null>(null);
    const electionPeriod = 'Voting open until 31st January 2026';
    const [showSelfieBooth, setShowSelfieBooth] = useState(false);
    
    // Get YouTube video IDs from environment variables
    const yuvaPankhVideoId = process.env.NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID;
    const trustMandalVideoId = process.env.NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID;

    // Fetch election results
    useEffect(() => {
        const fetchResults = async () => {
            const cacheKey = 'election_results_cache';
            const cached = localStorage.getItem(cacheKey);
            const now = Date.now();
            
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    const hasNewFormat = data?.trustee?.regions?.some((r: any) => r.uniqueVoters !== undefined) ||
                                         data?.yuvaPankh?.regions?.some((r: any) => r.uniqueVoters !== undefined);
                    if (now - timestamp < 30000 && hasNewFormat) {
                        setResults(data);
                        return;
                    }
                } catch (e) {
                    // Invalid cache, continue with API call
                }
            }

            setIsLoadingResults(true);
            setResultsError(null);
            try {
                const response = await fetch('/api/admin/results');
                if (response.ok) {
                    const data = await response.json();
                    console.log('Results API response:', data);
                    // Check if we have valid data
                    if (data && (data.trustee || data.yuvaPankh || data.karobari)) {
                        setResults(data);
                        localStorage.setItem(cacheKey, JSON.stringify({
                            data,
                            timestamp: now
                        }));
                    } else {
                        console.warn('API returned empty or invalid data:', data);
                        setResultsError('No election data available');
                        setResults({
                            karobari: { name: 'Karobari Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
                            trustee: { name: 'Trustee Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
                            yuvaPankh: { name: 'Yuva Pankh Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
                            timestamp: new Date().toISOString()
                        });
                    }
                } else {
                    // Try to get error details from response
                    let errorMessage = 'Failed to load election results';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.details || errorMessage;
                        console.error('API Error:', errorData);
                    } catch (e) {
                        console.error('Response status:', response.status, response.statusText);
                    }
                    setResultsError(errorMessage);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to load election results';
                setResultsError(errorMessage);
                setResults({
                    karobari: { name: 'Karobari Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
                    trustee: { name: 'Trustee Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
                    yuvaPankh: { name: 'Yuva Pankh Members', regions: [], totalRegions: 0, totalVoters: 0, totalVotes: 0 },
                    timestamp: new Date().toISOString()
                });
            } finally {
                setIsLoadingResults(false);
            }
        };

        fetchResults();
    }, []);

    // Show selfie booth if opened
    if (showSelfieBooth) {
        return (
            <SelfieBooth onClose={() => setShowSelfieBooth(false)} />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Marquee Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 overflow-hidden relative z-50">
                <div className="marquee-container">
                    <div className="marquee-content">
                        <span className="font-semibold">⚠️ Important: </span>
                        If any member of samaj is facing any difficulty to login or vote, kindly contact: 
                        <a href="tel:+917666778349" className="font-bold underline mx-1">+91 7666778349</a>
                        (Dipen Ketan Somani) or 
                        <a href="tel:+919820216044" className="font-bold underline mx-1">+91 9820216044</a>
                        (Jay Deepak Bhutada) or email at 
                        <a href="mailto:kmselec2026@gmail.com" className="font-bold underline mx-1">kmselec2026@gmail.com</a>
                        <span className="mx-8">•</span>
                        <span className="font-semibold">⚠️ મહત્વપૂર્ણ: </span>
                        જો સમાજના કોઈપણ સભ્યને લોગિન કરવામાં અથવા મતદાન કરવામાં કોઈ મુશ્કેલી આવી રહી હોય, તો કૃપા કરીને સંપર્ક કરો: 
                        <a href="tel:+917666778349" className="font-bold underline mx-1">+91 7666778349</a>
                        (દિપેન કેતન સોમાણી) અથવા 
                        <a href="tel:+919820216044" className="font-bold underline mx-1">+91 9820216044</a>
                        (જય દીપક ભુટાડા) અથવા ઇમેઇલ કરો: 
                        <a href="mailto:kmselec2026@gmail.com" className="font-bold underline mx-1">kmselec2026@gmail.com</a>
                        <span className="mx-8">•</span>
                        <span className="font-semibold">⚠️ Important: </span>
                        If any member of samaj is facing any difficulty to login or vote, kindly contact: 
                        <a href="tel:+917666778349" className="font-bold underline mx-1">+91 7666778349</a>
                        (Dipen Ketan Somani) or 
                        <a href="tel:+919820216044" className="font-bold underline mx-1">+91 9820216044</a>
                        (Jay Deepak Bhutada) or email at 
                        <a href="mailto:kmselec2026@gmail.com" className="font-bold underline mx-1">kmselec2026@gmail.com</a>
                        <span className="mx-8">•</span>
                        <span className="font-semibold">⚠️ મહત્વપૂર્ણ: </span>
                        જો સમાજના કોઈપણ સભ્યને લોગિન કરવામાં અથવા મતદાન કરવામાં કોઈ મુશ્કેલી આવી રહી હોય, તો કૃપા કરીને સંપર્ક કરો: 
                        <a href="tel:+917666778349" className="font-bold underline mx-1">+91 7666778349</a>
                        (દિપેન કેતન સોમાણી) અથવા 
                        <a href="tel:+919820216044" className="font-bold underline mx-1">+91 9820216044</a>
                        (જય દીપક ભુટાડા) અથવા ઇમેઇલ કરો: 
                        <a href="mailto:kmselec2026@gmail.com" className="font-bold underline mx-1">kmselec2026@gmail.com</a>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
                {/* Header */}
                <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <Logo size="sm" />
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                                        SKMMMS Election 2026
                                    </h1>
                                    <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                                </div>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center space-x-4">
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="lg:hidden">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setIsMobileMenuOpen(!isMobileMenuOpen)
                                    }
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="h-4 w-4" />
                                    ) : (
                                        <Menu className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        {isMobileMenuOpen && (
                            <div className="lg:hidden border-t bg-white">
                                <div className="py-4 space-y-3">
                                    <div className="px-2">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                            Quick Access
                                        </h3>
                                        <div className="space-y-2">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold" disabled>
                                                <Vote className="h-4 w-4 mr-2" />
                                                Voting is now open for Anya Gujarat and Kutch zones
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Hero Section */}
                    <div className="text-center mb-8 sm:mb-16">
                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                            Shri Kutchi Maheshwari Madhyastha Mahajan Samiti
                        </h1>
                        <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-blue-600 mb-3 sm:mb-4">
                            Election 2026
                        </h2>
                        <CountdownTimer targetDate={targetDate} />
                        <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                            Participate in our democratic process and help shape the
                            future of our community through secure, transparent, and
                            accessible online voting.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" disabled>
                                <Vote className="h-4 w-4 mr-2" />
                                Voting is now open for Anya Gujarat and Kutch zones
                            </Button>
                        </div>
                    </div>

                    {/* How to Vote Videos */}
                    <div className="mb-8 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-12">
                            How to Vote
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            {/* Yuva Pankh Video */}
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="h-6 w-6 text-green-600" />
                                        <span>Yuva Pankh Samiti</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Learn how to vote for Yuva Pankh Samiti elections
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                                        {yuvaPankhVideoId ? (
                                            <iframe
                                                className="w-full h-full"
                                                src={`https://www.youtube.com/embed/${yuvaPankhVideoId}`}
                                                title="Yuva Pankh Election Tutorial"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                loading="lazy"
                                            ></iframe>
                                        ) : (
                                            <video
                                                className="w-full h-full object-contain"
                                                controls
                                                preload="metadata"
                                                poster=""
                                            >
                                                <source src="/videos/Yuva Pankh Demo.mp4" type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 text-center">
                                        Watch this tutorial to understand the voting process for Yuva Pankh Samiti elections
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Trustees Video */}
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Award className="h-6 w-6 text-purple-600" />
                                        <span>Trust Mandal</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Learn how to vote for Trust Mandal elections
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                                        {trustMandalVideoId ? (
                                            <iframe
                                                className="w-full h-full"
                                                src={`https://www.youtube.com/embed/${trustMandalVideoId}`}
                                                title="Trust Mandal Election Tutorial"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                loading="lazy"
                                            ></iframe>
                                        ) : (
                                            <video
                                                className="w-full h-full object-contain"
                                                controls
                                                preload="metadata"
                                                poster=""
                                            >
                                                <source src="/videos/Trust Mandal Demo.mp4" type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 text-center">
                                        Watch this tutorial to understand the voting process for Trust Mandal elections
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Election Results Charts */}
                    {isLoadingResults && (
                        <Card className="mb-8">
                            <CardContent className="p-8 text-center">
                                <div className="text-gray-500">Loading election results...</div>
                            </CardContent>
                        </Card>
                    )}

                    {resultsError && !isLoadingResults && (
                        <Card className="mb-8 border-red-200 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    <div>
                                        <div className="font-semibold">Failed to load election results</div>
                                        <div className="text-sm text-red-500 mt-1">{resultsError}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {results && !isLoadingResults && (
                        <div className="mb-8 sm:mb-12 space-y-8">
                            {/* Debug info - remove in production */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded mb-4">
                                    Debug: Trustee regions: {results?.trustee?.regions?.length || 0}, 
                                    Yuva Pankh regions: {results?.yuvaPankh?.regions?.length || 0}
                                </div>
                            )}
                            
                            {/* Yuva Pankh Members Chart */}
                            {results?.yuvaPankh?.regions && Array.isArray(results.yuvaPankh.regions) && results.yuvaPankh.regions.length > 0 ? (
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
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={results.yuvaPankh.regions
                                                            .filter(region => {
                                                                const zoneCode = region.zoneCode || '';
                                                                return zoneCode === 'KARNATAKA_GOA' || zoneCode === 'RAIGAD' || zoneCode === 'ANYA_GUJARAT' || zoneCode === 'KUTCH';
                                                            })
                                                            .map(region => ({
                                                                name: region.zoneName,
                                                                turnout: Number(region.turnoutPercentage) || 0,
                                                                votes: region.totalVotes || 0,
                                                                voters: region.totalVoters || 0,
                                                                uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                                                                zoneCode: region.zoneCode || '',
                                                                isCompleted: (Number(region.turnoutPercentage) || 0) >= 100
                                                            }))
                                                            .sort((a, b) => b.turnout - a.turnout)}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                                                            label={{ value: 'Voter Turnout', angle: -90, position: 'insideLeft' }}
                                                            fontSize={12}
                                                            stroke="#666"
                                                            domain={[0, 100]}
                                                            ticks={[0, 25, 50, 75, 100]}
                                                        />
                                                        <Tooltip 
                                                            formatter={(value: any) => [`${value}%`, 'Turnout']}
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                            }}
                                                        />
                                                        <Bar dataKey="turnout" radius={[4, 4, 0, 0]}>
                                                            {results.yuvaPankh.regions
                                                                .filter(region => {
                                                                    const zoneCode = region.zoneCode || '';
                                                                    return zoneCode === 'KARNATAKA_GOA' || zoneCode === 'RAIGAD' || zoneCode === 'ANYA_GUJARAT' || zoneCode === 'KUTCH';
                                                                })
                                                                .map((region, index) => {
                                                                    const turnout = Number(region.turnoutPercentage) || 0;
                                                                    return (
                                                                        <Cell 
                                                                            key={`cell-${index}`} 
                                                                            fill={turnout >= 100 ? '#10b981' : turnout > 0 ? '#8b5cf6' : '#e5e7eb'} 
                                                                        />
                                                                    );
                                                                })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            
                                            {/* Summary Statistics */}
                                            {(() => {
                                                const processedData = results.yuvaPankh.regions
                                                    .filter(region => {
                                                        const zoneCode = region.zoneCode || '';
                                                        return zoneCode === 'KARNATAKA_GOA' || zoneCode === 'RAIGAD' || zoneCode === 'ANYA_GUJARAT' || zoneCode === 'KUTCH';
                                                    })
                                                    .map(region => ({
                                                        turnout: Number(region.turnoutPercentage) || 0,
                                                        voters: region.totalVoters || 0,
                                                        uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                                                        isCompleted: (Number(region.turnoutPercentage) || 0) >= 100
                                                    }));

                                                const totalVoters = processedData.reduce((sum, r) => sum + r.voters, 0);
                                                const votersVoted = processedData.reduce((sum, r) => sum + (r.uniqueVoters || 0), 0);
                                                const highestTurnout = processedData.length > 0 ? Math.max(...processedData.map(r => r.turnout)) : 0;
                                                const averageTurnout = totalVoters > 0 
                                                    ? (votersVoted / totalVoters) * 100 
                                                    : 0;

                                                return (
                                                    <>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center mt-6">
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-purple-600">
                                                                    {processedData.length}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Total Regions</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-green-600">
                                                                    {highestTurnout.toFixed(1)}%
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Highest Turnout</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-blue-600">
                                                                    {averageTurnout.toFixed(1)}%
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Average Turnout</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-indigo-600">
                                                                    {votersVoted.toLocaleString()} / {totalVoters.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Voters Voted / Total</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-purple-600">
                                                                    {totalVoters.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Total Voters</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-orange-600">
                                                                    {(totalVoters - votersVoted).toLocaleString()}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Remaining Voters</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Completion Status Legend */}
                                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-green-500"></div>
                                                                    <span className="text-gray-600">Completed (100%)</span>
                                                                    <span className="text-gray-500">
                                                                        ({processedData.filter(r => r.isCompleted).length})
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                                                                    <span className="text-gray-600">In Progress</span>
                                                                    <span className="text-gray-500">
                                                                        ({processedData.filter(r => !r.isCompleted && r.turnout > 0 && r.turnout < 100).length})
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-gray-300"></div>
                                                                    <span className="text-gray-600">Pending</span>
                                                                    <span className="text-gray-500">
                                                                        ({processedData.filter(r => !r.isCompleted && r.turnout === 0).length})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : results?.yuvaPankh && (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-500">
                                        No Yuva Pankh election data available yet.
                                    </CardContent>
                                </Card>
                            )}

                            {/* Trustee Members Chart */}
                            {results?.trustee?.regions && Array.isArray(results.trustee.regions) && results.trustee.regions.length > 0 ? (
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
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={results.trustee.regions.map(region => ({
                                                            name: region.zoneName,
                                                            turnout: Number(region.turnoutPercentage) || 0,
                                                            votes: region.totalVotes || 0,
                                                            voters: region.totalVoters || 0,
                                                            uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                                                            zoneCode: region.zoneCode,
                                                            isCompleted: (Number(region.turnoutPercentage) || 0) >= 100
                                                        }))}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                                                            label={{ value: 'Voter Turnout', angle: -90, position: 'insideLeft' }}
                                                            fontSize={12}
                                                            stroke="#666"
                                                            domain={[0, 100]}
                                                            ticks={[0, 25, 50, 75, 100]}
                                                        />
                                                        <Tooltip 
                                                            formatter={(value: any) => [`${value}%`, 'Turnout']}
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
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            
                                            {/* Summary Statistics */}
                                            {(() => {
                                                const processedData = results.trustee.regions.map(region => ({
                                                    turnout: Number(region.turnoutPercentage) || 0,
                                                    voters: region.totalVoters || 0,
                                                    uniqueVoters: region.uniqueVoters !== undefined ? region.uniqueVoters : (region.totalVotes || 0),
                                                    isCompleted: (Number(region.turnoutPercentage) || 0) >= 100
                                                }));

                                                const totalVoters = results.trustee.totalVoters || processedData.reduce((sum, r) => sum + r.voters, 0);
                                                const votersVoted = processedData.reduce((sum, r) => sum + (r.uniqueVoters || 0), 0);
                                                const highestTurnout = processedData.length > 0 ? Math.max(...processedData.map(r => r.turnout)) : 0;
                                                const averageTurnout = totalVoters > 0 
                                                    ? (votersVoted / totalVoters) * 100 
                                                    : 0;

                                                return (
                                                    <>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center mt-6">
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-green-600">
                                                                    {results.trustee.totalRegions}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Total Regions</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-green-600">
                                                                    {highestTurnout.toFixed(1)}%
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Highest Turnout</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-blue-600">
                                                                    {averageTurnout.toFixed(1)}%
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Average Turnout</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-indigo-600">
                                                                    {votersVoted.toLocaleString()} / {totalVoters.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Voters Voted / Total</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-purple-600">
                                                                    {totalVoters.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Total Voters</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl sm:text-2xl text-orange-600">
                                                                    {(totalVoters - votersVoted).toLocaleString()}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500">Remaining Voters</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Completion Status Legend */}
                                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-green-500"></div>
                                                                    <span className="text-gray-600">Completed (100%)</span>
                                                                    <span className="text-gray-500">
                                                                        ({processedData.filter(r => r.isCompleted).length})
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                                                                    <span className="text-gray-600">In Progress</span>
                                                                    <span className="text-gray-500">
                                                                        ({processedData.filter(r => !r.isCompleted && r.turnout > 0 && r.turnout < 100).length})
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded bg-gray-300"></div>
                                                                    <span className="text-gray-600">Pending</span>
                                                                    <span className="text-gray-500">
                                                                        ({processedData.filter(r => !r.isCompleted && r.turnout === 0).length})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : results?.trustee && (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-500">
                                        No Trustee election data available yet.
                                    </CardContent>
                                </Card>
                            )}
                            
                            {/* Show message if no data at all */}
                            {(!results?.trustee?.regions?.length && !results?.yuvaPankh?.regions?.length) && (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No election results available yet.</p>
                                        <p className="text-sm text-gray-500 mt-2">Results will appear here once voting begins.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Selfie Booth Section */}
                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-12">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4 sm:mb-6">
                                <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                                Election Selfie Booth
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                                Capture your election moment with our special frames! Take a selfie to commemorate your participation in the democratic process.
                            </p>
                            
                            {/* Disclaimer */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 max-w-2xl mx-auto">
                                <p className="text-xs sm:text-sm text-blue-800 font-medium mb-2">
                                    <span className="font-semibold">Important Note / મહત્વપૂર્ણ નોંધ:</span>
                                </p>
                                <p className="text-xs sm:text-sm text-blue-700 mb-1">
                                    This is a <span className="font-semibold">voluntary feature</span> to show that you have voted through the medium of selfie. 
                                    The Developer or Election Commission <span className="font-semibold">does not capture or store</span> any selfie data.
                                </p>
                                <p className="text-xs sm:text-sm text-blue-700">
                                    આ એક <span className="font-semibold">સ્વૈચ્છિક સુવિધા</span> છે જે તમે સેલ્ફીના માધ્યમથી મતદાન કર્યું છે તે બતાવવા માટે છે. 
                                    ડેવલપર અથવા ચૂંટણી નિયામક <span className="font-semibold">કોઈપણ સેલ્ફી ડેટા કેપ્ચર કે સ્ટોર કરતું નથી</span>.
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowSelfieBooth(true)}
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg"
                            >
                                <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Take Your Election Selfie
                            </Button>
                        </div>
                    </div>

                    {/* Election Commission Details */}
                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-12">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                            Election Commission Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Building className="h-5 w-5 text-blue-600 mt-1" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Registered Office
                                        </p>
                                        <p className="text-gray-600">
                                            Shri Kutchi Maheshwari Madhyastha
                                            Mahajan Samiti
                                        </p>
                                        <p className="text-gray-600">
                                            B-2 Nityanand Krupa CHS, Deodhar Wada, Opp. Janakalyan Bank, Panvel (MH) – 410206
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Phone className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Contact
                                        </p>
                                        <p className="text-gray-600">
                                            +91 93215 78416
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Email
                                        </p>
                                        <p className="text-gray-600">
                                            kmselec2026@gmail.com
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Award className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Registration
                                        </p>
                                        <p className="text-gray-600">
                                            Registered Public Charitable Trust No –
                                            A – 1061 Gujarat
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Election Period
                                        </p>
                                        <p className="text-gray-600">
                                            {electionPeriod}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Coverage
                                        </p>
                                        <p className="text-gray-600">India and Overseas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voting Process */}
                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-12">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
                            How to Vote
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="text-center">
                                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-blue-600">
                                        1
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Login
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Use your mobile number to receive OTP and login
                                    securely
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-blue-600">
                                        2
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Select Election
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Choose election category
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-blue-600">
                                        3
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Cast Vote
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Select your preferred candidates and submit your
                                    vote
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-blue-600">
                                        4
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Confirm
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Review and confirm your vote to complete the
                                    process
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Security Features */}
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-8 mb-8 sm:mb-12">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
                            Security & Transparency
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="text-center">
                                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Secure Voting
                                </h4>
                                <p className="text-sm text-gray-600">
                                    End-to-end encryption and secure authentication
                                </p>
                            </div>
                            <div className="text-center">
                                <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Transparent Process
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Real-time results and audit trails
                                </p>
                            </div>
                            <div className="text-center">
                                <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    24/7 Access
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Vote anytime during the election period
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 sm:p-12 text-white mb-8">
                        <h2 className="text-2xl sm:text-3xl mb-3 sm:mb-4">
                            Ready to Make Your Voice Heard?
                        </h2>
                        <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 px-4">
                            Join thousands of community members in shaping our
                            future through democratic participation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" disabled>
                                <Vote className="h-4 w-4 mr-2" />
                                Voting is now open for Anya Gujarat and Kutch zones
                            </Button>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">
                                    KMS ELECTION 2026
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    A secure, transparent, and accessible digital
                                    democracy platform for our community.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Elections</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    {/* Karobari Members - Hidden from UI */}
                                    <li>
                                        <span className="text-gray-400">
                                            Trustees
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li>
                                        <span className="text-gray-400">
                                            Voter Login
                                        </span>
                                    </li>
                                    <li>
                                        <span className="text-gray-400">
                                            Terms and Conditions
                                        </span>
                                    </li>
                                    <li>
                                        <span className="text-gray-400">
                                            Privacy Policy
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Contact</h4>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <p>
                                        <a href="tel:+917666778349" className="hover:text-white">+91 7666778349</a>
                                        <span className="block text-xs mt-1">Dipen Ketan Somani</span>
                                    </p>
                                    <p>
                                        <a href="tel:+919820216044" className="hover:text-white">+91 9820216044</a>
                                        <span className="block text-xs mt-1">Jay Deepak Bhutada</span>
                                    </p>
                                    <p>kmselec2026@gmail.com</p>
                                    <p>B-2 Nityanand Krupa CHS, Deodhar Wada, Opp. Janakalyan Bank, Panvel (MH) - 410206</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                            <p className="text-xs text-gray-500 mb-2">
                                Election 2026: Shree Panvel Kutchi Maheshwari Mahajan
                            </p>
                            <p>
                                &copy; 2025-26 SKMMMS Election 2026. All rights reserved.
                            </p>
                            <p className="mt-2">
                                Designed and Developed with ❤️ in 🇮🇳 by
                            </p>
                            <p className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                                <span className="text-gray-400 font-semibold">
                                    Parth Chetna Piyush Gagdani, (Thane)
                                </span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-400 font-bold">
                                    પાર્થ ચેતના પિયુષ ગગડાની, (થાણા)
                                </span>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
