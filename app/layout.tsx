import React from "react"
import type { Viewport } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationProvider } from "@/lib/organization-context"
import { ThemeProvider } from "@/lib/theme-context"
import { NavigationProgressProvider } from "@/lib/navigation-progress-context"
import { NavigationProgressBar } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

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
      <body className={cn("min-h-screen font-sans antialiased", inter.variable)}>
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