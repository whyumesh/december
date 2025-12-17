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
    ArrowLeft,
    Mail,
    CheckCircle,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/candidate/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setStep('otp');
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/candidate/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setStep('success');
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = (password: string) => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        return '';
    };

    const validateConfirmPassword = (password: string, confirmPassword: string) => {
        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }
        return '';
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white rounded-lg shadow-lg">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Password Reset Successful!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Your password has been successfully reset. You can now login with your new password.
                            </p>
                            <Link href="/candidate/login">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    Go to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-4">
                            <Link href="/candidate/login">
                                <Button variant="outline" className="text-sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Forgot Password
                                </h1>
                                <p className="text-gray-600 text-xs sm:text-sm">
                                    Reset your candidate account password
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-md mx-auto">
                    <Card className="bg-white rounded-lg shadow-lg">
                        <CardHeader className="p-6">
                            <CardTitle className="text-gray-900 text-center text-xl">
                                {step === 'email' && 'Enter Your Email'}
                                {step === 'otp' && 'Enter OTP & New Password'}
                                {step === 'reset' && 'Reset Password'}
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-center">
                                {step === 'email' && 'We\'ll send you an OTP to reset your password'}
                                {step === 'otp' && 'Enter the OTP sent to your email and set a new password'}
                                {step === 'reset' && 'Set your new password'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {(error || success) && (
                                <div className={`flex items-center space-x-2 p-3 rounded-md mb-6 ${
                                    error ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                                }`}>
                                    {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                    <span className="text-sm">{error || success}</span>
                                </div>
                            )}

                            {step === 'email' && (
                                <form onSubmit={handleSendOTP} className="space-y-4">
                                    <div>
                                        <Label htmlFor="email" className="text-gray-700">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                placeholder="Enter your email address"
                                                autoComplete="email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !email}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending OTP...
                                            </>
                                        ) : (
                                            'Send OTP'
                                        )}
                                    </Button>
                                </form>
                            )}

                            {step === 'otp' && (
                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div>
                                        <Label htmlFor="otp" className="text-gray-700">
                                            OTP Code
                                        </Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 text-center text-lg tracking-widest"
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter the 6-digit code sent to {email}
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="newPassword" className="text-gray-700">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                placeholder="Enter new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {newPassword && validatePassword(newPassword) && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {validatePassword(newPassword)}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="confirmPassword" className="text-gray-700">
                                            Confirm New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && validateConfirmPassword(newPassword, confirmPassword) && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {validateConfirmPassword(newPassword, confirmPassword)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex space-x-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep('email')}
                                            className="flex-1"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                isLoading || 
                                                !otp || 
                                                !newPassword || 
                                                !confirmPassword ||
                                                !!validatePassword(newPassword) ||
                                                !!validateConfirmPassword(newPassword, confirmPassword)
                                            }
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Resetting...
                                                </>
                                            ) : (
                                                'Reset Password'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Help Section */}
                    <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            Need Help?
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                            If you're having trouble resetting your password, contact our support team:
                        </p>
                        <div className="space-y-1 text-xs text-gray-700">
                            <div className="flex justify-between">
                                <span className="font-medium">Support Email:</span>
                                <a 
                                    href="mailto:support@electkms.org" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    support@electkms.org
                                </a>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Phone:</span>
                                <a 
                                    href="tel:+917666778349" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    +91 7666778349
                                </a>
                            </div>
                            <div className="text-xs text-gray-500 text-right mt-1">
                                Dipen Ketan Somani
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
