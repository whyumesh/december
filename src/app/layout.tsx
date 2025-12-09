import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Better font loading performance
  preload: true,
  fallback: ['system-ui', 'arial'], // Fallback fonts if Google Fonts fail
  adjustFontFallback: true, // Adjust fallback font metrics
});

export const metadata: Metadata = {
    title: "SKMMMS Election 2026",
    description: "Secure Online Election Management System",
    keywords: ["election", "voting", "democracy", "secure", "online"],
    authors: [{ name: "Shree Panvel Kutchi Maheshwari Mahajan" }],
    robots: "noindex, nofollow", // Security for election system
    icons: {
        icon: "/electkms favicon.png",
        shortcut: "/electkms favicon.png",
        apple: "/electkms favicon.png",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

// Force dynamic rendering for all routes (can be overridden by child layouts)
// When using dynamic = 'force-dynamic', revalidate should be omitted (not set to false)
export const dynamic = 'force-dynamic'

// Validate critical environment variables at build/runtime
function validateEnvironment() {
    const requiredVars = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
    const missing: string[] = [];
    
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    
    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
        console.warn(
            `⚠️ Missing environment variables: ${missing.join(', ')}. ` +
            `Please set these in your Vercel project settings. ` +
            `The app may not work correctly without these variables.`
        );
    }
}

// Run validation (only logs warnings, doesn't throw)
try {
    validateEnvironment();
} catch (error) {
    // Silently continue - validation is non-blocking
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className} suppressHydrationWarning>
                <ErrorBoundary>
                    <SessionProvider>
                        <div className="min-h-screen bg-gray-50">
                            {children}
                        </div>
                    </SessionProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
