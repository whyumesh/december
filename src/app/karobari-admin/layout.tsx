// Force dynamic rendering for all karobari-admin routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function KarobariAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

