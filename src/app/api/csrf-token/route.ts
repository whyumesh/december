import { NextRequest, NextResponse } from 'next/server'
import { handleCSRFTokenRequest } from '@/lib/csrf'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    return await handleCSRFTokenRequest(request)
  } catch (error) {
    console.error('CSRF token request error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
