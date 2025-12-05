// Force dynamic rendering for terms and conditions page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TermsAndConditionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

