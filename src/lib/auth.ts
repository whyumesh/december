import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

// Hardcoded Admin Credentials (for development)
// Email: admin@kms-election.com
// Password: SecureAdmin123!
// 
// This bypasses database authentication for admin login while keeping
// the Neon database connection for candidate data and other operations.

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Hardcoded admin credentials for development
        if (credentials.email === 'admin@kms-election.com' && credentials.password === 'SecureAdmin123!') {
          return {
            id: 'admin-hardcoded-id',
            email: 'admin@kms-election.com',
            name: 'Election Administrator',
            role: 'ADMIN',
            phone: '+1234567890',
          }
        }

        // For other users, try to connect to database (but don't fail if it doesn't work)
        try {
          // Check if DATABASE_URL is available before attempting database operations
          if (!process.env.DATABASE_URL) {
            console.log('DATABASE_URL not set - skipping database authentication')
            return null
          }
          
          const userEmail = credentials.email.toLowerCase()
          const user = await prisma.user.findFirst({
            where: {
              email: userEmail
            },
            include: {
              adminProfile: true,
              karobariAdminProfile: true,
              voterProfile: true,
              yuvaPankhCandidates: true,
              karobariCandidates: true,
              trusteeCandidates: true
            }
          })

          if (!user) {
            console.log('User not found for email:', userEmail)
            return null
          }

          if (!user.password) {
            console.log('User has no password set:', userEmail)
            return null
          }

          // Verify password using bcrypt
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.log('Password mismatch for email:', userEmail)
            return null
          }

          // Determine user role based on relations
          let role = 'USER'
          if (user.adminProfile) {
            role = 'ADMIN'
          } else if (user.karobariAdminProfile) {
            role = 'KAROBARI_ADMIN'
          } else if (user.voterProfile) {
            role = 'VOTER'
          } else if (user.yuvaPankhCandidates.length > 0 || user.karobariCandidates.length > 0 || user.trusteeCandidates.length > 0) {
            role = 'CANDIDATE'
          }

          return {
            id: user.id,
            email: user.email || '',
            name: user.name,
            role: role,
            phone: user.phone || '',
          }
        } catch (error) {
          // If database connection fails, only allow hardcoded admin
          console.error('Database connection failed during authentication:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.phone = token.phone as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
}
