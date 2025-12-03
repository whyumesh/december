"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import Logo from "@/components/Logo";

export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
            {/* Fixed Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-40 overflow-y-auto">
                <div className="p-6">
                    {/* ELECTIONS Section */}
                    <div className="mb-8">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            ELECTIONS
                        </h3>
                        <nav className="space-y-2">
                            {/* Karobari Members - Hidden from UI */}
                            <Link
                                href="/elections/trustees"
                                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                <Award className="h-5 w-5 text-gray-400" />
                                <span>Trustees Election</span>
                            </Link>
                        </nav>
                    </div>

                    {/* ACCESS Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            ACCESS
                        </h3>
                        <nav className="space-y-2">
                            <Link
                                href="/candidate/signup"
                                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            >
                                <UserCheck className="h-5 w-5 text-orange-600" />
                                <span>File Your Nomination</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64">
                {/* Header */}
                <header className="bg-white shadow-sm border-b sticky top-0 z-50">
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
                                <Link href="/candidate/signup">
                                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        File Your Nomination
                                    </Button>
                                </Link>
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
                                            <Link
                                                href="/candidate/signup"
                                                className="block"
                                            >
                                                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start">
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    File Your Nomination
                                                </Button>
                                            </Link>
                                            <Link
                                                href="/voter/login"
                                                className="block"
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start"
                                                >
                                                    <Vote className="h-4 w-4 mr-2" />
                                                    Voter Login
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="px-2">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                            Elections
                                        </h3>
                                        <div className="space-y-2">
                                        {/* Karobari Members - Hidden from UI */}
                                            <Link
                                                href="/elections/trustees"
                                                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                            >
                                                <Award className="h-4 w-4 inline mr-2" />
                                                Trustees Election
                                            </Link>
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
                        <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                            Participate in our democratic process and help shape the
                            future of our community through secure, transparent, and
                            accessible online voting.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                            <Link href="/candidate/signup" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
                                >
                                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    File Your Nomination
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Organization Info */}
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
                                            To be announced...
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Coverage
                                        </p>
                                        <p className="text-gray-600">Overseas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Elections Overview */}
                    <div className="mb-8 sm:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-12">
                            Elections Overview
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 sm:gap-8">
                            {/* Karobari Members Election - Hidden from UI */}
                            
                            {/* Trustees Election */}
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Award className="h-6 w-6 text-purple-600" />
                                        <span>Trustees</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Trustee selection with zone-based distribution
                                        and Mumbai representation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                Election Type:
                                            </span>
                                            <Badge className="bg-purple-100 text-purple-800">
                                                Zone-based Selection
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                Seats:
                                            </span>
                                            <span className="text-sm text-gray-900">
                                                7 Seats
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                Distribution:
                                            </span>
                                            <span className="text-sm text-gray-900">
                                                2 Mumbai + 1 each zone
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                Term:
                                            </span>
                                            <span className="text-sm text-gray-900">
                                                2 Years
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                Voter Age:
                                            </span>
                                            <span className="text-sm text-gray-900">
                                                All ages
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                Candidate Age:
                                            </span>
                                            <span className="text-sm text-gray-900">
                                                Above 45 years
                                            </span>
                                        </div>
                                        <div className="pt-4">
                                            <Link href="/elections/trustees">
                                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
                                    <span className="text-2xl font-bold text-blue-600">
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
                                    <span className="text-2xl font-bold text-blue-600">
                                        2
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    Select Election
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Choose Trustees election
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-blue-600">
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
                                    <span className="text-2xl font-bold text-blue-600">
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

                    {/* Election Zone Information */}
                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-12">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
                            Election Zone Distribution
                        </h3>

                        {/* Karobari Samiti Zones - Hidden from UI */}

                        {/* Trustees Election */}
                        <div className="border-t pt-8">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                                Trustees Election (7 Seats)
                            </h4>
                            <div className="text-center">
                                <div className="inline-flex items-center px-6 py-3 bg-orange-100 text-orange-800 rounded-lg">
                                    <span className="font-semibold">
                                        7 Trustees - All Voters Eligible
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-3">
                                    All community members can vote for 7 trustees to
                                    represent the entire organization
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
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                            Ready to Make Your Voice Heard?
                        </h2>
                        <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 px-4">
                            Join thousands of community members in shaping our
                            future through democratic participation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                            <Link href="/candidate/signup" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                                >
                                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    File Your Nomination
                                </Button>
                            </Link>
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
                                        <Link
                                            href="/elections/trustees"
                                            className="hover:text-white"
                                        >
                                            Trustees
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li>
                                        <Link
                                            href="/voter/login"
                                            className="hover:text-white"
                                        >
                                            Voter Login
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/candidate/signup"
                                            className="hover:text-white"
                                        >
                                            Candidate Registration
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/admin/login"
                                            className="hover:text-white"
                                        >
                                            Admin Login
                                        </Link>
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
                                &copy; 2025 SKMMMS Election 2026. All rights reserved.
                            </p>
                            <p className="mt-2">
                                Designed & Developed by{" "}
                                <Link 
                                    href="https://www.teamfullstack.in" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-semibold"
                                >
                                    Parth Chetna Piyush Gagdani, Team FullStack (Thane)
                                </Link>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
