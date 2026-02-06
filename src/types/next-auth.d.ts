import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      phone: string
      isOfflineVoteAdmin?: boolean
    }
  }

  interface User {
    role: string
    phone: string
    isOfflineVoteAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    phone: string
    isOfflineVoteAdmin?: boolean
  }
}
