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
    title: "KMMMS ELECTION 2026",
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <SessionProvider>
                    <ErrorBoundary>
                        <div className="min-h-screen bg-gray-50">
                            {children}
                        </div>
                    </ErrorBoundary>
                </SessionProvider>
            </body>
        </html>
    );
}
