"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Users, AlertCircle, ArrowLeft, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import SavedLoginSelector from "@/components/SavedLoginSelector";
import { saveCredential } from "@/lib/saved-credentials";

export default function CandidateLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            console.log("Attempting login...");

            const response = await fetch("/api/candidate/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: "include", // Important: include cookies
            });

            console.log("Login response status:", response.status);
            const data = await response.json();
            console.log("Login response data:", data);

            if (response.ok) {
                // Save credentials if Remember Me is checked
                if (rememberMe) {
                    saveCredential(email, password, 'CANDIDATE', data.user?.name || email.split('@')[0])
                }
                if (data.hasNomination) {
                    router.push("/candidate/dashboard");
                } else {
                    router.push("/candidate/nomination");
                }
            } else {
                setError(data.error || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Logo size="md" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    KMS ELECTION 2026
                                </h1>
                            </div>
                        </div>
                        <Link href="/">
                            <Button
                                variant="outline"
                                className="flex items-center"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex items-center justify-center p-4 py-12">
                <div className="max-w-md w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4">
                                <Logo size="lg" />
                            </div>
                            <CardTitle className="text-2xl">
                                Candidate Login
                            </CardTitle>
                            <CardDescription>
                                Enter your credentials to access your candidate
                                portal
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                {error && (
                                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                {/* Saved Login Selector */}
                                <SavedLoginSelector
                                    onCredentialSelect={(email, password) => {
                                        setEmail(email);
                                        setPassword(password);
                                    }}
                                    role="CANDIDATE"
                                />

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="Enter your email address"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me Checkbox */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    />
                                    <Label htmlFor="rememberMe" className="text-sm text-gray-700">
                                        Remember me for future logins
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isLoading}
                                >
                                    <LogIn className="h-4 w-4 mr-2" />
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </form>

                            <div className="mt-4 text-center">
                                <Link href="/candidate/forgot-password">
                                    <Button
                                        variant="link"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600 text-sm mb-4">
                                    Don't have an account yet?
                                </p>
                                <Link href="/candidate/signup">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Create New Account
                                    </Button>
                                </Link>
                            </div>

                            {/* Help Section */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                    Need Help?
                                </h3>
                                <p className="text-xs text-blue-700 mb-3">
                                    Contact our support team for any assistance
                                    with candidate registration or login:
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
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Footer */}
            <Footer />
        </div>
    );
}
