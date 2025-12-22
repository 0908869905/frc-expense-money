"use client";

import React, { createContext, useContext, ReactNode } from "react";

// 組織配置 - 只保留 FRC
export const ORGANIZATIONS = {
    frc: {
        id: "frc-6998",
        name: "FRC 6998",
        subtitle: "UNIPARDS",
        logo: "/logo.png",
        title: "FRC 6998 報帳",
        titleEn: "FRC 6998 Expense",
        bgColor: "bg-primary",
        themeClass: "theme-frc",
    },
} as const;

export type OrgId = keyof typeof ORGANIZATIONS;
export type Organization = typeof ORGANIZATIONS[OrgId];

interface OrganizationContextType {
    org: Organization;
    orgId: OrgId;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    // 固定使用 FRC
    const org = ORGANIZATIONS.frc;
    const orgId: OrgId = "frc";

    return (
        <OrganizationContext.Provider value={{ org, orgId }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error("useOrganization must be used within an OrganizationProvider");
    }
    return context;
}
