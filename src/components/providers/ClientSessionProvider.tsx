"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

interface ClientSessionProviderProps {
    children: React.ReactNode;
}

/**
 * Client-only SessionProvider wrapper that only renders on the client side
 * This prevents prerendering errors during build time
 */
export default function ClientSessionProvider({ children }: ClientSessionProviderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR/build, render children without SessionProvider to avoid hooks errors
    if (!mounted || typeof window === 'undefined') {
        return <>{children}</>;
    }

    // On client, wrap with SessionProvider
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

