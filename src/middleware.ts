import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = {
  admin: ['/admin'],
  candidate: ['/candidate'],
  voter: ['/voter']
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/candidate/login',
  '/candidate/signup',
  '/candidate/register',
  '/voter/login',
  '/api/voter/send-otp',
  '/api/voter/verify-otp',
  '/api/voter/login',
  '/elections'
]

// Simple JWT decode without verification (for Edge Functions)
// Full verification happens in API routes
function decodeToken(token: string): { userId?: string; role?: string } | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// Check if token exists and has basic structure (lightweight check for middleware)
function hasValidTokenStructure(token: string): boolean {
  return token.split('.').length === 3
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('next-auth.session-token')?.value
    if (!token || !hasValidTokenStructure(token)) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Lightweight decode - full verification in API routes
    const decoded = decodeToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Check for candidate routes
  if (pathname.startsWith('/candidate')) {
    const token = request.cookies.get('candidate-token')?.value
    if (!token || !hasValidTokenStructure(token)) {
      return NextResponse.redirect(new URL('/candidate/login', request.url))
    }

    // Lightweight decode - full verification in API routes
    const decoded = decodeToken(token)
    if (!decoded || decoded.role !== 'CANDIDATE') {
      return NextResponse.redirect(new URL('/candidate/login', request.url))
    }
  }

  // Check for voter routes
  if (pathname.startsWith('/voter')) {
    const token = request.cookies.get('voter-token')?.value
    if (!token || !hasValidTokenStructure(token)) {
      return NextResponse.redirect(new URL('/voter/login', request.url))
    }

    // Lightweight decode - full verification in API routes
    const decoded = decodeToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.redirect(new URL('/voter/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
