// Force dynamic rendering for all candidate routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

