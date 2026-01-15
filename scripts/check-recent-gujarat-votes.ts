/**
 * Check recent votes in Gujarat zones (Kutch and Anya Gujarat)
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

async function checkRecentGujaratVotes() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('RECENT VOTES IN GUJARAT ZONES (KUTCH & ANYA GUJARAT)')
    console.log('='.repeat(80))
    
    // Get Gujarat zones
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
    
    // Get recent votes (last 20 votes)
    const recentVotes = await prisma.vote.findMany({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: {
            in: [kutchZone.id, anyaGujaratZone.id]
          }
        },
        voter: {
          voterId: {
            not: {
              startsWith: 'TEST_'
            }
          }
        }
      },
      include: {
        voter: {
          select: {
            voterId: true,
            name: true,
            phone: true,
            yuvaPankZone: {
              select: {
                code: true,
                name: true
              }
            }
          }
        },
        yuvaPankhCandidate: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            zone: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    })
    
    console.log(`\n📊 RECENT VOTES (Last 20 votes):`)
    console.log('─'.repeat(80))
    
    if (recentVotes.length === 0) {
      console.log('   No votes found in Gujarat zones')
    } else {
      // Group votes by voter and timestamp
      const votesByVoter = new Map<string, typeof recentVotes>()
      recentVotes.forEach(vote => {
        const key = `${vote.voterId}_${vote.timestamp.toISOString()}`
        if (!votesByVoter.has(key)) {
          votesByVoter.set(key, [])
        }
        votesByVoter.get(key)!.push(vote)
      })
      
      let count = 0
      for (const [key, votes] of Array.from(votesByVoter.entries()).slice(0, 10)) {
        count++
        const vote = votes[0]
        const voteDate = new Date(vote.timestamp)
        
        console.log(`\n   ${count}. Voter: ${vote.voter.name} (${vote.voter.voterId})`)
        console.log(`      Phone: ${vote.voter.phone || 'N/A'}`)
        console.log(`      Zone: ${vote.voter.yuvaPankZone?.name || 'N/A'} (${vote.voter.yuvaPankZone?.code || 'N/A'})`)
        console.log(`      Vote Time: ${voteDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        console.log(`      Candidates Voted (${votes.length}):`)
        
        votes.forEach((v, idx) => {
          const candidateName = v.yuvaPankhCandidate?.user?.name || v.yuvaPankhCandidate?.name || 'Unknown'
          const isNota = v.yuvaPankhCandidate?.position === 'NOTA'
          const candidateZone = v.yuvaPankhCandidate?.zone?.code || 'N/A'
          console.log(`         ${idx + 1}. ${candidateName}${isNota ? ' (NOTA)' : ''} - Zone: ${candidateZone}`)
        })
      }
    }
    
    // Get total vote counts
    const totalVotes = await prisma.vote.count({
      where: {
        yuvaPankhCandidateId: {
          not: null
        },
        yuvaPankhCandidate: {
          zoneId: {
            in: [kutchZone.id, anyaGujaratZone.id]
          }
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
    
    console.log(`\n` + '='.repeat(80))
    console.log('VOTE STATISTICS')
    console.log('='.repeat(80))
    console.log(`📊 Total Votes in Gujarat Zones: ${totalVotes}`)
    console.log(`   - Kutch: ${kutchVotes} votes`)
    console.log(`   - Anya Gujarat: ${anyaGujaratVotes} votes`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentGujaratVotes()

