import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkVoterZone(phone: string) {
  const voter = await prisma.voter.findFirst({
    where: { phone: phone },
    include: {
      zone: true,
      karobariZone: true,
      yuvaPankZone: true,
      trusteeZone: true,
      user: {
        select: {
          name: true,
          phone: true
        }
      }
    }
  })
  
  if (!voter) {
    console.log(`\n❌ Voter not found with phone: ${phone}`)
    await prisma.$disconnect()
    return
  }
  
  console.log('\n📋 Voter Information:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Name: ${voter.user?.name || voter.name}`)
  console.log(`Phone: ${voter.phone}`)
  console.log(`Voter ID: ${voter.voterId || 'N/A'}`)
  console.log(`Region: ${voter.region || 'N/A'}`)
  console.log(`Age: ${voter.age ?? 'N/A'}`)
  
  console.log('\n📍 Zone Assignments:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (voter.zone) {
    console.log(`Primary Zone: ${voter.zone.nameGujarati || voter.zone.name}`)
    console.log(`  Code: ${voter.zone.code}`)
    console.log(`  Type: ${voter.zone.electionType}`)
  }
  
  if (voter.karobariZone) {
    console.log(`\nKarobari Zone: ${voter.karobariZone.nameGujarati || voter.karobariZone.name}`)
    console.log(`  Code: ${voter.karobariZone.code}`)
    console.log(`  Seats: ${voter.karobariZone.seats}`)
  }
  
  if (voter.yuvaPankZone) {
    console.log(`\nYuva Pankh Zone: ${voter.yuvaPankZone.nameGujarati || voter.yuvaPankZone.name}`)
    console.log(`  Code: ${voter.yuvaPankZone.code}`)
  }
  
  if (voter.trusteeZone) {
    console.log(`\nTrustee Zone: ${voter.trusteeZone.nameGujarati || voter.trusteeZone.name}`)
    console.log(`  Code: ${voter.trusteeZone.code}`)
  }
  
  await prisma.$disconnect()
}

const phone = process.argv[2] || '9820216044'
checkVoterZone(phone)

