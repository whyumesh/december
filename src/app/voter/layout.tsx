// Force dynamic rendering for all voter routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

