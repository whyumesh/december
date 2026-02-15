import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { measureApiPerformance } from '@/lib/performance'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  return measureApiPerformance('election-results', async () => {
    try {
      console.log('Election results API called');

      // Check cache first
      const cacheKey = CacheKeys.adminResults
      const cached = cache.get(cacheKey)
      if (cached) {
        console.log('Returning cached election results')
        return NextResponse.json(cached)
      }

      // Build results from Vote table only (same logic as export) so UI matches export data
      const formatResults = (resultsMap: Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>) => {
        return Array.from(resultsMap.entries()).map(([zoneId, zoneData]) => ({
          zoneId,
          zone: zoneData.zone,
          candidates: Array.from(zoneData.candidates.values())
            .sort((a, b) => b.votes - a.votes)
        }));
      };

      // Yuva Pankh: Vote table groupBy (same as export-insights)
      const yuvaPankhVoteCounts = await prisma.vote.groupBy({
        by: ['yuvaPankhCandidateId'],
        where: { yuvaPankhCandidateId: { not: null } },
        _count: { id: true }
      });
      const yuvaPankhCandidateIds = yuvaPankhVoteCounts.map(v => v.yuvaPankhCandidateId!).filter(Boolean);
      const yuvaPankhCandidates = yuvaPankhCandidateIds.length > 0
        ? await prisma.yuvaPankhCandidate.findMany({
            where: { id: { in: yuvaPankhCandidateIds } },
            include: {
              user: { select: { name: true } },
              zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
            }
          })
        : [];
      const yuvaPankhResults = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>();
      yuvaPankhVoteCounts.forEach(vc => {
        if (!vc.yuvaPankhCandidateId) return;
        const candidate = yuvaPankhCandidates.find(c => c.id === vc.yuvaPankhCandidateId);
        if (!candidate?.zone) return;
        const zoneId = candidate.zoneId;
        const name = candidate.user?.name || candidate.name || 'Unknown';
        const votes = vc._count.id;
        if (!yuvaPankhResults.has(zoneId)) {
          yuvaPankhResults.set(zoneId, { zone: candidate.zone, candidates: new Map() });
        }
        yuvaPankhResults.get(zoneId)!.candidates.set(candidate.id, { id: candidate.id, name, votes });
      });

      // Karobari: Vote table groupBy (same pattern as export)
      const karobariVoteCounts = await prisma.vote.groupBy({
        by: ['karobariCandidateId'],
        where: { karobariCandidateId: { not: null } },
        _count: { id: true }
      });
      const karobariCandidateIds = karobariVoteCounts.map(v => v.karobariCandidateId!).filter(Boolean);
      const karobariCandidates = karobariCandidateIds.length > 0
        ? await prisma.karobariCandidate.findMany({
            where: { id: { in: karobariCandidateIds } },
            include: {
              user: { select: { name: true } },
              zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
            }
          })
        : [];
      const karobariResults = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>();
      karobariVoteCounts.forEach(vc => {
        if (!vc.karobariCandidateId) return;
        const candidate = karobariCandidates.find(c => c.id === vc.karobariCandidateId);
        if (!candidate?.zone) return;
        const zoneId = candidate.zoneId;
        const name = candidate.user?.name || candidate.name || 'Unknown';
        const votes = vc._count.id;
        if (!karobariResults.has(zoneId)) {
          karobariResults.set(zoneId, { zone: candidate.zone, candidates: new Map() });
        }
        karobariResults.get(zoneId)!.candidates.set(candidate.id, { id: candidate.id, name, votes });
      });

      // Trustee: Vote table groupBy for main/merged display (same as export)
      const trusteeVoteCounts = await prisma.vote.groupBy({
        by: ['trusteeCandidateId'],
        where: { trusteeCandidateId: { not: null } },
        _count: { id: true }
      });
      const trusteeCandidateIds = trusteeVoteCounts.map(v => v.trusteeCandidateId!).filter(Boolean);
      const trusteeCandidates = trusteeCandidateIds.length > 0
        ? await prisma.trusteeCandidate.findMany({
            where: { id: { in: trusteeCandidateIds } },
            include: {
              user: { select: { name: true } },
              zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
            }
          })
        : [];
      const trusteeResultsFromVote = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>();
      trusteeVoteCounts.forEach(vc => {
        if (!vc.trusteeCandidateId) return;
        const candidate = trusteeCandidates.find(c => c.id === vc.trusteeCandidateId);
        if (!candidate?.zone) return;
        const zoneId = candidate.zoneId;
        const name = candidate.user?.name || candidate.name || 'Unknown';
        const votes = vc._count.id;
        if (!trusteeResultsFromVote.has(zoneId)) {
          trusteeResultsFromVote.set(zoneId, { zone: candidate.zone, candidates: new Map() });
        }
        trusteeResultsFromVote.get(zoneId)!.candidates.set(candidate.id, { id: candidate.id, name, votes });
      });

      // Trustee offline-only view (from OfflineVote table, for "Offline" tab)
      const trusteeElection = await prisma.election.findFirst({
        where: { type: 'TRUSTEES', status: 'ACTIVE' }
      });
      const offlineTrusteeVotes = trusteeElection
        ? await prisma.offlineVote.findMany({
            where: {
              electionId: trusteeElection.id,
              trusteeCandidateId: { not: null }
            },
            include: {
              trusteeCandidate: {
                include: {
                  user: { select: { name: true } },
                  zone: { select: { id: true, name: true, nameGujarati: true, code: true, seats: true } }
                }
              }
            }
          })
        : [];
      const trusteeResultsOffline = new Map<string, { zone: any; candidates: Map<string, { id: string; name: string; votes: number }> }>();
      offlineTrusteeVotes.forEach(vote => {
        if (!vote.trusteeCandidate?.zone) return;
        const zoneId = vote.trusteeCandidate.zoneId;
        const candidateId = vote.trusteeCandidateId!;
        const name = vote.trusteeCandidate.user?.name || vote.trusteeCandidate.name || 'Unknown';
        const zone = vote.trusteeCandidate.zone;
        if (!trusteeResultsOffline.has(zoneId)) {
          trusteeResultsOffline.set(zoneId, { zone, candidates: new Map() });
        }
        const cand = trusteeResultsOffline.get(zoneId)!.candidates.get(candidateId);
        if (cand) cand.votes++;
        else trusteeResultsOffline.get(zoneId)!.candidates.set(candidateId, { id: candidateId, name, votes: 1 });
      });

      // UI matches export: zones and zonesMerged = Vote table (same data); zonesOffline = OfflineVote only
      const response = {
        yuvaPankh: {
          name: 'Yuva Pankh Samiti',
          zones: formatResults(yuvaPankhResults)
        },
        karobari: {
          name: 'Karobari Samiti',
          zones: formatResults(karobariResults)
        },
        trustee: {
          name: 'Trust Mandal',
          zones: formatResults(trusteeResultsFromVote),
          zonesOffline: formatResults(trusteeResultsOffline),
          zonesMerged: formatResults(trusteeResultsFromVote)
        },
        timestamp: new Date().toISOString()
      };

    console.log('Election results processed:', {
      yuvaPankhZones: response.yuvaPankh.zones.length,
      karobariZones: response.karobari.zones.length,
      trusteeZones: response.trustee.zones.length
    });

    // Cache the response for 5 minutes
    cache.set(cacheKey, response, CacheTTL.MEDIUM)

    const apiResponse = NextResponse.json(response);
    
    // Allow some caching for better performance
    apiResponse.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
    apiResponse.headers.set('Vary', 'Accept-Encoding');
    
    return apiResponse;

    } catch (error) {
      console.error('Error fetching election results:', error);
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  })
}
