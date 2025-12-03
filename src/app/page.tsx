"use client";

import { useState, useEffect, useRef } from "react";
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

export default function HomePage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Main Content Area */}
            <div className="flex-1">
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
                                <Link href="/voter/login">
                                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                                        <Vote className="h-4 w-4 mr-2" />
                                        Cast Your Vote
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
                                                href="/voter/login"
                                                className="block"
                                            >
                                                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start">
                                                    <Vote className="h-4 w-4 mr-2" />
                                                    Cast Your Vote
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
                            <Link href="/voter/login" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
                                >
                                    <Vote className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Cast Your Vote
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
                                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                        <div className="text-center">
                                            <Vote className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Video Coming Soon</p>
                                            <p className="text-xs text-gray-400 mt-1">How to Vote: Yuva Pankh</p>
                                        </div>
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
                                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                        <div className="text-center">
                                            <Vote className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Video Coming Soon</p>
                                            <p className="text-xs text-gray-400 mt-1">How to Vote: Trust Mandal</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 text-center">
                                        Watch this tutorial to understand the voting process for Trust Mandal elections
                                    </p>
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
                                    Choose election category
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
                            <Link href="/voter/login" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                                >
                                    <Vote className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Cast Your Vote
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
                                            href="/terms-and-conditions"
                                            className="hover:text-white"
                                        >
                                            Terms and Conditions
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/privacy-policy"
                                            className="hover:text-white"
                                        >
                                            Privacy Policy
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
