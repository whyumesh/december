/**
 * Delete all offline votes for a given Voter ID (VID).
 * Usage: npx tsx scripts/delete-offline-vote-by-vid.ts <VID>
 * Example: npx tsx scripts/delete-offline-vote-by-vid.ts VID-0425
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(process.cwd(), file)
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const t = line.trim()
        if (t && !t.startsWith('#') && t.includes('=')) {
          const [key, ...v] = t.split('=')
          const val = v.join('=').trim().replace(/^["']|["']$/g, '')
          if (key?.trim()) process.env[key.trim()] = val
        }
      }
      return
    }
  }
}

loadEnv()

const prisma = new PrismaClient()

async function main() {
  const vid = process.argv[2]?.trim()
  if (!vid) {
    console.error('Usage: npx tsx scripts/delete-offline-vote-by-vid.ts <VID>')
    console.error('Example: npx tsx scripts/delete-offline-vote-by-vid.ts VID-0425')
    process.exit(1)
  }

  const count = await prisma.offlineVote.count({
    where: { voterId: vid }
  })

  if (count === 0) {
    console.log(`No offline votes found for VID: ${vid}`)
    await prisma.$disconnect()
    return
  }

  const result = await prisma.offlineVote.deleteMany({
    where: { voterId: vid }
  })

  console.log(`Deleted ${result.count} offline vote(s) for VID: ${vid}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
