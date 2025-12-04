import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isEligibleToVote } from '@/lib/age-validation'
import { verifyToken } from '@/lib/jwt'
import { handleError } from '@/lib/error-handler'
import { getOrCreateTrusteeNotaCandidate, getOrCreateTrusteeNotaCandidateForSeat } from '@/lib/nota'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0


export async function POST(request: NextRequest) {
  try {
    const { votes } = await request.json()
    
    if (!votes || typeof votes !== 'object' || Object.keys(votes).length === 0) {
      return NextResponse.json({ error: 'Invalid or empty vote data' }, { status: 400 })
    }

    const token = request.cookies.get('voter-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const voter = await prisma.voter.findUnique({
      where: { id: decoded.userId }, // Use id instead of userId since token contains voter.id
      include: {
        user: true,
        zone: true, // Ensure the voter's zone is included
        votes: true
      }
    })

    if (!voter || !voter.zone) {
      return NextResponse.json({ error: 'Voter or voter zone not found' }, { status: 404 })
    }

    const election = await prisma.election.findFirst({ where: { type: 'TRUSTEES', status: 'ACTIVE' } })
    if (!election) {
      return NextResponse.json({ error: 'Trustees election not found' }, { status: 404 })
    }

    const existingTrusteeVotes = await prisma.vote.count({
      where: {
        voterId: voter.id,
        electionId: election.id
      }
    })

    if (existingTrusteeVotes > 0) {
      return NextResponse.json({ error: 'You have already voted in the Trustees election' }, { status: 400 })
    }

    // Check if voter has trustee zone assigned
    if (!voter.trusteeZoneId) {
      return NextResponse.json({
        error: 'You are not eligible to vote in the Trustees election. You are not assigned to a trustee zone.'
      }, { status: 403 })
    }

    // Check election eligibility using the validation function
    const eligibility = isEligibleToVote(
      { 
        age: voter.user?.age || voter.age, 
        dateOfBirth: voter.user?.dateOfBirth || (voter.dob ? new Date(voter.dob) : null), 
        jurisdiction: voter.user?.jurisdiction || 'LOCAL' 
      },
      { 
        voterMinAge: election.voterMinAge, // null means all ages
        voterMaxAge: election.voterMaxAge, 
        voterJurisdiction: election.voterJurisdiction,
        candidateJurisdiction: election.candidateJurisdiction || election.voterJurisdiction
      }
    )
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason || 'You are not eligible to vote' }, { status: 403 })
    }

    // --- MODIFIED VALIDATION LOGIC FOR MULTIPLE ZONES WITH MULTIPLE SEATS ---
    // 1. Get all zones and their seat requirements
    const allZones = await prisma.zone.findMany({ 
      where: { electionType: 'TRUSTEES' },
      select: { id: true, name: true, seats: true }
    });
    
    const totalRequiredSeats = allZones.reduce((sum, zone) => sum + zone.seats, 0);
    const submittedVotes = Object.keys(votes);
    
    if (submittedVotes.length !== totalRequiredSeats) {
      return NextResponse.json({ 
        error: `You must submit votes for all ${totalRequiredSeats} seats across ${allZones.length} zones. You submitted ${submittedVotes.length} votes.` 
      }, { status: 400 });
    }

    // 2. Group votes by zone and validate
    const zoneVotes: Record<string, string[]> = {};
    for (const [voteKey, trusteeId] of Object.entries(votes)) {
      const [zoneId] = voteKey.split('_');
      if (!zoneVotes[zoneId]) {
        zoneVotes[zoneId] = [];
      }
      zoneVotes[zoneId].push(trusteeId as string);
    }

    // 3. Validate each zone has the correct number of votes
    for (const zone of allZones) {
      const zoneVoteCount = zoneVotes[zone.id]?.length || 0;
      if (zoneVoteCount !== zone.seats) {
        return NextResponse.json({ 
          error: `Zone ${zone.name} requires exactly ${zone.seats} vote${zone.seats > 1 ? 's' : ''}, but you submitted ${zoneVoteCount}` 
        }, { status: 400 });
      }
    }

    // 4. Validate each trustee belongs to the correct zone
    const validationErrors: string[] = [];
    const validatedVotes: Array<{ zoneId: string; trusteeId: string; trustee: any; isNota: boolean }> = [];
    
    for (const [voteKey, trusteeId] of Object.entries(votes)) {
      const [zoneId, seatIndex] = voteKey.split('_');
      
      // Handle NOTA votes (they start with "NOTA_")
      if (typeof trusteeId === 'string' && trusteeId.startsWith('NOTA_')) {
        const parts = trusteeId.split('_')
        const notaZoneId = parts[1] || zoneId
        // Create unique NOTA candidate for each seat position to avoid unique constraint violation
        const notaCandidateId = await getOrCreateTrusteeNotaCandidateForSeat(notaZoneId, seatIndex || '0')
        validatedVotes.push({ zoneId: notaZoneId, trusteeId: notaCandidateId, trustee: null, isNota: true });
        continue;
      }
      
      // Try to find as TrusteeCandidate first
      let trustee = await prisma.trusteeCandidate.findUnique({ 
        where: { id: trusteeId as string },
        include: { zone: true }
      });
      
      // If not found as TrusteeCandidate, try as Voter and find/create corresponding TrusteeCandidate
      if (!trustee) {
        const voterAsTrustee = await prisma.voter.findUnique({
          where: { id: trusteeId as string },
          include: { trusteeZone: true }
        });
        
        if (voterAsTrustee) {
          // Validate voter belongs to the correct zone
          if (voterAsTrustee.trusteeZoneId !== zoneId) {
            const zone = await prisma.zone.findUnique({ 
              where: { id: zoneId },
              select: { name: true }
            });
            validationErrors.push(
              `The selected trustee "${voterAsTrustee.name}" does not belong to zone "${zone?.name || zoneId}". Please refresh the page and select a different trustee.`
            );
            continue;
          }
          
          // Check if voter is active
          if (!voterAsTrustee.isActive) {
            validationErrors.push(
              `The trustee "${voterAsTrustee.name}" is not active. Please select a different trustee.`
            );
            continue;
          }
          
          // Try to find existing TrusteeCandidate for this voter
          trustee = await prisma.trusteeCandidate.findFirst({
            where: {
              userId: voterAsTrustee.userId || voterAsTrustee.id,
              zoneId: zoneId
            },
            include: { zone: true }
          });
          
          // If no TrusteeCandidate exists, create one on the fly (for fallback case)
          if (!trustee && voterAsTrustee.trusteeZoneId === zoneId) {
            trustee = await prisma.trusteeCandidate.create({
              data: {
                userId: voterAsTrustee.userId || voterAsTrustee.id,
                name: voterAsTrustee.name,
                nameGujarati: voterAsTrustee.name,
                region: voterAsTrustee.region,
                position: 'Trustee',
                status: 'APPROVED',
                zoneId: zoneId,
                isOnlineRegistration: false
              },
              include: { zone: true }
            });
          }
        }
      }
      
      if (!trustee) {
        // Get available trustees for better error message
        const zone = await prisma.zone.findUnique({ 
          where: { id: zoneId },
          select: { name: true }
        });
        validationErrors.push(
          `The selected trustee (ID: ${trusteeId}) is no longer available in zone "${zone?.name || zoneId}". Please refresh the page and select a different trustee.`
        );
        continue;
      }
      
      // Check if trustee is approved (only for TrusteeCandidate)
      if ('status' in trustee && trustee.status !== 'APPROVED') {
        validationErrors.push(
          `The trustee "${trustee.name}" is not eligible for voting (Status: ${trustee.status}). Please select a different trustee.`
        );
        continue;
      }
      
      if (!trustee.zone) {
        validationErrors.push(
          `The trustee "${trustee.name}" has no associated zone. Please contact support.`
        );
        continue;
      }
      
      if (trustee.zoneId !== zoneId) {
        validationErrors.push(
          `The trustee "${trustee.name}" does not belong to the selected zone. Please refresh the page and try again.`
        );
        continue;
      }
      
      if (trustee.zone.electionType !== 'TRUSTEES') {
        validationErrors.push(
          `Invalid zone type for trustee "${trustee.name}". Please contact support.`
        );
        continue;
      }
      
      // Use the TrusteeCandidate ID (not the original trusteeId which might be a voter ID)
      validatedVotes.push({ zoneId, trusteeId: trustee.id, trustee, isNota: false });
    }
    
    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: validationErrors[0], // Return first error for user
        allErrors: validationErrors // Include all errors for debugging
      }, { status: 400 });
    }
    
    // Filter out NOTA votes for actual vote creation
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? request.ip
      ?? 'unknown'
    const userAgent = request.headers.get('user-agent') ?? 'unknown'

    const actualVotes = validatedVotes.filter(v => !v.isNota);
    const notaVotes = validatedVotes.filter(v => v.isNota);
    
    // 5. Create all votes (including NOTA) in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        for (const voteRecord of validatedVotes) {
          const data: any = {
            voterId: voter.id,
            electionId: election.id,
            timestamp: new Date(),
            ipAddress,
            userAgent
          }

          if (voteRecord.trusteeId) {
            data.trusteeCandidateId = voteRecord.trusteeId
          }

          await tx.vote.create({ data })
        }
      });

      return NextResponse.json({ 
        message: `Successfully submitted ${actualVotes.length} trustee votes and ${notaVotes.length} NOTA entries across ${allZones.length} zones` 
      });
      
    } catch (transactionError: any) {
      return NextResponse.json({ 
        error: transactionError.message || 'Error submitting votes. Please try again.' 
      }, { status: 500 });
    }
    // --- END OF MODIFIED VALIDATION ---

  } catch (error) {
    // Handle JWT errors specifically for better client feedback
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return handleError(error, { 
      endpoint: request.nextUrl.pathname,
      method: request.method 
    });
  }
}
