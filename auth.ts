import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import Resend from "next-auth/providers/resend"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email) return null;
        
        // Dev only: simplistic check
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (user) return user;
        return null;
      }
    }),
    Resend({
      from: "onboarding@resend.dev"
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // ... custom session logic
      }
      return session;
    }
  }
})