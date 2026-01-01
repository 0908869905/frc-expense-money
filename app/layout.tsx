import React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationProvider } from "@/lib/organization-context"
import { ThemeProvider } from "@/lib/theme-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata = {
  title: "FRC 6998 報帳系統",
  description: "FRC 6998 費用報銷管理系統",
  icons: {
    icon: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
    shortcut: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
    apple: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
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