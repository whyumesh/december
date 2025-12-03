import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, JWTError } from '@/lib/jwt'
import { handleError } from '@/lib/error-handler'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('voter-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get voter information
    // Note: decoded.userId contains voter.id (set in login route)
    const voter = await prisma.voter.findUnique({
      where: { id: decoded.userId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!voter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 })
    }

    // Check cache for voter-specific data
    const cacheKey = CacheKeys.voterDashboard(decoded.userId)
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log('Returning cached voter dashboard data')
      return NextResponse.json(cached)
    }

    // Get approved candidates for voting from all candidate tables
    const [yuvaPankhCandidates, karobariCandidates, trusteeCandidates] = await Promise.all([
      prisma.yuvaPankhCandidate.findMany({
        where: { 
          status: 'APPROVED',
          position: { not: 'NOTA' } // Exclude NOTA candidates
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.karobariCandidate.findMany({
        where: { 
          status: 'APPROVED',
          position: { not: 'NOTA' } // Exclude NOTA candidates
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.trusteeCandidate.findMany({
        where: { 
          status: 'APPROVED',
          position: { not: { startsWith: 'NOTA' } } // Exclude NOTA candidates
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    // Combine all candidates
    const candidates = [
      ...yuvaPankhCandidates,
      ...karobariCandidates,
      ...trusteeCandidates
    ];

    // Group candidates by position
    const positionsMap = new Map()
    
    candidates.forEach(candidate => {
      if (!positionsMap.has(candidate.position)) {
        positionsMap.set(candidate.position, {
          id: candidate.position,
          title: candidate.position.replace('_', ' '),
          candidates: []
        })
      }
      
      positionsMap.get(candidate.position)?.candidates.push({
        id: candidate.id,
        name: candidate.user?.name || 'Unknown',
        party: candidate.party,
        position: candidate.position,
        manifesto: candidate.manifesto,
        experience: candidate.experience
      })
    })

    const positions = Array.from(positionsMap.values())

    const response = {
      voterInfo: {
        name: voter.user?.name || voter.name,
        voterId: voter.voterId,
        region: voter.region,
        hasVoted: voter.hasVoted
      },
      positions
    }

    // Cache the response for 2 minutes
    cache.set(cacheKey, response, CacheTTL.SHORT * 4)

    return NextResponse.json(response)

  } catch (error) {
    return handleError(error, { 
      endpoint: request.nextUrl.pathname,
      method: request.method 
    })
  }
}
