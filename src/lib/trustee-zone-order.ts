export const TRUSTEE_ZONE_CODE_ORDER = [
  'ABDASA_GARDA',
  'BHUJ',
  'ANJAR_ANYA_GUJARAT',
  'MUMBAI',
  'RAIGAD',
  'KARNATAKA_GOA'
] as const

const ORDER_INDEX = new Map<string, number>(
  TRUSTEE_ZONE_CODE_ORDER.map((code, idx) => [code, idx])
)

export function getTrusteeZoneSortKey(zone: { code?: string; name?: string }) {
  const code = (zone.code || '').toUpperCase()
  const key = ORDER_INDEX.get(code)
  if (typeof key === 'number') return key
  return 999
}

export function sortTrusteeZones<T extends { code?: string; name?: string }>(zones: T[]) {
  return [...zones].sort((a, b) => {
    const ak = getTrusteeZoneSortKey(a)
    const bk = getTrusteeZoneSortKey(b)
    if (ak !== bk) return ak - bk
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}

