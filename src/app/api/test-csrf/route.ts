import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection } from '@/lib/csrf';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function handler(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'CSRF test successful',
      timestamp: new Date().toISOString(),
      method: request.method
    });
  } catch (error) {
    console.error('CSRF test handler error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(handler);
export const GET = handler;
