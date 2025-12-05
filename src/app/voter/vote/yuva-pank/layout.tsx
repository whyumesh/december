// Force dynamic rendering for yuva-pank voting page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function YuvaPankVotingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

