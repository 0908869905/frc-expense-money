import React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { getBrandConfig } from "@/lib/brand"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const brandConfig = getBrandConfig()

export const metadata = {
  title: brandConfig.name,
  description: `${brandConfig.tagline} - 費用報銷管理系統`,
  icons: {
    icon: brandConfig.logo,
    shortcut: brandConfig.logo,
    apple: brandConfig.logo,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}