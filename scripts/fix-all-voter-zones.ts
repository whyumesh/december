import ExcelJS from 'exceljs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_FILE = 'Final Data for Input.xlsx'

const REGION_MAPPINGS: Record<string, { karobari: string; trustee: string; yuvaPank: string | null }> = {
  Mumbai: { karobari: 'MUMBAI', trustee: 'MUMBAI', yuvaPank: null },
  Raigad: { karobari: 'RAIGAD', trustee: 'RAIGAD', yuvaPank: 'RAIGAD' },
  'Karnataka & Goa': { karobari: 'KARNATAKA_GOA', trustee: 'KARNATAKA_GOA', yuvaPank: 'KARNATAKA_GOA' },
  Bhuj: { karobari: 'BHUJ', trustee: 'BHUJ', yuvaPank: null },
  Kutch: { karobari: 'KUTCH', trustee: 'ABDASA_GARDA', yuvaPank: null },
  Anjar: { karobari: 'ANJAR', trustee: 'ANJAR_ANYA_GUJARAT', yuvaPank: null },
  'Anya Gujarat': { karobari: 'ANYA_GUJARAT', trustee: 'ANJAR_ANYA_GUJARAT', yuvaPank: null },
}

const REGION_ALIAS: Record<string, string> = {
  'Karnataka-Goa': 'Karnataka & Goa',
}

const ANJAR_CITIES = new Set(
  ['anjar', 'adipur', 'mandvi', 'mundra', 'gandhidham', 'gandhi dham', 'shenoi', 'shinoi', 'bhandariya', 'bhadreshwar', 'khedoi', 'rapar', 'varsamedi'].map((city) => city.toLowerCase())
)

function normalizePhone(value: any): string | null {
  if (value === null || value === undefined) return null
  let raw = value
  if (typeof value === 'object' && 'text' in (value as any)) {
    raw = (value as any).text
  }
  if (typeof raw === 'number') {
    raw = Math.trunc(raw).toString()
  }
  const digits = raw.toString().trim().replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(-10)
  }
  if (digits.length === 10) {
    return digits
  }
  return null
}

function getCellValue(row: ExcelJS.Row, cell: number): any {
  const value = row.getCell(cell).value
  if (value === undefined || value === null) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'result' in value && (value as any).result !== undefined) {
    return (value as any).result
  }
  if (typeof value === 'object' && 'text' in value && (value as any).text !== undefined) {
    return (value as any).text
  }
  return value
}

function normalizeRegion(region: string | null, city: string | null): { karobari: string; trustee: string; yuvaPank: string | null; label: string } {
  const trimmedRegion = region?.trim() || ''
  const normalized = REGION_ALIAS[trimmedRegion] || trimmedRegion

  if (normalized === 'Anjar-Anya Gujarat') {
    const cityName = city?.trim().toLowerCase() || ''
    if (ANJAR_CITIES.has(cityName)) {
      return { ...REGION_MAPPINGS['Anjar'], label: 'Anjar' }
    }
    return { ...REGION_MAPPINGS['Anya Gujarat'], label: 'Anya Gujarat' }
  }

  const mapping = REGION_MAPPINGS[normalized] || REGION_MAPPINGS['Mumbai']
  return { ...mapping, label: normalized || 'Mumbai' }
}

async function fixAllVoterZones(filePath: string) {
  console.log(`📥 Reading Excel file: ${filePath}`)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  let worksheet = workbook.getWorksheet(1)
  if (!worksheet) {
    worksheet = workbook.worksheets[0]
  }
  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file')
  }

  // Build zone cache first
  console.log('📦 Building zone cache...')
  const zones = await prisma.zone.findMany({
    select: { id: true, code: true, electionType: true },
  })
  
  const zoneCache = new Map<string, string>()
  zones.forEach((zone) => {
    zoneCache.set(`${zone.code}:${zone.electionType}`, zone.id)
  })

  console.log(`📊 Processing ${worksheet.rowCount - 1} rows from Excel...\n`)

  // Read all Excel data first
  const excelData = new Map<string, { karobari: string; trustee: string; yuvaPank: string | null; region: string; age: number | null }>()
  
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    const rowValues = Array.isArray(row.values) ? row.values : Object.values(row.values || {})
    if (rowValues.every((value: any) => value === null || value === undefined || value === '')) {
      continue
    }

    try {
      const phone = normalizePhone(getCellValue(row, 6))
      if (!phone) continue

      const region = (getCellValue(row, 10) ?? '').toString().trim()
      const city = (getCellValue(row, 8) ?? '').toString().trim() || null
      const ageCell = getCellValue(row, 5)
      const age = ageCell ? Number(ageCell) : null

      if (!region) continue

      const regionMapping = normalizeRegion(region, city)
      excelData.set(phone, {
        karobari: regionMapping.karobari,
        trustee: regionMapping.trustee,
        yuvaPank: regionMapping.yuvaPank,
        region: regionMapping.label,
        age: age,
      })
    } catch (error) {
      // Skip row on error
    }
  }

  console.log(`✓ Loaded ${excelData.size} voters from Excel\n`)

  // Get all voters from database
  console.log('📥 Loading all voters from database...')
  const allVoters = await prisma.voter.findMany({
    select: {
      id: true,
      phone: true,
      name: true,
      karobariZoneId: true,
      trusteeZoneId: true,
      yuvaPankZoneId: true,
      age: true,
      region: true,
    },
  })

  console.log(`✓ Loaded ${allVoters.length} voters from database\n`)

  // Process in batches
  const BATCH_SIZE = 100
  let fixed = 0
  let alreadyCorrect = 0
  let notFound = 0
  let errors = 0

  console.log('🔧 Fixing zones...\n')

  for (let i = 0; i < allVoters.length; i += BATCH_SIZE) {
    const batch = allVoters.slice(i, i + BATCH_SIZE)
    const updates: Promise<any>[] = []

    for (const voter of batch) {
      if (!voter.phone) continue
      const excelInfo = excelData.get(voter.phone)
      
      if (!excelInfo) {
        notFound++
        continue
      }

      const correctKarobariZoneId = zoneCache.get(`${excelInfo.karobari}:KAROBARI_MEMBERS`) || null
      const correctTrusteeZoneId = zoneCache.get(`${excelInfo.trustee}:TRUSTEES`) || null
      const correctYuvaPankZoneId = 
        excelInfo.yuvaPank && voter.age && voter.age >= 18 && voter.age <= 39
          ? zoneCache.get(`${excelInfo.yuvaPank}:YUVA_PANK`) || null
          : null

      const needsZoneFix = 
        voter.karobariZoneId !== correctKarobariZoneId ||
        voter.trusteeZoneId !== correctTrusteeZoneId ||
        voter.yuvaPankZoneId !== correctYuvaPankZoneId

      // Check if region field needs updating
      const needsRegionFix = voter.region !== excelInfo.region

      if (!needsZoneFix && !needsRegionFix) {
        alreadyCorrect++
        continue
      }

      updates.push(
        prisma.voter.update({
          where: { id: voter.id },
          data: {
            karobariZoneId: correctKarobariZoneId,
            trusteeZoneId: correctTrusteeZoneId,
            yuvaPankZoneId: correctYuvaPankZoneId,
            region: excelInfo.region,
          },
        })
      )
    }

    if (updates.length > 0) {
      await Promise.all(updates)
      fixed += updates.length
      console.log(`  ✓ Fixed ${fixed} voters... (${Math.round((i / allVoters.length) * 100)}% complete)`)
    }
  }

  console.log('\n✅ Zone Fix Summary:')
  console.log(`   Fixed: ${fixed}`)
  console.log(`   Already correct: ${alreadyCorrect}`)
  console.log(`   Not found in Excel: ${notFound}`)
  console.log(`   Errors: ${errors}`)
  
  // Verify the specific voter
  const testVoter = await prisma.voter.findFirst({
    where: { phone: '9820216044' },
    include: { karobariZone: true },
  })
  
  if (testVoter) {
    console.log(`\n✅ Test voter (9820216044):`)
    console.log(`   Name: ${testVoter.name}`)
    console.log(`   Karobari Zone: ${testVoter.karobariZone?.code || 'NONE'}`)
  }
}

async function main() {
  const filePath = process.argv[2] || DEFAULT_FILE
  await fixAllVoterZones(filePath)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Script completed successfully!')
  })
  .catch(async (error) => {
    await prisma.$disconnect()
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

