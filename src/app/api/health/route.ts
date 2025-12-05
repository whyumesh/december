import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      checks: {
        nextAuthUrl: {
          present: !!process.env.NEXTAUTH_URL,
          value: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
        },
        nextAuthSecret: {
          present: !!process.env.NEXTAUTH_SECRET,
          value: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
        },
        databaseUrl: {
          present: !!process.env.DATABASE_URL,
          value: process.env.DATABASE_URL ? 'Set' : 'Missing',
        },
      },
      status: 'ok' as const,
    }

    // Determine overall status
    const criticalMissing = [
      !checks.checks.nextAuthUrl.present,
      !checks.checks.nextAuthSecret.present,
    ].filter(Boolean).length

    if (criticalMissing > 0) {
      checks.status = 'degraded' as const
    }

    return NextResponse.json(checks, {
      status: checks.status === 'ok' ? 200 : 200, // Always return 200, but indicate status in body
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
