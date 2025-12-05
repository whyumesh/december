import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Validate required environment variables
function validateAuthConfig() {
  const missing: string[] = []
  
  if (!process.env.NEXTAUTH_URL) {
    missing.push('NEXTAUTH_URL')
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    missing.push('NEXTAUTH_SECRET')
  }
  
  if (missing.length > 0) {
    console.error(`⚠️ Missing NextAuth environment variables: ${missing.join(', ')}`)
    console.error('Please set these in your Vercel project settings → Environment Variables')
    console.error('The authentication API will not work until these are set.')
  }
  
  return missing.length === 0
}

// Validate config before initializing
validateAuthConfig()

// Initialize NextAuth
// Note: NextAuth will throw an error if NEXTAUTH_SECRET is missing,
// but we've logged a warning above. The error will be caught by error boundaries.
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

