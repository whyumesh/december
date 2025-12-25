import { prisma } from '../src/lib/db'
import * as fs from 'fs'

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile('.env.local')

async function checkVoterDetails(searchTerm: string) {
  console.log(`\n🔍 Searching for voter: "${searchTerm}"\n`)
  
  // Try to find by name (case-insensitive)
  const voters = await prisma.voter.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { voterId: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } }
      ]
    },
    include: {
      zone: true,
      karobariZone: true,
      yuvaPankZone: true,
      trusteeZone: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true
        }
      },
      votes: {
        include: {
          election: {
            select: {
              title: true,
              type: true
            }
          },
          karobariCandidate: {
            select: {
              name: true
            }
          },
          trusteeCandidate: {
            select: {
              name: true
            }
          },
          yuvaPankhCandidate: {
            select: {
              name: true
            }
          },
          yuvaPankhNominee: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })
  
  if (voters.length === 0) {
    console.log(`❌ No voters found matching "${searchTerm}"`)
    await prisma.$disconnect()
    return
  }
  
  voters.forEach((voter, index) => {
    if (voters.length > 1) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`Voter ${index + 1} of ${voters.length}`)
      console.log('='.repeat(80))
    }
    
    console.log('\n📋 Voter Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID: ${voter.id}`)
    console.log(`Voter ID: ${voter.voterId}`)
    console.log(`Name: ${voter.name}`)
    console.log(`Phone: ${voter.phone || 'N/A'}`)
    console.log(`Email: ${voter.email || 'N/A'}`)
    console.log(`Date of Birth: ${voter.dob || 'N/A'}`)
    console.log(`Age: ${voter.age ?? 'N/A'}`)
    console.log(`Gender: ${voter.gender || 'N/A'}`)
    console.log(`Region: ${voter.region || 'N/A'}`)
    console.log(`Mulgam: ${voter.mulgam || 'N/A'}`)
    console.log(`Is Active: ${voter.isActive ? 'Yes' : 'No'}`)
    console.log(`Has Voted: ${voter.hasVoted ? 'Yes' : 'No'}`)
    console.log(`Last Login: ${voter.lastLoginAt ? voter.lastLoginAt.toLocaleString() : 'Never'}`)
    console.log(`Created At: ${voter.createdAt.toLocaleString()}`)
    console.log(`Updated At: ${voter.updatedAt.toLocaleString()}`)
    
    if (voter.user) {
      console.log('\n👤 User Account:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`User ID: ${voter.user.id}`)
      console.log(`User Name: ${voter.user.name}`)
      console.log(`User Email: ${voter.user.email || 'N/A'}`)
      console.log(`User Phone: ${voter.user.phone || 'N/A'}`)
      console.log(`Account Created: ${voter.user.createdAt.toLocaleString()}`)
    }
    
    console.log('\n📍 Zone Assignments:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (voter.zone) {
      console.log(`Primary Zone: ${voter.zone.nameGujarati || voter.zone.name}`)
      console.log(`  Code: ${voter.zone.code}`)
      console.log(`  Type: ${voter.zone.electionType}`)
      console.log(`  Seats: ${voter.zone.seats}`)
      console.log(`  Active: ${voter.zone.isActive ? 'Yes' : 'No'}`)
    } else {
      console.log('Primary Zone: Not assigned')
    }
    
    if (voter.karobariZone) {
      console.log(`\nKarobari Zone: ${voter.karobariZone.nameGujarati || voter.karobariZone.name}`)
      console.log(`  Code: ${voter.karobariZone.code}`)
      console.log(`  Seats: ${voter.karobariZone.seats}`)
    } else {
      console.log('\nKarobari Zone: Not assigned')
    }
    
    if (voter.yuvaPankZone) {
      console.log(`\nYuva Pankh Zone: ${voter.yuvaPankZone.nameGujarati || voter.yuvaPankZone.name}`)
      console.log(`  Code: ${voter.yuvaPankZone.code}`)
    } else {
      console.log('\nYuva Pankh Zone: Not assigned')
    }
    
    if (voter.trusteeZone) {
      console.log(`\nTrustee Zone: ${voter.trusteeZone.nameGujarati || voter.trusteeZone.name}`)
      console.log(`  Code: ${voter.trusteeZone.code}`)
    } else {
      console.log('\nTrustee Zone: Not assigned')
    }
    
    console.log('\n🗳️  Voting History:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (voter.votes.length === 0) {
      console.log('No votes recorded')
    } else {
      voter.votes.forEach((vote, i) => {
        console.log(`\nVote ${i + 1}:`)
        console.log(`  Election: ${vote.election.title} (${vote.election.type})`)
        console.log(`  Timestamp: ${vote.timestamp.toLocaleString()}`)
        if (vote.karobariCandidate) {
          console.log(`  Karobari Candidate: ${vote.karobariCandidate.name}`)
        }
        if (vote.trusteeCandidate) {
          console.log(`  Trustee Candidate: ${vote.trusteeCandidate.name}`)
        }
        if (vote.yuvaPankhCandidate) {
          console.log(`  Yuva Pankh Candidate: ${vote.yuvaPankhCandidate.name}`)
        }
        if (vote.yuvaPankhNominee) {
          console.log(`  Yuva Pankh Nominee: ${vote.yuvaPankhNominee.name}`)
        }
        if (vote.ipAddress) {
          console.log(`  IP Address: ${vote.ipAddress}`)
        }
      })
    }
  })
  
  await prisma.$disconnect()
}

const searchTerm = process.argv[2] || 'Honey Nandlal Gingal'
checkVoterDetails(searchTerm)
  .then(() => {
    console.log('\n✅ Search completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

