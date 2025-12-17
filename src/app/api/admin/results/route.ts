import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering - this route uses database queries
export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    // Gracefully handle missing database URL (e.g., during build)
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty results')
      return NextResponse.json({
        karobari: { zones: [], totalVoters: 0, totalVotes: 0 },
        trustees: { zones: [], totalVoters: 0, totalVotes: 0 },
        yuvaPankh: { zones: [], totalVoters: 0, totalVotes: 0 },
        timestamp: new Date().toISOString()
      })
    }
    // Check cache first
    const cacheKey = 'election_results_v2'; // Changed cache key to force refresh
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached election results');
      return NextResponse.json(cached.data);
    }

    console.log('Admin results API called - fetching voter turnout with optimized queries');

    // Single optimized query to get all data at once
    const [zones, karobariVoterCounts, trusteeVoterCounts, yuvaPankVoterCounts, voteCounts, totalVotersInSystem] = await Promise.all([
      // Get all active zones
      prisma.zone.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          nameGujarati: true,
          electionType: true,
          seats: true
        }
      }),
      
      // Get voter counts for Karobari zones separately
      prisma.voter.groupBy({
        by: ['karobariZoneId'],
        _count: { id: true },
        where: {
          karobariZoneId: { not: null }
        }
      }),
      
      // Get voter counts for Trustee zones separately
      prisma.voter.groupBy({
        by: ['trusteeZoneId'],
        _count: { id: true },
        where: {
          trusteeZoneId: { not: null }
        }
      }),
      
      // Get voter counts for Yuva Pankh zones separately
      prisma.voter.groupBy({
        by: ['yuvaPankZoneId'],
        _count: { id: true },
        where: {
          yuvaPankZoneId: { not: null }
        }
      }),
      
      // Get all votes (including NOTA) for turnout calculations
      prisma.vote.findMany({
        select: {
          voterId: true,
          election: { select: { type: true } },
          karobariCandidate: { select: { id: true, zoneId: true, position: true, name: true } },
          trusteeCandidate: { select: { id: true, zoneId: true, position: true, name: true } },
          yuvaPankhCandidate: { select: { id: true, zoneId: true, position: true, name: true } },
          yuvaPankhNominee: { select: { id: true, zoneId: true, position: true, name: true } },
          voter: {
            select: {
              trusteeZoneId: true,
              yuvaPankZoneId: true,
              karobariZoneId: true
            }
          }
        },
        where: {
          election: {
            type: { in: ['KAROBARI_MEMBERS', 'TRUSTEES', 'YUVA_PANK'] }
          }
        }
      }),
      
      // Get total voters in the system
      prisma.voter.count()
    ]);

    // Get candidate zone mappings for vote counting
    const [karobariCandidates, trusteeCandidates, yuvaPankhCandidates, yuvaPankhNominees] = await Promise.all([
      prisma.karobariCandidate.findMany({
        select: { id: true, zoneId: true }
      }),
      prisma.trusteeCandidate.findMany({
        select: { id: true, zoneId: true }
      }),
      prisma.yuvaPankhCandidate.findMany({
        select: { id: true, zoneId: true }
      }),
      prisma.yuvaPankhNominee.findMany({
        select: { id: true, zoneId: true }
      })
    ]);

    // Create lookup maps for efficient data processing
    const voterCountMap = new Map();
    
    // Map Karobari zone voter counts
    karobariVoterCounts.forEach(item => {
      if (item.karobariZoneId) {
        voterCountMap.set(`karobari_${item.karobariZoneId}`, item._count.id);
      }
    });
    
    // Map Trustee zone voter counts
    trusteeVoterCounts.forEach(item => {
      if (item.trusteeZoneId) {
        voterCountMap.set(`trustee_${item.trusteeZoneId}`, item._count.id);
      }
    });
    
    // Map Yuva Pankh zone voter counts
    yuvaPankVoterCounts.forEach(item => {
      if (item.yuvaPankZoneId) {
        voterCountMap.set(`yuva_${item.yuvaPankZoneId}`, item._count.id);
      }
    });

    const candidateZoneMap = new Map();
    [...karobariCandidates, ...trusteeCandidates, ...yuvaPankhCandidates, ...yuvaPankhNominees].forEach(candidate => {
      candidateZoneMap.set(candidate.id, candidate.zoneId);
    });

    // Count unique voters per zone for each election type
    const voteCountMap = new Map();
    
    // Group votes by election type and count unique voters per zone
    const karobariVotes = voteCounts.filter(v => v.election?.type === 'KAROBARI_MEMBERS');
    const trusteeVotes = voteCounts.filter(v => v.election?.type === 'TRUSTEES');
    const yuvaVotes = voteCounts.filter(v => v.election?.type === 'YUVA_PANK');

    const voteStatsByZone = new Map<string, { voters: Set<string>; actualVotes: number; notaVotes: number }>();

    const addVoteStat = (electionKey: string, zoneId: string, voterId: string, isNota?: boolean) => {
      const key = `${electionKey}_${zoneId}`;
      if (!voteStatsByZone.has(key)) {
        voteStatsByZone.set(key, { voters: new Set(), actualVotes: 0, notaVotes: 0 });
      }
      const stats = voteStatsByZone.get(key)!;
      stats.voters.add(voterId);
      if (isNota) {
        stats.notaVotes += 1;
      } else {
        stats.actualVotes += 1;
      }
    };
    
    // Process Karobari votes
    const karobariVotersByZone = new Map();
    karobariVotes.forEach(vote => {
      const candidate = vote.karobariCandidate;
      const zoneId = candidate?.zoneId || (candidate ? candidateZoneMap.get(candidate.id) : undefined);
      const isNotaVote = candidate?.position === 'NOTA' || candidate?.name?.startsWith('NOTA');
      if (zoneId) {
        if (!karobariVotersByZone.has(zoneId)) {
          karobariVotersByZone.set(zoneId, new Set());
        }
        karobariVotersByZone.get(zoneId).add(vote.voterId);
        addVoteStat('karobari', zoneId, vote.voterId, isNotaVote);
      }
    });
    karobariVotersByZone.forEach((voters, zoneId) => {
      voteCountMap.set(`karobari_${zoneId}`, voters.size);
    });
    
    // Process Trustee votes - count based on voter's trustee zone, not candidate's zone
    const trusteeVotersByZone = new Map();
    trusteeVotes.forEach(vote => {
      const candidate = vote.trusteeCandidate;
      // Use voter's trustee zone instead of candidate's zone
      const zoneId = vote.voter?.trusteeZoneId || undefined;
      const isNotaVote = candidate?.position === 'NOTA' || candidate?.name?.startsWith('NOTA') || candidate?.position?.startsWith('NOTA_SEAT');
      if (zoneId) {
        if (!trusteeVotersByZone.has(zoneId)) {
          trusteeVotersByZone.set(zoneId, new Set());
        }
        trusteeVotersByZone.get(zoneId).add(vote.voterId);
        addVoteStat('trustee', zoneId, vote.voterId, isNotaVote);
      }
    });
    trusteeVotersByZone.forEach((voters, zoneId) => {
      voteCountMap.set(`trustee_${zoneId}`, voters.size);
    });
    
    // Process Yuva Pankh votes - count based on voter's yuva pank zone, not candidate's zone
    const yuvaVotersByZone = new Map();
    yuvaVotes.forEach(vote => {
      const candidate = vote.yuvaPankhCandidate || vote.yuvaPankhNominee;
      // Use voter's yuva pank zone instead of candidate's zone
      const zoneId = vote.voter?.yuvaPankZoneId || undefined;
      const isNotaVote = candidate?.position === 'NOTA' || candidate?.name?.startsWith('NOTA');
      if (zoneId) {
        if (!yuvaVotersByZone.has(zoneId)) {
          yuvaVotersByZone.set(zoneId, new Set());
        }
        yuvaVotersByZone.get(zoneId).add(vote.voterId);
        addVoteStat('yuva', zoneId, vote.voterId, isNotaVote);
      }
    });
    yuvaVotersByZone.forEach((voters, zoneId) => {
      voteCountMap.set(`yuva_${zoneId}`, voters.size);
    });

    // Process data for each election type
    const processElectionData = (electionType: string, zones: any[]) => {
      return zones.map(zone => {
        const voterKey = `${electionType}_${zone.id}`;
        const voteKey = `${electionType}_${zone.id}`;
        
        const totalVoters = voterCountMap.get(voterKey) || 0;
        const uniqueVoters = voteCountMap.get(voteKey) || 0; // unique voters who participated
        const voteStats = voteStatsByZone.get(voteKey);
        const actualVotes = voteStats?.actualVotes || 0;
        const notaVotes = voteStats?.notaVotes || 0;
        // For trustee elections, count NOTA as votes - totalVotes includes both actual and NOTA votes
        const totalVotes = actualVotes + notaVotes;
        const turnoutPercentage = totalVoters > 0 ? ((uniqueVoters / totalVoters) * 100) : 0;

        return {
          zoneId: zone.id,
          zoneCode: zone.code,
          zoneName: zone.name,
          zoneNameGujarati: zone.nameGujarati,
          seats: zone.seats,
          totalVoters,
          totalVotes,
          uniqueVoters, // Number of unique voters who voted in this zone
          actualVotes,
          notaVotes,
          turnoutPercentage: parseFloat(turnoutPercentage.toFixed(1))
        };
      }).sort((a, b) => b.turnoutPercentage - a.turnoutPercentage);
    };

    // Group zones by election type and process data
    const zonesByElectionType = {
      KAROBARI: zones.filter(zone => zone.electionType === 'KAROBARI_MEMBERS'),
      TRUSTEES: zones.filter(zone => zone.electionType === 'TRUSTEES'),
      YUVA_PANK: zones.filter(zone => zone.electionType === 'YUVA_PANK')
    };

    // Karobari data processing removed - hidden from UI
    const trusteeTurnout = processElectionData('trustee', zonesByElectionType.TRUSTEES);
    const yuvaPankhTurnout = processElectionData('yuva', zonesByElectionType.YUVA_PANK);

    // Process Karobari data but don't include in response (hidden from UI)
    const karobariTurnout = processElectionData('karobari', zonesByElectionType.KAROBARI);
    
    const response = {
      // Karobari data included but hidden from UI - set to empty array or null
      karobari: {
        name: 'Karobari Members',
        regions: karobariTurnout,
        totalRegions: karobariTurnout.length,
        totalVoters: karobariTurnout.reduce((sum, region) => sum + region.totalVoters, 0),
        totalVotes: karobariTurnout.reduce((sum, region) => sum + region.totalVotes, 0)
      },
      trustee: {
        name: 'Trustee Members',
        regions: trusteeTurnout,
        totalRegions: trusteeTurnout.length,
        totalVoters: trusteeTurnout.reduce((sum, region) => sum + region.totalVoters, 0),
        totalVotes: trusteeTurnout.reduce((sum, region) => sum + region.totalVotes, 0)
      },
      yuvaPankh: {
        name: 'Yuva Pankh Members',
        regions: yuvaPankhTurnout,
        totalRegions: yuvaPankhTurnout.length,
        totalVoters: yuvaPankhTurnout.reduce((sum, region) => sum + region.totalVoters, 0),
        totalVotes: yuvaPankhTurnout.reduce((sum, region) => sum + region.totalVotes, 0)
      },
      totalVotersInSystem: totalVotersInSystem, // Total voters in the entire system
      timestamp: new Date().toISOString()
    };

    console.log('Voter turnout data calculated:', {
      // Karobari data removed - hidden from UI
      trustee: { regions: trusteeTurnout.length, voters: response.trustee.totalVoters, votes: response.trustee.totalVotes },
      yuvaPankh: { regions: yuvaPankhTurnout.length, voters: response.yuvaPankh.totalVoters, votes: response.yuvaPankh.totalVotes },
      totalVotersInSystem: totalVotersInSystem
    });
    
    // Debug: Log voter count map to verify zone-wise counts
    console.log('Voter count map (zone-wise):', {
      karobari: Array.from(voterCountMap.entries()).filter(([key]) => key.startsWith('karobari_')),
      trustee: Array.from(voterCountMap.entries()).filter(([key]) => key.startsWith('trustee_')),
      yuva: Array.from(voterCountMap.entries()).filter(([key]) => key.startsWith('yuva_'))
    });
    
    // Debug: Log some sample data
    console.log('Sample Yuva Pankh data:', yuvaPankhTurnout.slice(0, 3));
    console.log('Sample Trustee data:', trusteeTurnout.slice(0, 3));

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    const apiResponse = NextResponse.json(response);
    
    // Set appropriate caching headers
    apiResponse.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    apiResponse.headers.set('X-Cache-Status', 'MISS');
    
    return apiResponse;

  } catch (error) {
    console.error('Error fetching voter turnout data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Check if it's a database connection error
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('connection') || errorMessage.includes('P1001')) {
      return NextResponse.json({ 
        error: 'Database connection error',
        details: 'Please check your DATABASE_URL configuration in .env.local',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}