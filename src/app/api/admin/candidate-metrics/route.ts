/**
 * API endpoint to get candidate vote counts and metrics
 * Used by admin dashboard to display voting statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { excludeTestVoters } from '@/lib/voter-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const electionType = searchParams.get('electionType') || 'all' // 'YUVA_PANK', 'KAROBARI_MEMBERS', 'TRUSTEES', or 'all'
    const zoneId = searchParams.get('zoneId') // Optional: filter by zone

    // Get vote counts per candidate (exclude test voters)
    const voteCountQueries: Promise<any>[] = []

    if (electionType === 'all' || electionType === 'YUVA_PANK') {
      const yuvaPankhWhere: any = {
        yuvaPankhCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }

      voteCountQueries.push(
        prisma.vote.groupBy({
          by: ['yuvaPankhCandidateId'],
          where: yuvaPankhWhere,
          _count: { id: true }
        })
      )
    }

    if (electionType === 'all' || electionType === 'KAROBARI_MEMBERS') {
      const karobariWhere: any = {
        karobariCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }

      voteCountQueries.push(
        prisma.vote.groupBy({
          by: ['karobariCandidateId'],
          where: karobariWhere,
          _count: { id: true }
        })
      )
    }

    if (electionType === 'all' || electionType === 'TRUSTEES') {
      const trusteeWhere: any = {
        trusteeCandidateId: { not: null },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }

      voteCountQueries.push(
        prisma.vote.groupBy({
          by: ['trusteeCandidateId'],
          where: trusteeWhere,
          _count: { id: true }
        })
      )
    }

    const voteCountResults = await Promise.all(voteCountQueries)

    // Process Yuva Pankh results
    const yuvaPankhVoteMap = new Map<string, number>()
    if (voteCountResults[0]) {
      voteCountResults[0].forEach((vc: any) => {
        if (vc.yuvaPankhCandidateId) {
          yuvaPankhVoteMap.set(vc.yuvaPankhCandidateId, vc._count.id)
        }
      })
    }

    // Process Karobari results
    const karobariVoteMap = new Map<string, number>()
    if (voteCountResults[1]) {
      voteCountResults[1].forEach((vc: any) => {
        if (vc.karobariCandidateId) {
          karobariVoteMap.set(vc.karobariCandidateId, vc._count.id)
        }
      })
    }

    // Process Trustee results
    const trusteeVoteMap = new Map<string, number>()
    if (voteCountResults[2]) {
      voteCountResults[2].forEach((vc: any) => {
        if (vc.trusteeCandidateId) {
          trusteeVoteMap.set(vc.trusteeCandidateId, vc._count.id)
        }
      })
    }

    // Fetch candidates with their details
    const candidateQueries: Promise<any>[] = []

    if (electionType === 'all' || electionType === 'YUVA_PANK') {
      const yuvaPankhWhere: any = { status: 'APPROVED' }
      if (zoneId) {
        yuvaPankhWhere.zoneId = zoneId
      }

      candidateQueries.push(
        prisma.yuvaPankhCandidate.findMany({
          where: yuvaPankhWhere,
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: [
            { zone: { code: 'asc' } },
            { name: 'asc' }
          ]
        })
      )
    }

    if (electionType === 'all' || electionType === 'KAROBARI_MEMBERS') {
      const karobariWhere: any = { status: 'APPROVED' }
      if (zoneId) {
        karobariWhere.zoneId = zoneId
      }

      candidateQueries.push(
        prisma.karobariCandidate.findMany({
          where: karobariWhere,
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: [
            { zone: { code: 'asc' } },
            { name: 'asc' }
          ]
        })
      )
    }

    if (electionType === 'all' || electionType === 'TRUSTEES') {
      const trusteeWhere: any = { status: 'APPROVED' }
      if (zoneId) {
        trusteeWhere.zoneId = zoneId
      }

      candidateQueries.push(
        prisma.trusteeCandidate.findMany({
          where: trusteeWhere,
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                nameGujarati: true,
                code: true,
                seats: true
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: [
            { zone: { code: 'asc' } },
            { name: 'asc' }
          ]
        })
      )
    }

    const candidateResults = await Promise.all(candidateQueries)

    // Format results
    const results: any = {
      yuvaPankh: [],
      karobari: [],
      trustee: []
    }

    // Process Yuva Pankh candidates
    if (candidateResults[0]) {
      results.yuvaPankh = candidateResults[0].map((candidate: any) => {
        const candidateName = candidate.user?.name || candidate.name
        const voteCount = yuvaPankhVoteMap.get(candidate.id) || 0

        return {
          id: candidate.id,
          name: candidateName,
          zone: candidate.zone ? {
            id: candidate.zone.id,
            name: candidate.zone.name,
            nameGujarati: candidate.zone.nameGujarati,
            code: candidate.zone.code,
            seats: candidate.zone.seats
          } : null,
          voteCount,
          status: candidate.status
        }
      })
    }

    // Process Karobari candidates
    if (candidateResults[1]) {
      results.karobari = candidateResults[1].map((candidate: any) => {
        const candidateName = candidate.user?.name || candidate.name
        const voteCount = karobariVoteMap.get(candidate.id) || 0

        return {
          id: candidate.id,
          name: candidateName,
          zone: candidate.zone ? {
            id: candidate.zone.id,
            name: candidate.zone.name,
            nameGujarati: candidate.zone.nameGujarati,
            code: candidate.zone.code,
            seats: candidate.zone.seats
          } : null,
          voteCount,
          status: candidate.status
        }
      })
    }

    // Process Trustee candidates
    if (candidateResults[2]) {
      results.trustee = candidateResults[2].map((candidate: any) => {
        const candidateName = candidate.user?.name || candidate.name
        const voteCount = trusteeVoteMap.get(candidate.id) || 0

        return {
          id: candidate.id,
          name: candidateName,
          zone: candidate.zone ? {
            id: candidate.zone.id,
            name: candidate.zone.name,
            nameGujarati: candidate.zone.nameGujarati,
            code: candidate.zone.code,
            seats: candidate.zone.seats
          } : null,
          voteCount,
          status: candidate.status
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching candidate metrics:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

