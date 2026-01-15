import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define allowed public routes
const allowedRoutes = [
  '/',                    // Landing page
  '/admin',               // Admin routes (authentication checked by useAdminAuth hook)
  '/auth/signin',         // Admin signin (NextAuth)
  '/voter/login',         // Voter login page
  '/voter',               // Voter routes (authentication checked in individual pages)
  '/candidate',           // Candidate routes
  '/elections',           // Elections public pages
  '/privacy-policy',      // Privacy policy page
  '/terms-and-conditions', // Terms and conditions page
  '/karobari-admin',      // Karobari admin routes
]

// API routes that should remain accessible
const allowedApiRoutes = [
  '/api/auth',            // NextAuth API routes
  '/api/admin',           // Admin API routes
  '/api/voter',           // Voter API routes
  '/api/candidate',       // Candidate API routes
  '/api/elections',       // Elections API routes
  '/api/karobari-admin',  // Karobari admin API routes
  '/api/health',          // Health check
  '/api/csrf-token',      // CSRF token endpoint
  '/api/upload',          // Upload API routes
  '/api/zones',           // Zones API
  '/api/trustees',       // Trustees API
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|mp4)$/)
  ) {
    return NextResponse.next()
  }

  // Allow API routes
  if (allowedApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow all specified public routes
  if (allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Allow all other routes (no blocking)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are handled in the middleware function itself
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
