"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react"
import { usePathname } from "next/navigation"

interface NavigationProgressContextType {
    isNavigating: boolean
    progress: number
    targetPath: string | null
    startNavigation: (path: string) => void
    completeNavigation: () => void
}

const NavigationProgressContext = createContext<NavigationProgressContextType | undefined>(undefined)

const PROGRESS_STEPS = [10, 30, 50, 70, 90]
const STEP_INTERVAL_MS = 150
const COMPLETION_DELAY_MS = 200

/** Normalize path by removing trailing slashes */
export function normalizePath(path: string): string {
    return path.replace(/\/$/, "") || "/"
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
    const [isNavigating, setIsNavigating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [targetPath, setTargetPath] = useState<string | null>(null)

    const pathname = usePathname()
    const progressIndexRef = useRef(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearTimers = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (completionTimeoutRef.current) {
            clearTimeout(completionTimeoutRef.current)
            completionTimeoutRef.current = null
        }
    }, [])

    const completeNavigation = useCallback(() => {
        clearTimers()
        setProgress(100)

        completionTimeoutRef.current = setTimeout(() => {
            setIsNavigating(false)
            setProgress(0)
            setTargetPath(null)
            progressIndexRef.current = 0
        }, COMPLETION_DELAY_MS)
    }, [clearTimers])

    const startNavigation = useCallback((path: string) => {
        clearTimers()
        progressIndexRef.current = 0
        setTargetPath(path)
        setIsNavigating(true)
        setProgress(PROGRESS_STEPS[0])

        intervalRef.current = setInterval(() => {
            progressIndexRef.current += 1

            if (progressIndexRef.current < PROGRESS_STEPS.length) {
                setProgress(PROGRESS_STEPS[progressIndexRef.current])
            } else {
                clearInterval(intervalRef.current!)
                intervalRef.current = null
            }
        }, STEP_INTERVAL_MS)
    }, [clearTimers])

    useEffect(() => {
        if (isNavigating && targetPath && normalizePath(pathname) === normalizePath(targetPath)) {
            completeNavigation()
        }
    }, [pathname, isNavigating, targetPath, completeNavigation])

    useEffect(() => {
        return clearTimers
    }, [clearTimers])

    return (
        <NavigationProgressContext.Provider
            value={{
                isNavigating,
                progress,
                targetPath,
                startNavigation,
                completeNavigation
            }}
        >
            {children}
        </NavigationProgressContext.Provider>
    )
}

export function useNavigationProgress() {
    const context = useContext(NavigationProgressContext)
    if (context === undefined) {
        throw new Error("useNavigationProgress must be used within a NavigationProgressProvider")
    }
    return context
}
