"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface ClientSessionProviderProps {
    children: React.ReactNode;
}

/**
 * SessionProvider wrapper for NextAuth
 * Always renders SessionProvider - Next.js will handle SSR properly
 * with force-dynamic configuration in layouts
 */
export default function ClientSessionProvider({ children }: ClientSessionProviderProps) {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

