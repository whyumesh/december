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

      // Get all votes with candidate and zone information (exclude test voters)
      const votes = await prisma.vote.findMany({
      where: {
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      include: {
        yuvaPankhCandidate: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            }
          }
        },
        karobariCandidate: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            }
          }
        },
        trusteeCandidate: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            }
          }
        }
      }
    });

    // Process Yuva Pankh results
    const yuvaPankhVotes = votes.filter(vote => vote.yuvaPankhCandidateId !== null);
    const yuvaPankhResults = new Map();
    
    yuvaPankhVotes.forEach(vote => {
      if (vote.yuvaPankhCandidate && vote.yuvaPankhCandidate.zone) {
        const zoneId = vote.yuvaPankhCandidate.zoneId;
        const candidateId = vote.yuvaPankhCandidateId;
        const candidateName = vote.yuvaPankhCandidate.user?.name || vote.yuvaPankhCandidate.name || 'Unknown';
        const zone = vote.yuvaPankhCandidate.zone;
        
        if (!yuvaPankhResults.has(zoneId)) {
          yuvaPankhResults.set(zoneId, {
            zone: zone,
            candidates: new Map()
          });
        }
        
        const zoneData = yuvaPankhResults.get(zoneId);
        if (!zoneData.candidates.has(candidateId)) {
          zoneData.candidates.set(candidateId, {
            id: candidateId,
            name: candidateName,
            votes: 0
          });
        }
        zoneData.candidates.get(candidateId).votes++;
      }
    });

    // Process Karobari results
    const karobariVotes = votes.filter(vote => vote.karobariCandidateId !== null);
    const karobariResults = new Map();
    
    karobariVotes.forEach(vote => {
      if (vote.karobariCandidate && vote.karobariCandidate.zone) {
        const zoneId = vote.karobariCandidate.zoneId;
        const candidateId = vote.karobariCandidateId;
        const candidateName = vote.karobariCandidate.user?.name || vote.karobariCandidate.name || 'Unknown';
        const zone = vote.karobariCandidate.zone;
        
        if (!karobariResults.has(zoneId)) {
          karobariResults.set(zoneId, {
            zone: zone,
            candidates: new Map()
          });
        }
        
        const zoneData = karobariResults.get(zoneId);
        if (!zoneData.candidates.has(candidateId)) {
          zoneData.candidates.set(candidateId, {
            id: candidateId,
            name: candidateName,
            votes: 0
          });
        }
        zoneData.candidates.get(candidateId).votes++;
      }
    });

    // Process Trustee results - separate online and offline
    const trusteeVotes = votes.filter(vote => vote.trusteeCandidateId !== null);
    const trusteeResults = new Map();
    const trusteeResultsOffline = new Map();
    
    // Get offline votes for trustee election
    const trusteeElection = await prisma.election.findFirst({
      where: { type: 'TRUSTEES', status: 'ACTIVE' }
    })
    
    const offlineTrusteeVotes = trusteeElection ? await prisma.offlineVote.findMany({
      where: {
        electionId: trusteeElection.id,
        trusteeCandidateId: { not: null }
      },
      include: {
        trusteeCandidate: {
          include: {
            user: {
              select: { name: true }
            },
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            }
          }
        }
      }
    }) : []
    
    // Process online votes
    trusteeVotes.forEach(vote => {
      if (vote.trusteeCandidate && vote.trusteeCandidate.zone) {
        const zoneId = vote.trusteeCandidate.zoneId;
        const candidateId = vote.trusteeCandidateId;
        const candidateName = vote.trusteeCandidate.user?.name || vote.trusteeCandidate.name || 'Unknown';
        const zone = vote.trusteeCandidate.zone;
        
        if (!trusteeResults.has(zoneId)) {
          trusteeResults.set(zoneId, {
            zone: zone,
            candidates: new Map()
          });
        }
        
        const zoneData = trusteeResults.get(zoneId);
        if (!zoneData.candidates.has(candidateId)) {
          zoneData.candidates.set(candidateId, {
            id: candidateId,
            name: candidateName,
            votes: 0
          });
        }
        zoneData.candidates.get(candidateId).votes++;
      }
    });
    
    // Process offline votes
    offlineTrusteeVotes.forEach(vote => {
      if (vote.trusteeCandidate && vote.trusteeCandidate.zone) {
        const zoneId = vote.trusteeCandidate.zoneId;
        const candidateId = vote.trusteeCandidateId;
        const candidateName = vote.trusteeCandidate.user?.name || vote.trusteeCandidate.name || 'Unknown';
        const zone = vote.trusteeCandidate.zone;
        
        if (!trusteeResultsOffline.has(zoneId)) {
          trusteeResultsOffline.set(zoneId, {
            zone: zone,
            candidates: new Map()
          });
        }
        
        const zoneData = trusteeResultsOffline.get(zoneId);
        if (!zoneData.candidates.has(candidateId)) {
          zoneData.candidates.set(candidateId, {
            id: candidateId,
            name: candidateName,
            votes: 0
          });
        }
        zoneData.candidates.get(candidateId).votes++;
      }
    });

    // Convert Maps to arrays and sort by votes
    const formatResults = (resultsMap: Map<string, any>) => {
      return Array.from(resultsMap.entries()).map(([zoneId, zoneData]) => ({
        zoneId,
        zone: zoneData.zone,
        candidates: Array.from(zoneData.candidates.values())
          .sort((a: any, b: any) => b.votes - a.votes)
      }));
    };

    // Merge online and offline results for trustee
    const trusteeMergedResults = new Map()
    const allTrusteeZones = new Set([
      ...Array.from(trusteeResults.keys()),
      ...Array.from(trusteeResultsOffline.keys())
    ])
    
    allTrusteeZones.forEach(zoneId => {
      const onlineZone = trusteeResults.get(zoneId)
      const offlineZone = trusteeResultsOffline.get(zoneId)
      const zone = onlineZone?.zone || offlineZone?.zone
      
      if (!zone) return
      
      trusteeMergedResults.set(zoneId, {
        zone: zone,
        candidates: new Map()
      })
      
      const mergedZone = trusteeMergedResults.get(zoneId)
      
      // Add online votes
      if (onlineZone) {
        onlineZone.candidates.forEach((candidate: any, candidateId: string) => {
          if (!mergedZone.candidates.has(candidateId)) {
            mergedZone.candidates.set(candidateId, {
              id: candidateId,
              name: candidate.name,
              votes: 0,
              onlineVotes: 0,
              offlineVotes: 0
            })
          }
          mergedZone.candidates.get(candidateId).votes += candidate.votes
          mergedZone.candidates.get(candidateId).onlineVotes = candidate.votes
        })
      }
      
      // Add offline votes
      if (offlineZone) {
        offlineZone.candidates.forEach((candidate: any, candidateId: string) => {
          if (!mergedZone.candidates.has(candidateId)) {
            mergedZone.candidates.set(candidateId, {
              id: candidateId,
              name: candidate.name,
              votes: 0,
              onlineVotes: 0,
              offlineVotes: 0
            })
          }
          mergedZone.candidates.get(candidateId).votes += candidate.votes
          mergedZone.candidates.get(candidateId).offlineVotes = candidate.votes
        })
      }
    })

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
        zones: formatResults(trusteeResults),
        zonesOffline: formatResults(trusteeResultsOffline),
        zonesMerged: formatResults(trusteeMergedResults)
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
