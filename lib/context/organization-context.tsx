"use client";

import React, { createContext, useContext, ReactNode } from "react";

// 蝯??蔭 - ?芯???FRC
export const ORGANIZATIONS = {
    frc: {
        id: "demo",
        name: "測試公司",
        subtitle: "Demo Corp",
        logo: "/demo-logo.png",
        title: "測試公司 ?勗董",
        titleEn: "測試公司 Expense",
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
    // ?箏?雿輻 FRC
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


