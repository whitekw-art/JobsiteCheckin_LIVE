import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      organizationId?: string | null
      orgSlug?: string | null
      companyName?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    organizationId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    organizationId?: string | null
    orgSlug?: string | null
    companyName?: string
  }
}
