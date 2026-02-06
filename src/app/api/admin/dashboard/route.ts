import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { excludeTestVoters } from '@/lib/voter-utils'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  // Gracefully handle missing database URL (e.g., during build)
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not available, returning empty dashboard data')
    return NextResponse.json({
      stats: {
        yuvaPankh: { total: 0, pending: 0, approved: 0, rejected: 0 },
        karobari: { total: 0, pending: 0, approved: 0, rejected: 0 },
        trustMandal: { total: 0, pending: 0, approved: 0, rejected: 0 },
        totalVoters: 0,
        totalVotes: 0,
        voterStats: {
          total: 0,
          active: 0,
          inactive: 0,
          voted: 0,
          notVoted: 0,
          votePercentage: '0.00',
          gender: { male: 0, female: 0, other: 0 },
          ageDistribution: {},
          trusteeEligible: 0,
          dataQuality: { withDob: 0, withoutDob: 0, dobPercentage: '0.00' },
          zoneAssignments: { yuvaPankh: 0, trustee: 0, unassigned: 0 },
          regionDistribution: [],
          yuvaPankZoneDistribution: [],
          trusteeZoneDistribution: []
        }
      },
      recentCandidates: [],
      timestamp: new Date().toISOString()
    })
  }

  try {
    console.log('Admin dashboard API called');

    // Check cache first (disabled for debugging)
    const cacheKey = CacheKeys.adminDashboard
    const cached = cache.get(cacheKey)
    if (cached && false) { // Temporarily disabled caching
      console.log('Returning cached admin dashboard data')
      return NextResponse.json(cached)
    }

    // Get dashboard statistics in smaller batches to avoid connection limits (exclude test voters)
    const [totalVoters, totalVotes] = await Promise.all([
      prisma.voter.count({ where: excludeTestVoters() }),
      prisma.vote.count({
        where: {
          voter: {
            voterId: {
              not: {
                startsWith: 'TEST_'
              }
            }
          }
        }
      })
    ])

    // Get comprehensive voter statistics (exclude test voters)
    const [
      activeVoters,
      inactiveVoters,
      votedVoters,
      notVotedVoters,
      maleVoters,
      femaleVoters,
      votersWithDob,
      votersWithoutDob,
      votersWithYuvaPankZone,
      votersWithTrusteeZone,
      votersWithoutZone
    ] = await Promise.all([
      prisma.voter.count({ where: excludeTestVoters({ isActive: true }) }),
      prisma.voter.count({ where: excludeTestVoters({ isActive: false }) }),
      prisma.voter.count({ where: excludeTestVoters({ hasVoted: true }) }),
      prisma.voter.count({ where: excludeTestVoters({ hasVoted: false }) }),
      prisma.voter.count({ where: excludeTestVoters({ gender: 'M' }) }),
      prisma.voter.count({ where: excludeTestVoters({ gender: 'F' }) }),
      prisma.voter.count({ where: excludeTestVoters({ OR: [{ dob: { not: null } }, { user: { dateOfBirth: { not: null } } }] }) }),
      prisma.voter.count({ where: excludeTestVoters({ AND: [{ dob: null }, { user: { dateOfBirth: null } }] }) }),
      prisma.voter.count({ where: excludeTestVoters({ yuvaPankZoneId: { not: null } }) }),
      prisma.voter.count({ where: excludeTestVoters({ trusteeZoneId: { not: null } }) }),
      prisma.voter.count({ where: excludeTestVoters({ AND: [{ yuvaPankZoneId: null }, { trusteeZoneId: null }] }) })
    ])

    // Get all voters for detailed analysis (exclude test voters)
    const allVoters = await prisma.voter.findMany({
      where: excludeTestVoters(),
      select: {
        id: true,
        age: true,
        gender: true,
        dob: true,
        region: true,
        isActive: true,
        hasVoted: true,
        yuvaPankZoneId: true,
        trusteeZoneId: true,
        user: {
          select: {
            dateOfBirth: true
          }
        }
      }
    })

    // Helper function to calculate age as of a specific date
    const calculateAgeAsOf = (dob: Date | string | null | undefined, referenceDate: Date): number | null => {
      if (!dob) return null
      
      try {
        let birthDate: Date
        
        if (dob instanceof Date) {
          birthDate = new Date(dob)
          if (isNaN(birthDate.getTime())) return null
        } else if (typeof dob === 'string') {
          const parts = dob.split('/')
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10)
            const month = parseInt(parts[1], 10) - 1
            const year = parseInt(parts[2], 10)
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day > 0 && day <= 31 && month >= 0 && month <= 11) {
              birthDate = new Date(year, month, day)
              if (birthDate.getDate() !== day || birthDate.getMonth() !== month || birthDate.getFullYear() !== year) {
                return null
              }
            } else {
              return null
            }
          } else if (dob.includes('-')) {
            birthDate = new Date(dob)
            if (isNaN(birthDate.getTime())) return null
          } else {
            return null
          }
        } else {
          return null
        }
        
        if (birthDate > referenceDate) return null
        
        let age = referenceDate.getFullYear() - birthDate.getFullYear()
        const monthDiff = referenceDate.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
          age--
        }
        
        return age
      } catch {
        return null
      }
    }

    // Calculate age distribution
    const eligibilityCutoffDate = new Date('2025-08-31T23:59:59')
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0,
      'unknown': 0
    }
    let trusteeEligible = 0 // 45+ as of Aug 31, 2025

    allVoters.forEach(voter => {
      let age: number | null = null
      
      // Try to get age from DOB
      if (voter.user?.dateOfBirth) {
        age = calculateAgeAsOf(voter.user.dateOfBirth, eligibilityCutoffDate)
      } else if (voter.dob) {
        age = calculateAgeAsOf(voter.dob, eligibilityCutoffDate)
      } else if (voter.age !== null && voter.age !== undefined) {
        // Use stored age as fallback
        const today = new Date()
        const cutoffDate = new Date('2025-08-31')
        const monthsDiff = (cutoffDate.getFullYear() - today.getFullYear()) * 12 + 
                          (cutoffDate.getMonth() - today.getMonth())
        
        if (voter.age >= 45) {
          age = voter.age
        } else if (voter.age === 44 && monthsDiff > 12) {
          age = 45
        } else {
          age = voter.age
        }
      }

      if (age === null) {
        ageGroups.unknown++
      } else {
        if (age >= 65) ageGroups['65+']++
        else if (age >= 56) ageGroups['56-65']++
        else if (age >= 46) ageGroups['46-55']++
        else if (age >= 36) ageGroups['36-45']++
        else if (age >= 26) ageGroups['26-35']++
        else if (age >= 18) ageGroups['18-25']++
        else ageGroups.unknown++

        // Check trustee eligibility (45+ as of Aug 31, 2025)
        if (age >= 45) {
          trusteeEligible++
        }
      }
    })

    // Get region distribution
    const regionStats = await prisma.voter.groupBy({
      by: ['region'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get zone distributions
    const yuvaPankZoneStats = await prisma.voter.groupBy({
      by: ['yuvaPankZoneId'],
      _count: {
        id: true
      },
      where: {
        yuvaPankZoneId: { not: null }
      }
    })

    const trusteeZoneStats = await prisma.voter.groupBy({
      by: ['trusteeZoneId'],
      _count: {
        id: true
      },
      where: {
        trusteeZoneId: { not: null }
      }
    })

    // Get zone names for better display
    const yuvaPankZones = await prisma.zone.findMany({
      where: { electionType: 'YUVA_PANK' },
      select: { id: true, name: true, nameGujarati: true, code: true }
    })

    const trusteeZones = await prisma.zone.findMany({
      where: { electionType: 'TRUSTEES' },
      select: { id: true, name: true, nameGujarati: true, code: true }
    })

    const yuvaPankZoneDistribution = yuvaPankZoneStats.map(stat => {
      const zone = yuvaPankZones.find(z => z.id === stat.yuvaPankZoneId)
      return {
        zoneId: stat.yuvaPankZoneId,
        zoneName: zone?.name || 'Unknown',
        zoneNameGujarati: zone?.nameGujarati || 'Unknown',
        zoneCode: zone?.code || '',
        count: stat._count.id
      }
    }).sort((a, b) => b.count - a.count)

    const trusteeZoneDistribution = trusteeZoneStats.map(stat => {
      const zone = trusteeZones.find(z => z.id === stat.trusteeZoneId)
      return {
        zoneId: stat.trusteeZoneId,
        zoneName: zone?.name || 'Unknown',
        zoneNameGujarati: zone?.nameGujarati || 'Unknown',
        zoneCode: zone?.code || '',
        count: stat._count.id
      }
    }).sort((a, b) => b.count - a.count)

    const regionDistribution = regionStats.map(stat => ({
      region: stat.region || 'Unknown',
      count: stat._count.id
    }))

    // Get offline vote statistics for trustee election
    const trusteeElection = await prisma.election.findFirst({
      where: { type: 'TRUSTEES', status: 'ACTIVE' }
    })
    
    let offlineVoteStats: [number, number, number] = [0, 0, 0]
    let offlineVotesByZone: Array<{ zoneId: string; zoneName: string; count: number }> = []

    if (trusteeElection) {
      offlineVoteStats = await Promise.all([
        prisma.offlineVote.count({
          where: { electionId: trusteeElection.id }
        }),
        prisma.offlineVote.count({
          where: { electionId: trusteeElection.id, isMerged: true }
        }),
        prisma.offlineVote.count({
          where: { electionId: trusteeElection.id, isMerged: false }
        })
      ]) as [number, number, number]

      const offlineVotesForZones = await prisma.offlineVote.findMany({
        where: { electionId: trusteeElection.id },
        select: {
          trusteeCandidateId: true,
          trusteeCandidate: {
            select: {
              zoneId: true,
              zone: { select: { id: true, name: true } }
            }
          }
        }
      })
      const zoneCountMap = new Map<string, { name: string; count: number }>()
      let notaCount = 0
      for (const v of offlineVotesForZones) {
        if (!v.trusteeCandidate?.zoneId) {
          notaCount++
          continue
        }
        const z = v.trusteeCandidate.zone
        if (!z) {
          notaCount++
          continue
        }
        const key = z.id
        if (!zoneCountMap.has(key)) {
          zoneCountMap.set(key, { name: z.name, count: 0 })
        }
        zoneCountMap.get(key)!.count++
      }
      offlineVotesByZone = Array.from(zoneCountMap.entries()).map(([zoneId, { name, count }]) => ({
        zoneId,
        zoneName: name,
        count
      })).sort((a, b) => b.count - a.count)
      if (notaCount > 0) {
        offlineVotesByZone.push({ zoneId: '_nota', zoneName: 'NOTA (no candidate selected)', count: notaCount })
      }
    }

    const [totalYuvaPankhCandidates, totalYuvaPankhNominees, totalKarobariCandidates, totalTrusteeCandidates] = await Promise.all([
      prisma.yuvaPankhCandidate.count(),
      prisma.yuvaPankhNominee.count(),
      prisma.karobariCandidate.count(),
      prisma.trusteeCandidate.count()
    ])

    const [pendingYuvaPankhCandidates, approvedYuvaPankhCandidates, rejectedYuvaPankhCandidates] = await Promise.all([
      prisma.yuvaPankhCandidate.count({ where: { status: 'PENDING' } }),
      prisma.yuvaPankhCandidate.count({ where: { status: 'APPROVED' } }),
      prisma.yuvaPankhCandidate.count({ where: { status: 'REJECTED' } })
    ])

    // Get vote counts per candidate (exclude test voters)
    const yuvaPankhVoteCounts = await prisma.vote.groupBy({
      by: ['yuvaPankhCandidateId'],
      where: {
        yuvaPankhCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      _count: {
        id: true
      }
    })

    const karobariVoteCounts = await prisma.vote.groupBy({
      by: ['karobariCandidateId'],
      where: {
        karobariCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      _count: {
        id: true
      }
    })

    const trusteeVoteCounts = await prisma.vote.groupBy({
      by: ['trusteeCandidateId'],
      where: {
        trusteeCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      _count: {
        id: true
      }
    })

    // Create vote count maps
    const yuvaPankhVoteMap = new Map<string, number>()
    yuvaPankhVoteCounts.forEach(vc => {
      if (vc.yuvaPankhCandidateId) {
        yuvaPankhVoteMap.set(vc.yuvaPankhCandidateId, vc._count.id)
      }
    })

    const karobariVoteMap = new Map<string, number>()
    karobariVoteCounts.forEach(vc => {
      if (vc.karobariCandidateId) {
        karobariVoteMap.set(vc.karobariCandidateId, vc._count.id)
      }
    })

    const trusteeVoteMap = new Map<string, number>()
    trusteeVoteCounts.forEach(vc => {
      if (vc.trusteeCandidateId) {
        trusteeVoteMap.set(vc.trusteeCandidateId, vc._count.id)
      }
    })

    const [pendingYuvaPankhNominees, approvedYuvaPankhNominees, rejectedYuvaPankhNominees] = await Promise.all([
      prisma.yuvaPankhNominee.count({ where: { status: 'PENDING' } }),
      prisma.yuvaPankhNominee.count({ where: { status: 'APPROVED' } }),
      prisma.yuvaPankhNominee.count({ where: { status: 'REJECTED' } })
    ])

    const [pendingKarobariCandidates, approvedKarobariCandidates, rejectedKarobariCandidates] = await Promise.all([
      prisma.karobariCandidate.count({ where: { status: 'PENDING' } }),
      prisma.karobariCandidate.count({ where: { status: 'APPROVED' } }),
      prisma.karobariCandidate.count({ where: { status: 'REJECTED' } })
    ])

    const [pendingTrusteeCandidates, approvedTrusteeCandidates, rejectedTrusteeCandidates] = await Promise.all([
      prisma.trusteeCandidate.count({ where: { status: 'PENDING' } }),
      prisma.trusteeCandidate.count({ where: { status: 'APPROVED' } }),
      prisma.trusteeCandidate.count({ where: { status: 'REJECTED' } })
    ])

    // Calculate committee-specific stats
    const yuvaPankhStats = {
      total: totalYuvaPankhCandidates + totalYuvaPankhNominees,
      pending: pendingYuvaPankhCandidates + pendingYuvaPankhNominees,
      approved: approvedYuvaPankhCandidates + approvedYuvaPankhNominees,
      rejected: rejectedYuvaPankhCandidates + rejectedYuvaPankhNominees
    }

    const karobariStats = {
      total: totalKarobariCandidates,
      pending: pendingKarobariCandidates,
      approved: approvedKarobariCandidates,
      rejected: rejectedKarobariCandidates
    }

    const trustMandalStats = {
      total: totalTrusteeCandidates,
      pending: pendingTrusteeCandidates,
      approved: approvedTrusteeCandidates,
      rejected: rejectedTrusteeCandidates
    }

    console.log('Stats calculated:', {
      yuvaPankhStats,
      karobariStats,
      trustMandalStats,
      totalVoters,
      totalVotes
    });

    // Get recent candidates from all candidate tables in smaller batches
    const recentYuvaPankhCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        position: { not: 'NOTA' } // Exclude NOTA candidates
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        zone: {
          select: {
            name: true,
            nameGujarati: true,
            seats: true,
            code: true
          }
        }
      }
    })

    const recentYuvaPankhNominees = await prisma.yuvaPankhNominee.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        zone: {
          select: {
            name: true,
            nameGujarati: true,
            seats: true,
            code: true
          }
        }
      }
    })

    const recentKarobariCandidates = await prisma.karobariCandidate.findMany({
      where: {
        position: { not: 'NOTA' } // Exclude NOTA candidates
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        zone: {
          select: {
            name: true,
            nameGujarati: true,
            seats: true,
            code: true
          }
        }
      }
    })

    const recentTrusteeCandidates = await prisma.trusteeCandidate.findMany({
      where: {
        position: { not: { startsWith: 'NOTA' } } // Exclude NOTA candidates
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        zone: {
          select: {
            name: true,
            nameGujarati: true,
            seats: true,
            code: true
          }
        }
      }
    })

    // Combine all candidates and sort by creation date
    const allCandidates = [
      ...recentYuvaPankhCandidates.map(c => ({ ...c, type: 'YUVA_PANKH_CANDIDATE', electionType: 'YUVA_PANK' })),
      ...recentYuvaPankhNominees.map(c => ({ ...c, type: 'YUVA_PANKH_NOMINEE', electionType: 'YUVA_PANK' })),
      ...recentKarobariCandidates.map(c => ({ ...c, type: 'KAROBARI_CANDIDATE', electionType: 'KAROBARI_MEMBERS' })),
      ...recentTrusteeCandidates.map(c => ({ ...c, type: 'TRUSTEE_CANDIDATE', electionType: 'TRUSTEES' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

    const recentCandidates = allCandidates

    console.log('Recent candidates found:', recentCandidates.length);

    const stats = {
      yuvaPankh: yuvaPankhStats,
      karobari: karobariStats,
      trustMandal: trustMandalStats,
      totalVoters,
      totalVotes,
      voterStats: {
        total: totalVoters,
        active: activeVoters,
        inactive: inactiveVoters,
        voted: votedVoters,
        notVoted: notVotedVoters,
        votePercentage: totalVoters > 0 ? ((votedVoters / totalVoters) * 100).toFixed(2) : '0.00',
        gender: {
          male: maleVoters,
          female: femaleVoters,
          other: totalVoters - maleVoters - femaleVoters
        },
        ageDistribution: ageGroups,
        trusteeEligible, // 45+ as of Aug 31, 2025
        dataQuality: {
          withDob: votersWithDob,
          withoutDob: votersWithoutDob,
          dobPercentage: totalVoters > 0 ? ((votersWithDob / totalVoters) * 100).toFixed(2) : '0.00'
        },
        zoneAssignments: {
          yuvaPankh: votersWithYuvaPankZone,
          trustee: votersWithTrusteeZone,
          unassigned: votersWithoutZone
        },
        regionDistribution,
        yuvaPankZoneDistribution,
        trusteeZoneDistribution
      }
    }

    const formattedCandidates = recentCandidates.map(candidate => {
      // Get vote count based on candidate type
      let voteCount = 0
      if (candidate.type === 'YUVA_PANKH_CANDIDATE' || candidate.type === 'YUVA_PANKH_NOMINEE') {
        voteCount = yuvaPankhVoteMap.get(candidate.id) || 0
      } else if (candidate.type === 'KAROBARI_CANDIDATE') {
        voteCount = karobariVoteMap.get(candidate.id) || 0
      } else if (candidate.type === 'TRUSTEE_CANDIDATE') {
        voteCount = trusteeVoteMap.get(candidate.id) || 0
      }

      return {
        id: candidate.id,
        name: ('user' in candidate && candidate.user?.name) || candidate.name || 'Unknown',
        email: ('user' in candidate && candidate.user?.email) || candidate.email || '',
        phone: ('user' in candidate && candidate.user?.phone) || candidate.phone || '',
        party: candidate.party || 'Independent',
        position: candidate.position,
        region: candidate.region || 'Unknown',
        status: candidate.status,
        experience: candidate.experience || '',
        education: candidate.education || '',
        manifesto: candidate.manifesto || '',
        rejectionReason: candidate.rejectionReason || undefined,
        submittedAt: candidate.createdAt.toISOString(),
        electionType: candidate.electionType || 'Unknown',
        candidateType: candidate.type || 'Unknown',
        voteCount, // Add vote count
        zone: candidate.zone ? {
          name: candidate.zone.name,
          nameGujarati: candidate.zone.nameGujarati,
          seats: candidate.zone.seats,
          code: candidate.zone.code
        } : null
      }
    })

    console.log('Formatted candidates:', formattedCandidates.length);

    const response = {
      stats,
      recentCandidates: formattedCandidates,
      offlineVotes: {
        total: offlineVoteStats[0],
        merged: offlineVoteStats[1],
        unmerged: offlineVoteStats[2],
        byZone: offlineVotesByZone
      },
      timestamp: new Date().toISOString()
    };

    console.log('Sending response with', formattedCandidates.length, 'candidates');

    // Cache the response for 2 minutes
    cache.set(cacheKey, response, CacheTTL.SHORT * 4) // 2 minutes

    const apiResponse = NextResponse.json(response)
    
    // Allow some caching for better performance
    apiResponse.headers.set('Cache-Control', 'public, max-age=120, s-maxage=120') // 2 minutes
    apiResponse.headers.set('Vary', 'Accept-Encoding')
    
    return apiResponse

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}