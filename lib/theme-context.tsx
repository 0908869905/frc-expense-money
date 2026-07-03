"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark")

    useEffect(() => {
        // 從 localStorage 讀取主題設定
        const savedTheme = localStorage.getItem("theme") as Theme | null
        if (savedTheme) {
            setTheme(savedTheme)
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark")
        }
    }, [])

    useEffect(() => {
        // 更新 document class
        // 注意：不在此寫入 localStorage —— 掛載初期此 effect 會先以預設值執行，
        // 在 StrictMode 雙重執行下會把使用者儲存的主題覆寫掉（淺色模式因此從未生效）。
        // 儲存只發生在使用者主動切換時（toggleTheme）。
        const root = document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === "light" ? "dark" : "light"
            localStorage.setItem("theme", next)
            return next
        })
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
