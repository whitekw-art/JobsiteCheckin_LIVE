import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        organizationName: { label: 'Organization Name', type: 'text' },
        isSignUp: { label: 'Is Sign Up', type: 'hidden' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        if (credentials.isSignUp === 'true') {
          if (credentials.password.length < 8) return null

          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          if (existingUser) return null

          const hashedPassword = await bcrypt.hash(credentials.password, 12)

          let organization
          if (credentials.organizationName) {
            organization = await prisma.organization.create({
              data: { name: credentials.organizationName },
            })
          }

          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name,
              password: hashedPassword,
              role: organization ? 'OWNER' : 'USER',
              organizationId: organization?.id,
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          }
        } else {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          if (!user || !user.password) return null

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          }
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.orgSlug = token.orgSlug as string | null
        if (token.companyName) {
          session.user.companyName = token.companyName as string
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }

      if (!token.email) return token

      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          include: { organization: true },
        })
        if (dbUser) {
          token.organizationId = dbUser.organizationId
          token.companyName = dbUser.organization?.name
          token.orgSlug = dbUser.organization?.slug
        }
      } catch (error) {
        console.error('Error loading user organization for JWT:', error)
      }

      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: { strategy: 'jwt' },
}
