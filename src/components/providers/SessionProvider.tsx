"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Component, ReactNode } from "react";

interface SessionProviderProps {
    children: React.ReactNode;
}

// Simple error boundary for SessionProvider
class SessionProviderErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error("SessionProvider error:", error);
        if (error.message?.includes('NEXTAUTH') || error.message?.includes('secret')) {
            console.error(
                "⚠️ NextAuth configuration error. " +
                "Make sure NEXTAUTH_URL and NEXTAUTH_SECRET are set in Vercel environment variables."
            );
        }
    }

    render() {
        if (this.state.hasError) {
            // Still render children - app should work for public pages without auth
            return <>{this.props.children}</>;
        }
        return this.props.children;
    }
}

export default function SessionProvider({ children }: SessionProviderProps) {
    // Wrap in error boundary to catch any initialization errors
    // This ensures the app can still render even if NextAuth fails
    return (
        <SessionProviderErrorBoundary>
            <NextAuthSessionProvider>
                {children}
            </NextAuthSessionProvider>
        </SessionProviderErrorBoundary>
    );
}
