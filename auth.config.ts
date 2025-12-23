import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
        async jwt({ token, user }) {
            if (user && user.id) {
                token.id = user.id
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string
                session.user.role = (token.role as string) || "USER"
            }
            return session
        },
    },
    providers: [], // Configured in auth.ts
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig
