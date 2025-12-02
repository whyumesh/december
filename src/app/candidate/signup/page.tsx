"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    AlertCircle,
    ArrowLeft,
    UserPlus,
    CheckCircle,
    Eye,
    EyeOff,
} from "lucide-react";
import Logo from "@/components/Logo";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import Footer from "@/components/Footer";
import { validatePassword } from "@/lib/password-policy";

interface SignupData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export default function CandidateSignupPage() {
    const [formData, setFormData] = useState<SignupData>({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const handleInputChange = (field: keyof SignupData, value: string) => {
        // Special handling for phone number
        if (field === "phone") {
            // Remove any non-digit characters
            const digitsOnly = value.replace(/\D/g, "");
            // Limit to 10 digits
            const limitedDigits = digitsOnly.slice(0, 10);
            setFormData((prev) => ({
                ...prev,
                [field]: limitedDigits,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate phone number
        if (formData.phone.length !== 10) {
            setError("Phone number must be exactly 10 digits");
            setIsLoading(false);
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        // Validate password strength using policy
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            setError(
                `Password requirements not met: ${passwordValidation.errors.join(", ")}`,
            );
            setIsLoading(false);
            return;
        }

        try {
            console.log("Submitting signup form...");

            const response = await fetch("/api/candidate/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                }),
                credentials: "include", // Important: include cookies
            });

            console.log("Signup response status:", response.status);
            const data = await response.json();
            console.log("Signup response data:", data);

            if (response.ok) {
                setSuccess(true);
                // Set a flag to indicate successful signup
                localStorage.setItem("candidate-signup-success", "true");
                setTimeout(() => {
                    router.push("/candidate/nomination");
                }, 2000);
            } else {
                setError(data.error || "Signup failed");
            }
        } catch (error) {
            console.error("Signup error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white rounded-lg shadow-lg">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Account Created Successfully!
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Your candidate account has been created. You can
                                now proceed to fill the nomination form.
                            </p>
                            <p className="text-gray-500 text-sm">
                                Redirecting to nomination form...
                            </p>
                        </div>
                    </CardContent>
                </Card>
                </div>
                
                {/* Footer */}
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Logo size="md" />
                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                                    KMS ELECTION 2026
                                </h1>
                            </div>
                        </div>
                        <Link href="/candidate/login" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="flex items-center justify-center w-full sm:w-auto"
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
                                Create Account
                            </CardTitle>
                            <CardDescription>
                                Fill in your basic details to create your
                                candidate account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter your email address"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Phone Number * (10 digits only)
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "phone",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter 10-digit phone number"
                                        autoComplete="tel"
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        required
                                    />
                                    {formData.phone &&
                                        formData.phone.length !== 10 && (
                                            <p className="text-sm text-amber-600">
                                                Phone number must be exactly 10
                                                digits
                                            </p>
                                        )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Create a secure password"
                                            autoComplete="new-password"
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
                                    <PasswordStrengthIndicator
                                        password={formData.password}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">
                                        Confirm Password *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "confirmPassword",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Confirm your password"
                                            autoComplete="new-password"
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isLoading}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {isLoading
                                        ? "Creating Account..."
                                        : "Create Account"}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600 text-sm">
                                    Already have an account?{" "}
                                    <Link
                                        href="/candidate/login"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            </div>

                            {/* Help Section */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                    Need Help?
                                </h3>
                                <p className="text-xs text-blue-700 mb-3">
                                    Contact our support team for any assistance
                                    with candidate registration:
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
