import React from "react"
import "./globals.css"
import { Outfit } from "next/font/google"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationProvider } from "@/lib/organization-context"
import { ThemeProvider } from "@/lib/theme-context"

// 英文字型：Outfit
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

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
      <head>
        {/* 中文字型：霞鶩文楷 LXGW WenKai */}
        <link
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css"
          rel="stylesheet"
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased theme-frc dark", outfit.variable)}>
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