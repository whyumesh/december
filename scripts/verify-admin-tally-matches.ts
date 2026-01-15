/**
 * Verify vote counts match admin dashboard logic exactly
 * Admin dashboard counts votes based on voter's zone, not candidate's zone
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { excludeTestVoters } from '@/lib/voter-utils'

// Load environment variables
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        const cleanValue = value.replace(/^["']|["']$/g, '')
        if (key && cleanValue) {
          process.env[key.trim()] = cleanValue
        }
      }
    }
  }
}

loadEnvFile()

const prisma = new PrismaClient()

async function verifyAdminTallyMatches() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ADMIN DASHBOARD TALLY VERIFICATION')
    console.log('(Using same logic as admin dashboard - votes counted by voter zone)')
    console.log('='.repeat(80))
    
    // Get zones
    const kutchZone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    const anyaGujaratZone = await prisma.zone.findFirst({
      where: { code: 'ANYA_GUJARAT', electionType: 'YUVA_PANK' }
    })
    
    if (!kutchZone || !anyaGujaratZone) {
      console.log('❌ Zones not found')
      return
    }
    
    // Get all Yuva Pankh votes (excluding test voters) - same as admin dashboard
    const allYuvaPankhVotes = await prisma.vote.findMany({
      where: {
        election: {
          type: 'YUVA_PANK'
        },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      select: {
        voterId: true,
        voter: {
          select: {
            voterId: true,
            yuvaPankZoneId: true
          }
        },
        yuvaPankhCandidate: {
          select: {
            id: true,
            position: true,
            name: true,
            zoneId: true
          }
        },
        yuvaPankhNominee: {
          select: {
            id: true,
            position: true,
            name: true,
            zoneId: true
          }
        }
      }
    })
    
    // Count votes by voter's zone (same logic as admin dashboard)
    const kutchVotersSet = new Set<string>()
    const anyaGujaratVotersSet = new Set<string>()
    let kutchActualVotes = 0
    let kutchNotaVotes = 0
    let anyaGujaratActualVotes = 0
    let anyaGujaratNotaVotes = 0
    
    allYuvaPankhVotes.forEach(vote => {
      const voterZoneId = vote.voter?.yuvaPankZoneId
      const candidate = vote.yuvaPankhCandidate || vote.yuvaPankhNominee
      const isNota = candidate?.position === 'NOTA' || candidate?.name?.startsWith('NOTA')
      
      if (voterZoneId === kutchZone.id) {
        kutchVotersSet.add(vote.voterId)
        if (isNota) {
          kutchNotaVotes++
        } else {
          kutchActualVotes++
        }
      } else if (voterZoneId === anyaGujaratZone.id) {
        anyaGujaratVotersSet.add(vote.voterId)
        if (isNota) {
          anyaGujaratNotaVotes++
        } else {
          anyaGujaratActualVotes++
        }
      }
    })
    
    const kutchUniqueVoters = kutchVotersSet.size
    const kutchTotalVotes = kutchActualVotes + kutchNotaVotes
    const anyaGujaratUniqueVoters = anyaGujaratVotersSet.size
    const anyaGujaratTotalVotes = anyaGujaratActualVotes + anyaGujaratNotaVotes
    
    // Get voter counts (excluding test voters)
    const kutchVoterCount = await prisma.voter.count({
      where: excludeTestVoters({
        yuvaPankZoneId: kutchZone.id
      })
    })
    
    const anyaGujaratVoterCount = await prisma.voter.count({
      where: excludeTestVoters({
        yuvaPankZoneId: anyaGujaratZone.id
      })
    })
    
    // Calculate turnout percentages
    const kutchTurnout = kutchVoterCount > 0 ? ((kutchUniqueVoters / kutchVoterCount) * 100) : 0
    const anyaGujaratTurnout = anyaGujaratVoterCount > 0 ? ((anyaGujaratUniqueVoters / anyaGujaratVoterCount) * 100) : 0
    
    console.log(`\n📊 KUTCH ZONE (matches admin dashboard):`)
    console.log('─'.repeat(80))
    console.log(`   Total Voters: ${kutchVoterCount}`)
    console.log(`   Unique Voters Who Voted: ${kutchUniqueVoters}`)
    console.log(`   Total Votes: ${kutchTotalVotes}`)
    console.log(`   - Actual Votes: ${kutchActualVotes}`)
    console.log(`   - NOTA Votes: ${kutchNotaVotes}`)
    console.log(`   Turnout: ${kutchTurnout.toFixed(2)}%`)
    
    console.log(`\n📊 ANYA GUJARAT ZONE (matches admin dashboard):`)
    console.log('─'.repeat(80))
    console.log(`   Total Voters: ${anyaGujaratVoterCount}`)
    console.log(`   Unique Voters Who Voted: ${anyaGujaratUniqueVoters}`)
    console.log(`   Total Votes: ${anyaGujaratTotalVotes}`)
    console.log(`   - Actual Votes: ${anyaGujaratActualVotes}`)
    console.log(`   - NOTA Votes: ${anyaGujaratNotaVotes}`)
    console.log(`   Turnout: ${anyaGujaratTurnout.toFixed(2)}%`)
    
    // Get candidate vote counts (for Kutch zone candidates)
    const kutchCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: kutchZone.id,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    const anyaGujaratCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        zoneId: anyaGujaratZone.id,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    // Count votes per candidate (excluding test voters)
    const candidateVoteCounts = await prisma.vote.groupBy({
      by: ['yuvaPankhCandidateId'],
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
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
    
    const voteCountMap = new Map<string, number>()
    candidateVoteCounts.forEach(vc => {
      if (vc.yuvaPankhCandidateId) {
        voteCountMap.set(vc.yuvaPankhCandidateId, vc._count.id)
      }
    })
    
    console.log(`\n📊 KUTCH ZONE CANDIDATES:`)
    console.log('─'.repeat(80))
    if (kutchCandidates.length === 0) {
      console.log('   No approved candidates')
    } else {
      kutchCandidates.forEach(candidate => {
        const voteCount = voteCountMap.get(candidate.id) || 0
        const candidateName = candidate.user?.name || candidate.name || 'Unknown'
        console.log(`   ${candidateName}: ${voteCount} vote(s)`)
      })
    }
    
    console.log(`\n📊 ANYA GUJARAT ZONE CANDIDATES:`)
    console.log('─'.repeat(80))
    if (anyaGujaratCandidates.length === 0) {
      console.log('   No approved candidates')
    } else {
      anyaGujaratCandidates.forEach(candidate => {
        const voteCount = voteCountMap.get(candidate.id) || 0
        const candidateName = candidate.user?.name || candidate.name || 'Unknown'
        console.log(`   ${candidateName}: ${voteCount} vote(s)`)
      })
    }
    
    console.log(`\n` + '='.repeat(80))
    console.log('SUMMARY (matches admin dashboard logic)')
    console.log('='.repeat(80))
    console.log(`✅ Kutch Zone:`)
    console.log(`   Voters: ${kutchVoterCount}`)
    console.log(`   Voted: ${kutchUniqueVoters}`)
    console.log(`   Votes: ${kutchTotalVotes} (${kutchActualVotes} actual + ${kutchNotaVotes} NOTA)`)
    console.log(`   Turnout: ${kutchTurnout.toFixed(2)}%`)
    console.log(`\n✅ Anya Gujarat Zone:`)
    console.log(`   Voters: ${anyaGujaratVoterCount}`)
    console.log(`   Voted: ${anyaGujaratUniqueVoters}`)
    console.log(`   Votes: ${anyaGujaratTotalVotes} (${anyaGujaratActualVotes} actual + ${anyaGujaratNotaVotes} NOTA)`)
    console.log(`   Turnout: ${anyaGujaratTurnout.toFixed(2)}%`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminTallyMatches()

