import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define allowed public routes - only landing page and admin login pages
const allowedRoutes = [
  '/',                    // Landing page
  '/admin/login',         // Admin login page
  '/auth/signin',         // Admin signin (NextAuth)
]

// API routes that should remain accessible for login functionality
const allowedApiRoutes = [
  '/api/auth',            // NextAuth API routes
  '/api/admin',           // Admin API routes (for login)
  '/api/health',          // Health check
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

  // Allow API routes for authentication
  if (allowedApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow only the specified public routes
  if (allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Block all other routes - redirect to landing page
  return NextResponse.redirect(new URL('/', request.url))
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
