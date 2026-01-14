/**
 * Check and clean up Kutch candidates
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
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

async function checkCandidates() {
  try {
    const zone = await prisma.zone.findFirst({
      where: { code: 'KUTCH', electionType: 'YUVA_PANK' }
    })
    
    if (!zone) {
      console.log('❌ Kutch zone not found')
      return
    }
    
    console.log(`\n📋 Checking candidates for Kutch zone (${zone.id})...\n`)
    
    const allCandidates = await prisma.yuvaPankhCandidate.findMany({
      where: { zoneId: zone.id },
      select: { 
        id: true, 
        name: true, 
        status: true, 
        position: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total candidates in Kutch: ${allCandidates.length}\n`)
    
    allCandidates.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`)
      console.log(`   Status: ${c.status}`)
      console.log(`   Position: ${c.position}`)
      console.log(`   Created: ${c.createdAt}`)
      console.log('')
    })
    
    const approvedCandidates = allCandidates.filter(c => c.status === 'APPROVED')
    console.log(`\n✅ Approved candidates: ${approvedCandidates.length}`)
    approvedCandidates.forEach(c => console.log(`   - ${c.name}`))
    
    // Expected candidates
    const expected = [
      'Bhavesh Harilal Mandan',
      'Raj Dhiraj Mandan',
      'Nikhil Vasant Gandhi'
    ]
    const approvedNames = approvedCandidates.map(c => c.name)
    
    console.log('\n🔍 Verification:')
    expected.forEach(name => {
      const found = approvedNames.some(n => 
        n.toLowerCase().includes(name.toLowerCase().split(' ')[0]) &&
        n.toLowerCase().includes(name.toLowerCase().split(' ')[1])
      )
      console.log(`   ${found ? '✅' : '❌'} ${name}: ${found ? 'Found' : 'Missing'}`)
    })
    
    // Check for unexpected candidates
    const unexpected = approvedCandidates.filter(c => {
      const nameLower = c.name.toLowerCase()
      return !expected.some(e => {
        const eParts = e.toLowerCase().split(' ')
        return eParts.every(part => nameLower.includes(part))
      })
    })
    
    if (unexpected.length > 0) {
      console.log('\n⚠️  Unexpected approved candidates (should be removed or rejected):')
      unexpected.forEach(c => console.log(`   - ${c.name} (ID: ${c.id})`))
      return unexpected
    }
    
    return []
    
  } catch (error) {
    console.error('Error:', error)
    return []
  } finally {
    await prisma.$disconnect()
  }
}

checkCandidates()

