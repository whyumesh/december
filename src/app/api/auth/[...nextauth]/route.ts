import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

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
const isValid = validateAuthConfig()

// Initialize NextAuth with error handling
let handler: ReturnType<typeof NextAuth>

try {
  if (!isValid) {
    // Create error handler if config is invalid
    handler = ((req: NextRequest) => {
      return NextResponse.json(
        { 
          error: 'NextAuth configuration error',
          message: 'NEXTAUTH_URL and NEXTAUTH_SECRET must be set in environment variables',
          missing: [
            !process.env.NEXTAUTH_URL ? 'NEXTAUTH_URL' : null,
            !process.env.NEXTAUTH_SECRET ? 'NEXTAUTH_SECRET' : null
          ].filter(Boolean)
        },
        { status: 500 }
      ) as any
    }) as any
  } else {
    handler = NextAuth(authOptions)
  }
} catch (error) {
  console.error('Failed to initialize NextAuth:', error)
  handler = ((req: NextRequest) => {
    return NextResponse.json(
      { 
        error: 'NextAuth initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ) as any
  }) as any
}

export { handler as GET, handler as POST }

