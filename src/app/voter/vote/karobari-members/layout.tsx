// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function KarobariMembersVotingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

