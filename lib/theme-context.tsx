"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 主題配置
export const THEMES = {
    frc: {
        id: "frc",
        name: "FRC 6998",
        subtitle: "UNIPARDS",
        logo: "/logo.png",
        title: "FRC 6998 報帳系統",
        titleEn: "FRC 6998 Expense",
        bgColor: "bg-black",
    },
    family: {
        id: "family",
        name: "家庭記帳",
        subtitle: "Family",
        logo: "/logo-family.png",
        title: "家庭記帳系統",
        titleEn: "Family Expense",
        bgColor: "bg-gradient-to-br from-orange-500 to-teal-500",
    },
} as const;

export type ThemeId = keyof typeof THEMES;
export type Theme = typeof THEMES[ThemeId];

interface ThemeContextType {
    theme: Theme;
    themeId: ThemeId;
    setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "expense-system-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeId, setThemeId] = useState<ThemeId>("frc");

    // 從 localStorage 讀取
    useEffect(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored && stored in THEMES) {
            setThemeId(stored as ThemeId);
        }
    }, []);

    const setTheme = (id: ThemeId) => {
        setThemeId(id);
        localStorage.setItem(THEME_STORAGE_KEY, id);
        // 也可以存到資料庫讓所有用戶同步
    };

    const theme = THEMES[themeId];

    return (
        <ThemeContext.Provider value={{ theme, themeId, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
