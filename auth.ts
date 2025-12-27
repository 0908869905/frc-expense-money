import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : ""
        const password = typeof credentials?.password === "string" ? credentials.password : ""

        if (!email) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        if (user.password) {
          if (!password) {
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            return null
          }
        }

        return {
          id: user.id,
          email: user.email ?? email,
          name: user.name,
          role: user.role,
          department: user.department,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = (user as any).department
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
          ; (session.user as any).department = token.department as string | null
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
})
