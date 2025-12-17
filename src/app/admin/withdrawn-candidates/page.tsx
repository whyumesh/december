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
    ArrowLeft,
    Search,
    Filter,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

interface WithdrawnCandidate {
    id: string;
    originalId: string;
    name: string;
    email: string;
    phone: string;
    party: string;
    region: string;
    position: string;
    zone: {
        id: string;
        name: string;
        nameGujarati: string;
        code: string;
    };
    status: string;
    reason: string;
    originalCreatedAt: string;
    deletedAt: string;
    deletedBy: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function WithdrawnCandidatesPage() {
    const [candidates, setCandidates] = useState<WithdrawnCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [regionFilter, setRegionFilter] = useState("");

    useEffect(() => {
        fetchWithdrawnCandidates();
    }, [pagination.page, searchTerm, regionFilter]);

    const fetchWithdrawnCandidates = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchTerm) params.append("search", searchTerm);
            if (regionFilter) params.append("region", regionFilter);

            const response = await fetch(`/api/admin/withdrawn-candidates?${params}`);
            const data = await response.json();

            if (response.ok) {
                setCandidates(data.candidates);
                setPagination(data.pagination);
            } else {
                setError(data.error || "Failed to load withdrawn candidates");
            }
        } catch (error) {
            setError("An error occurred while loading data");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        return (
            <Badge className="bg-red-100 text-red-800 border-red-200">
                Withdrawn
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading withdrawn candidates...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link href="/admin/dashboard">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <h1 className="text-3xl text-gray-900">
                            Withdrawn Candidates
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        View candidates who have withdrawn their nominations
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name, email, or phone..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Region
                                </label>
                                <select
                                    value={regionFilter}
                                    onChange={(e) => setRegionFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Regions</option>
                                    <option value="Mumbai">Mumbai</option>
                                    <option value="Karnataka & Goa">Karnataka & Goa</option>
                                    <option value="Bhuj & Anjar">Bhuj & Anjar</option>
                                    <option value="Anya Gujarat">Anya Gujarat</option>
                                    <option value="Kutch">Kutch</option>
                                    <option value="Raigad">Raigad</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {error ? (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-red-600">
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : candidates.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-gray-500">
                                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No withdrawn candidates found</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {candidates.map((candidate) => (
                            <Card key={candidate.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {candidate.name}
                                                </h3>
                                                {getStatusBadge(candidate.status)}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                        <Mail className="h-4 w-4" />
                                                        <span>{candidate.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                        <Phone className="h-4 w-4" />
                                                        <span>{candidate.phone}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{candidate.region}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-700">
                                                            Position:
                                                        </span>{" "}
                                                        <span className="text-gray-600">
                                                            {candidate.position}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-700">
                                                            Zone:
                                                        </span>{" "}
                                                        <span className="text-gray-600">
                                                            {candidate.zone?.name || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-700">
                                                            Party:
                                                        </span>{" "}
                                                        <span className="text-gray-600">
                                                            {candidate.party || "Independent"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">Withdrawal Reason:</span>
                                                    <p className="mt-1 text-gray-800">{candidate.reason}</p>
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            Withdrawn: {formatDate(candidate.deletedAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            Originally submitted: {formatDate(candidate.originalCreatedAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        page: Math.max(1, prev.page - 1),
                                    }))
                                }
                                disabled={pagination.page === 1}
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        page: Math.min(prev.pages, prev.page + 1),
                                    }))
                                }
                                disabled={pagination.page === pagination.pages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
