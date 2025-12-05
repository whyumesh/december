// Force dynamic rendering for privacy policy page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

