import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

const RESULTS_DECLARED_KEY = 'resultsDeclaredAt'

function getResultsPassword(): string {
  return process.env.ELECTION_RESULTS_PASSWORD || 'Maheshwari@11'
}

/** Create election_config table if missing (fallback when migrate deploy was not run). */
async function ensureElectionConfigTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "election_config" (
      "id" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "value" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "election_config_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "election_config_key_key" ON "election_config"("key");
  `)
}

/**
 * Verify declaration token (issued only after password + both OTPs).
 * Token can be in Authorization: Bearer <token> or body.declarationToken.
 */
function getAuthorizedFromRequest(request: NextRequest, body: { declarationToken?: string }): boolean {
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const token = body.declarationToken || bearer
  if (!token) return false
  try {
    const secret = getResultsPassword()
    const decoded = jwt.verify(token, secret) as { purpose?: string }
    return decoded?.purpose === 'results-declaration'
  } catch {
    return false
  }
}

/**
 * GET: Public status of whether results are declared on the landing page.
 */
export async function GET() {
  try {
    const config = await prisma.electionConfig.findUnique({
      where: { key: RESULTS_DECLARED_KEY },
      select: { value: true }
    })
    const declared = !!config?.value
    return NextResponse.json({
      declared,
      declaredAt: config?.value || null
    })
  } catch (e) {
    if (isTableMissingError(e)) {
      try {
        await ensureElectionConfigTable()
        const config = await prisma.electionConfig.findUnique({
          where: { key: RESULTS_DECLARED_KEY },
          select: { value: true }
        })
        return NextResponse.json({
          declared: !!config?.value,
          declaredAt: config?.value || null
        })
      } catch (e2) {
        console.error('Declare results GET error:', e2)
      }
    }
    console.error('Declare results GET error:', e)
    return NextResponse.json({ declared: false, declaredAt: null })
  }
}

function isTableMissingError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return (
    msg.includes('does not exist') ||
    msg.includes('Unknown arg') ||
    msg.includes('election_config') ||
    msg.includes('electionConfig') ||
    msg.includes('relation') ||
    msg.includes('P2021') ||
    msg.includes('P2010')
  )
}

/**
 * POST: Declare or revoke results on landing page.
 * Authority: only a valid declaration token (obtained after password + both OTPs on the results page).
 * Body: { action?: 'declare' | 'revoke', declarationToken?: string }
 * Or: Authorization: Bearer <declarationToken>
 */
export async function POST(request: NextRequest) {
  try {
    let body: { action?: string; declarationToken?: string } = {}
    try {
      body = await request.json()
    } catch {
      // no body
    }

    const action = (body.action === 'revoke' ? 'revoke' : 'declare') as 'declare' | 'revoke'
    const authorized = getAuthorizedFromRequest(request, body)

    if (!authorized) {
      return NextResponse.json(
        {
          error: 'Unauthorized. Complete password and both OTP verifications on the Result Declaration page to get declaration authority, then try again.'
        },
        { status: 401 }
      )
    }

    if (action === 'revoke') {
      try {
        await prisma.electionConfig.upsert({
          where: { key: RESULTS_DECLARED_KEY },
          create: { key: RESULTS_DECLARED_KEY, value: null },
          update: { value: null }
        })
      } catch (e) {
        if (isTableMissingError(e)) {
          try {
            await ensureElectionConfigTable()
            await prisma.electionConfig.upsert({
              where: { key: RESULTS_DECLARED_KEY },
              create: { key: RESULTS_DECLARED_KEY, value: null },
              update: { value: null }
            })
          } catch (e2) {
            console.error('Revoke results error:', e2)
            return NextResponse.json(
              { error: 'Failed to revoke declaration.', details: e2 instanceof Error ? e2.message : String(e2) },
              { status: 500 }
            )
          }
        } else {
          console.error('Revoke results error:', e)
          return NextResponse.json(
            { error: 'Failed to revoke declaration.', details: e instanceof Error ? e.message : String(e) },
            { status: 500 }
          )
        }
      }
      return NextResponse.json({
        success: true,
        declared: false,
        message: 'Results are no longer declared on the landing page. You can declare again when ready.'
      })
    }

    const now = new Date().toISOString()
    try {
      await prisma.electionConfig.upsert({
        where: { key: RESULTS_DECLARED_KEY },
        create: { key: RESULTS_DECLARED_KEY, value: now },
        update: { value: now }
      })
    } catch (e) {
      if (isTableMissingError(e)) {
        try {
          await ensureElectionConfigTable()
          await prisma.electionConfig.upsert({
            where: { key: RESULTS_DECLARED_KEY },
            create: { key: RESULTS_DECLARED_KEY, value: now },
            update: { value: now }
          })
        } catch (e2) {
          console.error('Declare results error:', e2)
          return NextResponse.json(
            {
              error: 'Declaration table could not be created. Run: npx prisma migrate deploy',
              details: e2 instanceof Error ? e2.message : String(e2)
            },
            { status: 503 }
          )
        }
      } else {
        console.error('Declare results error:', e)
        return NextResponse.json(
          { error: 'Failed to declare results.', details: e instanceof Error ? e.message : String(e) },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      declared: true,
      declaredAt: now,
      message: 'Results are now declared on the landing page.'
    })
  } catch (error) {
    console.error('Declare results error:', error)
    return NextResponse.json(
      {
        error: 'Failed to declare results.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
