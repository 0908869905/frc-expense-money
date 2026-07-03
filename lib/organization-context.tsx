"use client"

import React, { createContext, useContext, ReactNode } from "react"

// 組織資訊型別
interface OrganizationInfo {
    name: string
    title: string
    titleEn: string
    subtitle: string
    logo: string
    bgColor: string
}

// 預設組織資訊 - FRC 6998 UNIPARDS
const defaultOrg: OrganizationInfo = {
    name: "FRC 6998",
    title: "FRC 6998 報帳系統",
    titleEn: "FRC 6998 Expense System",
    subtitle: "UNIPARDS",
    logo: "/Gemini_Generated_Image_wkar2twkar2twkar.png",
    bgColor: "bg-foreground",
}

interface OrganizationContextType {
    org: OrganizationInfo
}

const OrganizationContext = createContext<OrganizationContextType>({
    org: defaultOrg,
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
    return (
        <OrganizationContext.Provider value={{ org: defaultOrg }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (!context) {
        throw new Error("useOrganization must be used within an OrganizationProvider")
    }
    return context
}
