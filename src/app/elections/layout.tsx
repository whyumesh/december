// Force dynamic rendering for all election routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ElectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

