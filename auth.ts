import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Note: PrismaAdapter removed because Credentials provider uses JWT strategy
  // and doesn't need database sessions
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        organizationId: { label: "Organization", type: "text" }, // 新增：組織 ID
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const organizationId = (credentials.organizationId as string) || "frc-6998";

        // 根據 email 和 organizationId 查找用戶
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
            organizationId, // 只在當前組織內查找
          }
        });

        if (!user) return null;

        // For demo users without password, allow any password
        if (!user.password) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          };
        }

        // Verify password for registered users
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
          organizationId: user.organizationId,
        };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "USER";
        (session.user as any).organizationId = token.organizationId || "frc-6998";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
})