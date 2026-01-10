import React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationProvider } from "@/lib/organization-context"
import { ThemeProvider } from "@/lib/theme-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata = {
  title: "測試公司 報帳系統",
  description: "測試公司 費用報銷管理系統",
  icons: {
    icon: "/demo-logo.png",
    shortcut: "/demo-logo.png",
    apple: "/demo-logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased theme-frc dark", inter.variable)}>
        <ThemeProvider>
          <OrganizationProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </OrganizationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}