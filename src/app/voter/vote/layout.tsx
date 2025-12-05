// Force dynamic rendering for all vote routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

