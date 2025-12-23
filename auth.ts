import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Providers are defined here to ensure nodejs runtime compatibility
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // 用 email 查詢用戶
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) return null;

        // 用戶必須有密碼才能登入
        if (!user.password) return null;

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
  ],
})