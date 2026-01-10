"use client";

import React, { createContext, useContext, ReactNode } from "react";

// 組織配置 - 通用展示版本
export const ORGANIZATIONS = {
    demo: {
        id: "expense-demo",
        name: "ExpenseFlow",
        subtitle: "智慧報帳系統",
        logo: "/logo.png",
        title: "ExpenseFlow 報帳",
        titleEn: "ExpenseFlow Expense",
        bgColor: "bg-primary",
        themeClass: "theme-demo",
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
    // 使用展示版本
    const org = ORGANIZATIONS.demo;
    const orgId: OrgId = "demo";

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
