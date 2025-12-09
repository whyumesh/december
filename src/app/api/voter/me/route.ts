import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, JWTError } from '@/lib/jwt'
import { handleError } from '@/lib/error-handler'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('voter-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify JWT token
    let decoded
    try {
      decoded = verifyToken(token)
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Find voter with their zones and voting status
    // Since we're using voter.id as userId in the session, we can find by id directly
    const voter = await prisma.voter.findUnique({
      where: { id: decoded.userId },
      include: {
        user: true,
        zone: true,
        yuvaPankZone: true,
        karobariZone: true,
        trusteeZone: true,
        votes: true
      }
    })

    if (!voter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 })
    }

    // Check which elections the voter has voted in
    const hasVoted = {
      yuvaPank: voter.votes.some(vote => vote.yuvaPankhCandidateId !== null),
      karobariMembers: voter.votes.some(vote => vote.karobariCandidateId !== null),
      trustees: voter.votes.some(vote => vote.trusteeCandidateId !== null)
    }

    // Helper function to fix Karnataka Gujarati spelling (remove extra 'ક')
    const fixKarnatakaGujarati = (nameGujarati: string | null): string | null => {
      if (!nameGujarati) return nameGujarati
      // Fix "કકર્ણાટક" (with extra 'ક') to "કર્ણાટક"
      return nameGujarati.replace(/કકર્ણાટક/g, 'કર્ણાટક')
    }

    // Mark Yuva Pankh zone as frozen:
    // - If it's not KARNATAKA_GOA or RAIGAD: always frozen (completed zones)
    // - If it's KARNATAKA_GOA or RAIGAD: frozen only if voter has voted
    // But still return it so the card can be shown with a completion message
    let yuvaPankZoneWithStatus = null
    if (voter.yuvaPankZone) {
      const isRaigadOrKarnataka = voter.yuvaPankZone.code === 'KARNATAKA_GOA' || voter.yuvaPankZone.code === 'RAIGAD'
      const isFrozen = !isRaigadOrKarnataka || (isRaigadOrKarnataka && hasVoted.yuvaPank)
      yuvaPankZoneWithStatus = {
        ...voter.yuvaPankZone,
        nameGujarati: fixKarnatakaGujarati(voter.yuvaPankZone.nameGujarati),
        isFrozen
      }
    }

    // Karobari zone - allow voting for uncontested winners
    let karobariZoneWithStatus = null
    if (voter.karobariZone) {
      karobariZoneWithStatus = {
        ...voter.karobariZone,
        nameGujarati: fixKarnatakaGujarati(voter.karobariZone.nameGujarati),
        isFrozen: false // Allow voting for uncontested winners
      }
    }

    // Fix trustee zone Gujarati spelling as well
    let trusteeZoneFixed = null
    if (voter.trusteeZone) {
      trusteeZoneFixed = {
        ...voter.trusteeZone,
        nameGujarati: fixKarnatakaGujarati(voter.trusteeZone.nameGujarati)
      }
    }

    return NextResponse.json({
      voter: {
        id: voter.id,
        voterId: voter.voterId,
        name: voter.user?.name || voter.name,
        phone: voter.user?.phone || voter.phone,
        region: voter.region, // Include region for eligibility checks
        age: voter.user?.age || voter.age, // Include age for eligibility checks
        dob: voter.user?.dateOfBirth || voter.dob || null, // Include DOB for age eligibility checks
        zone: voter.zone ? {
          ...voter.zone,
          nameGujarati: fixKarnatakaGujarati(voter.zone.nameGujarati)
        } : null, // Keep for backward compatibility
        yuvaPankZone: yuvaPankZoneWithStatus, // Include all zones with frozen status
        karobariZone: karobariZoneWithStatus, // Mark all Karobari zones as frozen/completed
        trusteeZone: trusteeZoneFixed,
        hasVoted
      }
    })

  } catch (error) {
    return handleError(error, { 
      endpoint: request.nextUrl.pathname,
      method: request.method 
    })
  }
}
