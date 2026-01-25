import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

// 速率限制配置
const RATE_LIMIT_MAX_ATTEMPTS = 5 // 最多 5 次失敗
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60 // 15 分鐘視窗
const RATE_LIMIT_PREFIX = "login_attempts:"

async function checkLoginRateLimit(email: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `${RATE_LIMIT_PREFIX}${email.toLowerCase()}`
  const current = await redis.get<number>(key) || 0

  return {
    allowed: current < RATE_LIMIT_MAX_ATTEMPTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - current),
  }
}

async function recordFailedLogin(email: string): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${email.toLowerCase()}`
  const current = await redis.incr(key)

  // 第一次失敗時設定過期時間
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
  }
}

async function resetLoginAttempts(email: string): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${email.toLowerCase()}`
  await redis.del(key)
}

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

        // 檢查速率限制
        const rateLimit = await checkLoginRateLimit(email)
        if (!rateLimit.allowed) {
          console.warn(`Rate limit exceeded for ${email}`)
          // 返回 null 會導致 NextAuth 顯示一般的登入錯誤
          // 不透露具體原因以防止帳號枚舉
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          await recordFailedLogin(email)
          return null
        }

        // 強制要求密碼驗證
        if (!user.password) {
          // 用戶沒有設定密碼，拒絕登入
          console.warn(`User ${email} has no password set`)
          await recordFailedLogin(email)
          return null
        }

        if (!password) {
          await recordFailedLogin(email)
          return null
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          await recordFailedLogin(email)
          return null
        }

        // 登入成功，重置失敗計數
        await resetLoginAttempts(email)

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
      if (user && user.id) {
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
