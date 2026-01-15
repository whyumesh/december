import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Allow only the landing page (exact match)
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Allow API route for landing page results display
  if (pathname === '/api/admin/results') {
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
