// Force dynamic rendering for trustees voting page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TrusteesVotingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

