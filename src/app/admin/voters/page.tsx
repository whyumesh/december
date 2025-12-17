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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Users,
    Search,
    ArrowLeft,
    Edit,
    Trash2,
    Plus,
    Download,
    Upload,
    Phone,
    MapPin,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import toast, { Toaster } from "react-hot-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface Zone {
    name: string;
    nameGujarati: string;
    code: string;
}

interface Voter {
    id: string;
    voterId: string;
    name: string;
    gender?: string;
    dob?: string;
    age?: number;
    email?: string;
    mulgam?: string; // Current City
    phone: string;
    regionKarobari?: string;
    regionYuvaPankh?: string;
    regionTrustee?: string;
    zone?: Zone | null;
    yuvaPankZone?: Zone | null;
    karobariZone?: Zone | null;
    trusteeZone?: Zone | null;
    isActive: boolean;
    hasVoted: boolean;
    createdAt: string;
}

interface VoterStats {
    totalVoters: number;
    activeVoters: number;
    votedVoters: number;
    inactiveVoters: number;
}

export default function VoterManagementPage() {
    const { isAuthenticated, isLoading: authLoading, isAdmin } = useAdminAuth();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [filteredVoters, setFilteredVoters] = useState<Voter[]>([]);
    const [stats, setStats] = useState<VoterStats>({
        totalVoters: 0,
        activeVoters: 0,
        votedVoters: 0,
        inactiveVoters: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Move useEffect hooks before early returns
    useEffect(() => {
        // Only fetch data if authenticated and admin
        if (isAuthenticated && isAdmin && !authLoading) {
            fetchVoters();
        }
    }, [isAuthenticated, isAdmin, authLoading]);

    useEffect(() => {
        // Only filter if we have voters and are authenticated
        if (isAuthenticated && isAdmin && !authLoading) {
            filterVoters();
        }
    }, [voters, searchTerm, showInactive, isAuthenticated, isAdmin, authLoading]);

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

    const fetchVoters = async () => {
        try {
            const response = await fetch("/api/admin/voters");
            const data = await response.json();

            if (response.ok) {
                setVoters(data.voters);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching voters:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterVoters = () => {
        let filtered = voters;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (voter) =>
                    voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    voter.phone.includes(searchTerm) ||
                    voter.voterId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }


        // Filter by active status
        if (!showInactive) {
            filtered = filtered.filter((voter) => voter.isActive);
        }

        setFilteredVoters(filtered);
    };

    const handleToggleActive = async (voterId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/voters/${voterId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                // Update local state
                setVoters((prev) =>
                    prev.map((voter) =>
                        voter.id === voterId
                            ? { ...voter, isActive: !currentStatus }
                            : voter
                    )
                );
                
                // Show success toast
                toast.success(
                    currentStatus 
                        ? "Voter deactivated successfully" 
                        : "Voter activated successfully",
                    {
                        duration: 3000,
                        position: "top-right",
                    }
                );
            } else {
                console.error("Failed to update voter status");
                toast.error("Failed to update voter status. Please try again.", {
                    duration: 4000,
                    position: "top-right",
                });
            }
        } catch (error) {
            console.error("Error updating voter status:", error);
            toast.error("An error occurred while updating voter status.", {
                duration: 4000,
                position: "top-right",
            });
        }
    };

    const handleEditVoter = (voter: Voter) => {
        setEditingVoter(voter);
        setEditName(voter.name);
        setEditPhone(voter.phone);
    };

    const handleSaveEdit = async () => {
        if (!editingVoter) return;

        // Validate inputs
        if (!editName.trim()) {
            toast.error("Name is required", {
                duration: 3000,
                position: "top-right",
            });
            return;
        }

        if (!editPhone.trim() || editPhone.length !== 10) {
            toast.error("Please enter a valid 10-digit phone number", {
                duration: 3000,
                position: "top-right",
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/voters/${editingVoter.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: editName.trim(),
                    phone: editPhone.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state
                setVoters((prev) =>
                    prev.map((voter) =>
                        voter.id === editingVoter.id
                            ? { ...voter, name: editName.trim(), phone: editPhone.trim() }
                            : voter
                    )
                );
                
                // Close modal
                setEditingVoter(null);
                setEditName("");
                setEditPhone("");
                
                // Show success toast
                toast.success("Voter updated successfully", {
                    duration: 3000,
                    position: "top-right",
                });
            } else {
                console.error("Failed to update voter:", data);
                toast.error(data.error || "Failed to update voter. Please try again.", {
                    duration: 4000,
                    position: "top-right",
                });
            }
        } catch (error) {
            console.error("Error updating voter:", error);
            toast.error("An error occurred while updating the voter.", {
                duration: 4000,
                position: "top-right",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingVoter(null);
        setEditName("");
        setEditPhone("");
    };

    const handleDeleteVoter = async (voterId: string) => {
        if (!confirm("Are you sure you want to delete this voter?")) return;

        try {
            const response = await fetch(`/api/admin/voters/${voterId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setVoters((prev) => prev.filter((voter) => voter.id !== voterId));
                
                // Show success toast
                toast.success("Voter deleted successfully", {
                    duration: 3000,
                    position: "top-right",
                });
            } else {
                console.error("Failed to delete voter");
                toast.error("Failed to delete voter. Please try again.", {
                    duration: 4000,
                    position: "top-right",
                });
            }
        } catch (error) {
            console.error("Error deleting voter:", error);
            toast.error("An error occurred while deleting the voter.", {
                duration: 4000,
                position: "top-right",
            });
        }
    };

    const getRegionBadge = (region: string) => {
        const colors = {
            "Bhuj": "bg-blue-100 text-blue-800",
            "Mumbai": "bg-green-100 text-green-800",
            "Raigad": "bg-yellow-100 text-yellow-800",
            "Garda": "bg-purple-100 text-purple-800",
            "Other Gujarat": "bg-red-100 text-red-800",
            "Karnataka": "bg-indigo-100 text-indigo-800",
            "Abdasa": "bg-pink-100 text-pink-800",
            "Kutch": "bg-orange-100 text-orange-800",
        };
        return (
            <Badge className={colors[region as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
                {region}
            </Badge>
        );
    };

    const getStatusBadge = (isActive: boolean, hasVoted: boolean) => {
        if (hasVoted) {
            return (
                <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Voted
                </Badge>
            );
        }
        if (isActive) {
            return (
                <Badge className="bg-blue-100 text-blue-800">
                    Active
                </Badge>
            );
        }
        return (
            <Badge className="bg-gray-100 text-gray-800">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading voters...</p>
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
                                    Voter Management
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Manage registered voters and their detailed information
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                            <Link href="/admin/voters/upload">
                                <Button className="w-full sm:w-auto">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add Voters
                                </Button>
                            </Link>
                            <Link href="/admin/dashboard">
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Voters
                            </CardTitle>
                            <Users className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">
                                {stats.totalVoters.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-600">
                                Registered voters
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Voters
                            </CardTitle>
                            <CheckCircle className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl text-green-600">
                                {stats.activeVoters.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-600">
                                Can participate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Voted
                            </CardTitle>
                            <User className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl text-blue-600">
                                {stats.votedVoters.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-600">
                                Cast their votes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Inactive
                            </CardTitle>
                            <XCircle className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl text-gray-600">
                                {stats.inactiveVoters.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-600">
                                Disabled accounts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Search and Filter</CardTitle>
                        <CardDescription>
                            Find specific voters using search terms and filters
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by name, VID Number, or phone number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="showInactive"
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                    className="rounded"
                                />
                                <label htmlFor="showInactive" className="text-sm text-gray-600">
                                    Show inactive voters
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Voters List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Voters List ({filteredVoters.length} found)
                        </CardTitle>
                        <CardDescription>
                            Manage voter accounts and their detailed information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredVoters.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">Sl No.</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">VID Number</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">Name</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">Gender</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">DOB</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">Age</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Email</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">City</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">Mobile</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Yuva Pank Zone</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Karobari Zone</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hidden lg:table-cell">Trustee Zone</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">Status</th>
                                            <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVoters.map((voter, index) => (
                                            <tr key={voter.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{index + 1}</td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 font-mono font-semibold">
                                                    {voter.voterId || '-'}
                                                </td>
                                                <td className="p-2 sm:p-3">
                                                    <div className="font-medium text-xs sm:text-sm text-gray-900 break-words">{voter.name}</div>
                                                </td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                                                    {voter.gender || '-'}
                                                </td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                                                    {voter.dob || '-'}
                                                </td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">
                                                    {voter.age || '-'}
                                                </td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell break-all">
                                                    {voter.email || '-'}
                                                </td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                                                    {voter.mulgam || '-'}
                                                </td>
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600 font-mono">
                                                    {voter.phone}
                                                </td>
                                                <td className="p-2 sm:p-3 hidden lg:table-cell">
                                                    {voter.yuvaPankZone ? (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            {voter.yuvaPankZone.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2 sm:p-3 hidden lg:table-cell">
                                                    {voter.karobariZone ? (
                                                        <Badge className="bg-blue-100 text-blue-800">
                                                            {voter.karobariZone.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2 sm:p-3 hidden lg:table-cell">
                                                    {voter.trusteeZone ? (
                                                        <Badge className="bg-purple-100 text-purple-800">
                                                            {voter.trusteeZone.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2 sm:p-3">
                                                    {getStatusBadge(voter.isActive, voter.hasVoted)}
                                                </td>
                                                <td className="p-2 sm:p-3">
                                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditVoter(voter)}
                                                            className="text-xs"
                                                            title="Edit name and phone"
                                                        >
                                                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleToggleActive(voter.id, voter.isActive)}
                                                            className="text-xs"
                                                        >
                                                            {voter.isActive ? "Deactivate" : "Activate"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteVoter(voter.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No voters found
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {searchTerm || showInactive
                                        ? "Try adjusting your search criteria"
                                        : "No voters have been registered yet"}
                                </p>
                                <Link href="/admin/voters/upload">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Voters
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Edit Voter Modal */}
            {editingVoter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Edit Voter</CardTitle>
                                    <CardDescription>
                                        Update name and mobile number for {editingVoter.name}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter voter name"
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Mobile Number</Label>
                                <Input
                                    id="edit-phone"
                                    type="tel"
                                    value={editPhone}
                                    onChange={(e) => {
                                        // Only allow digits and limit to 10
                                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setEditPhone(digitsOnly);
                                    }}
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength={10}
                                    disabled={isSaving}
                                />
                                <p className="text-xs text-gray-500">
                                    Enter a 10-digit mobile number
                                </p>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving || !editName.trim() || editPhone.length !== 10}
                                    className="flex-1"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Toaster />
        </div>
    );
}
