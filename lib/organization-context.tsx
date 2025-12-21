"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 組織配置
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
        password: null, // FRC 不需要密碼
    },
    family: {
        id: "family",
        name: "家庭記帳",
        subtitle: "Family",
        logo: "/logo-family.png",
        title: "家庭記帳",
        titleEn: "Family Expense",
        bgColor: "bg-primary",
        themeClass: "theme-family",
        password: "***REMOVED***", // 家庭版需要密碼
    },
} as const;

export type OrgId = keyof typeof ORGANIZATIONS;
export type Organization = typeof ORGANIZATIONS[OrgId];

interface OrganizationContextType {
    org: Organization;
    orgId: OrgId;
    setOrg: (id: OrgId) => void;
    switchToFamily: (password: string) => boolean;
    switchToFrc: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const ORG_STORAGE_KEY = "expense-system-org";

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [orgId, setOrgId] = useState<OrgId>("frc");

    // 從 localStorage 讀取
    useEffect(() => {
        const stored = localStorage.getItem(ORG_STORAGE_KEY);
        if (stored && stored in ORGANIZATIONS) {
            setOrgId(stored as OrgId);
        }
    }, []);

    const setOrg = (id: OrgId) => {
        setOrgId(id);
        localStorage.setItem(ORG_STORAGE_KEY, id);
    };

    const switchToFamily = (password: string): boolean => {
        if (password === ORGANIZATIONS.family.password) {
            setOrg("family");
            return true;
        }
        return false;
    };

    const switchToFrc = () => {
        setOrg("frc");
    };

    const org = ORGANIZATIONS[orgId];

    return (
        <OrganizationContext.Provider value={{ org, orgId, setOrg, switchToFamily, switchToFrc }}>
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
