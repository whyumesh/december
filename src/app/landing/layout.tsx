// Force dynamic rendering for landing page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

