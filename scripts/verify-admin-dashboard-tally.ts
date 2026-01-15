/**
 * Verify admin dashboard tally matches actual vote counts
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

async function verifyAdminDashboardTally() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('ADMIN DASHBOARD TALLY VERIFICATION')
    console.log('='.repeat(80))
    
    // Get Kutch and Anya Gujarat zones
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
    
    // Total votes (excluding test voters) - matches admin dashboard
    const totalVotes = await prisma.vote.count({
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
    
    // Yuva Pankh votes (excluding test voters)
    const yuvaPankhVotes = await prisma.vote.count({
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
      }
    })
    
    // Kutch zone votes (excluding test voters)
    const kutchVotes = await prisma.vote.count({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: kutchZone.id
        },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }
    })
    
    // Anya Gujarat zone votes (excluding test voters)
    const anyaGujaratVotes = await prisma.vote.count({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: anyaGujaratZone.id
        },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      }
    })
    
    // Get unique voters who voted (excluding test voters)
    const uniqueVotersWhoVoted = await prisma.vote.findMany({
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
      select: {
        voterId: true
      },
      distinct: ['voterId']
    })
    
    // Get vote counts per candidate
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
    
    // Get candidate details
    const candidateIds = candidateVoteCounts.map(c => c.yuvaPankhCandidateId).filter(Boolean) as string[]
    const candidates = await prisma.yuvaPankhCandidate.findMany({
      where: {
        id: {
          in: candidateIds
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        zone: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
    
    // Create vote count map
    const voteCountMap = new Map<string, number>()
    candidateVoteCounts.forEach(vc => {
      if (vc.yuvaPankhCandidateId) {
        voteCountMap.set(vc.yuvaPankhCandidateId, vc._count.id)
      }
    })
    
    // Total voters (excluding test voters) - matches admin dashboard
    const totalVoters = await prisma.voter.count({
      where: excludeTestVoters()
    })
    
    // Kutch zone voters (excluding test voters)
    const kutchVoters = await prisma.voter.count({
      where: excludeTestVoters({
        yuvaPankZoneId: kutchZone.id
      })
    })
    
    // Anya Gujarat zone voters (excluding test voters)
    const anyaGujaratVoters = await prisma.voter.count({
      where: excludeTestVoters({
        yuvaPankZoneId: anyaGujaratZone.id
      })
    })
    
    // Voters who voted (hasVoted flag)
    const votersWithHasVotedFlag = await prisma.voter.count({
      where: excludeTestVoters({
        hasVoted: true
      })
    })
    
    console.log(`\n📊 OVERALL STATISTICS (matches admin dashboard):`)
    console.log('─'.repeat(80))
    console.log(`   Total Voters (excluding test): ${totalVoters}`)
    console.log(`   Total Votes (excluding test): ${totalVotes}`)
    console.log(`   Voters with hasVoted=true: ${votersWithHasVotedFlag}`)
    console.log(`   Unique Voters Who Voted: ${uniqueVotersWhoVoted.length}`)
    
    console.log(`\n📊 YUVA PANKH VOTE STATISTICS:`)
    console.log('─'.repeat(80))
    console.log(`   Total Yuva Pankh Votes: ${yuvaPankhVotes}`)
    console.log(`   Kutch Zone Votes: ${kutchVotes}`)
    console.log(`   Anya Gujarat Zone Votes: ${anyaGujaratVotes}`)
    
    console.log(`\n📊 ZONE VOTER COUNTS:`)
    console.log('─'.repeat(80))
    console.log(`   Kutch Zone Voters: ${kutchVoters}`)
    console.log(`   Anya Gujarat Zone Voters: ${anyaGujaratVoters}`)
    
    console.log(`\n📊 CANDIDATE VOTE COUNTS:`)
    console.log('─'.repeat(80))
    if (candidates.length === 0) {
      console.log('   No candidates found')
    } else {
      candidates.forEach(candidate => {
        const voteCount = voteCountMap.get(candidate.id) || 0
        const candidateName = candidate.user?.name || candidate.name || 'Unknown'
        const zoneCode = candidate.zone?.code || 'N/A'
        console.log(`   ${candidateName} (${zoneCode}): ${voteCount} vote(s)`)
      })
    }
    
    // Verify consistency
    console.log(`\n` + '='.repeat(80))
    console.log('VERIFICATION RESULTS')
    console.log('='.repeat(80))
    
    const voteCountMatch = yuvaPankhVotes === (kutchVotes + anyaGujaratVotes)
    const voterCountMatch = totalVoters >= (kutchVoters + anyaGujaratVoters)
    
    console.log(`✅ Total Votes Consistency: ${voteCountMatch ? 'MATCH' : 'MISMATCH'}`)
    if (!voteCountMatch) {
      console.log(`   ⚠️  Yuva Pankh votes (${yuvaPankhVotes}) != Kutch (${kutchVotes}) + Anya Gujarat (${anyaGujaratVotes})`)
    }
    
    console.log(`✅ Voter Count Consistency: ${voterCountMatch ? 'MATCH' : 'MISMATCH'}`)
    if (!voterCountMatch) {
      console.log(`   ⚠️  Total voters (${totalVoters}) < Kutch (${kutchVoters}) + Anya Gujarat (${anyaGujaratVoters})`)
    }
    
    console.log(`\n📊 ADMIN DASHBOARD EXPECTED VALUES:`)
    console.log('─'.repeat(80))
    console.log(`   totalVoters: ${totalVoters}`)
    console.log(`   totalVotes: ${totalVotes}`)
    console.log(`   yuvaPankhVotes: ${yuvaPankhVotes}`)
    console.log(`   kutchVotes: ${kutchVotes}`)
    console.log(`   anyaGujaratVotes: ${anyaGujaratVotes}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminDashboardTally()

