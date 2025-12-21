import React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationProvider } from "@/lib/organization-context"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { ThemeApplier } from "@/components/theme-applier"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata = {
  title: "報帳系統",
  description: "費用報銷管理系統",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased theme-frc", inter.variable)}>
        <OrganizationProvider>
          <LanguageProvider>
            <ThemeApplier />
            {children}
            <OrganizationSwitcher />
          </LanguageProvider>
        </OrganizationProvider>
      </body>
    </html>
  )
}