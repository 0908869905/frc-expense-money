import React from "react"
import type { Viewport } from "next"
import "./globals.css"
import { IBM_Plex_Sans, IBM_Plex_Mono, Noto_Sans_TC } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationProvider } from "@/lib/organization-context"
import { ThemeProvider } from "@/lib/theme-context"
import { NavigationProgressProvider } from "@/lib/navigation-progress-context"
import { NavigationProgressBar } from "@/components/navigation"

// 工程帳冊字體系統：拉丁字母/UI 用 IBM Plex Sans，數據用 IBM Plex Mono，中文 fallback Noto Sans TC
// 全部由 next/font 自託管（CSP font-src 'self' 限制）
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
})

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-tc",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export const metadata = {
  title: "BudgetFlow",
  description: "團隊報帳與資金管理系統 — 支援報帳、庫存追蹤、QR Code 掃描與財務分析",
  icons: {
    icon: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
    shortcut: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
    apple: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent" as const,
    title: "BudgetFlow",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          plexSans.variable,
          plexMono.variable,
          notoSansTC.variable
        )}
      >
        <ThemeProvider>
          <OrganizationProvider>
            <LanguageProvider>
              <NavigationProgressProvider>
                <NavigationProgressBar />
                {children}
              </NavigationProgressProvider>
            </LanguageProvider>
          </OrganizationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
