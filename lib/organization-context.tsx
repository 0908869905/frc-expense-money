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
        bgColor: "bg-black",
        password: null, // FRC 不需要密碼
    },
    family: {
        id: "family",
        name: "家庭記帳",
        subtitle: "Family",
        logo: "/logo-family.png",
        title: "家庭記帳",
        titleEn: "Family Expense",
        bgColor: "bg-gradient-to-br from-orange-500 to-teal-500",
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

// 默認值，用於 SSR 或 context 未準備好時
const defaultContext: OrganizationContextType = {
    org: ORGANIZATIONS.frc,
    orgId: "frc",
    setOrg: () => { },
    switchToFamily: () => false,
    switchToFrc: () => { },
};

const OrganizationContext = createContext<OrganizationContextType>(defaultContext);

const ORG_STORAGE_KEY = "expense-system-org";

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [orgId, setOrgId] = useState<OrgId>("frc");
    const [mounted, setMounted] = useState(false);

    // 從 localStorage 讀取
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(ORG_STORAGE_KEY);
            if (stored && stored in ORGANIZATIONS) {
                setOrgId(stored as OrgId);
            }
        } catch (e) {
            // localStorage 可能在某些情況下不可用
        }
    }, []);

    const setOrg = (id: OrgId) => {
        setOrgId(id);
        try {
            localStorage.setItem(ORG_STORAGE_KEY, id);
        } catch (e) {
            // 忽略 localStorage 錯誤
        }
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
    return useContext(OrganizationContext);
}

