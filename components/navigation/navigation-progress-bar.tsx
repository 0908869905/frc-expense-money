"use client"

import { useNavigationProgress } from "@/lib/navigation-progress-context"

export function NavigationProgressBar(): JSX.Element | null {
    const { isNavigating, progress } = useNavigationProgress()

    if (!isNavigating) {
        return null
    }

    return (
        <>
            {/* 頂部進度條：2px 琥珀實線，無漸層無光暈 */}
            <div
                className="fixed top-0 left-0 right-0 h-[2px] z-[100] overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Page loading progress"
            >
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* 走動小貓（隊伍吉祥物）：置於石墨底小螢幕框中，深淺主題皆成立 */}
            <div className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-[hsl(30_6%_11%)] px-6 pt-2 pb-3 shadow-[0_8px_24px_rgb(0_0_0_/_0.25)]">
                    <video
                        src="/loading-cat-v2.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-48 h-48 object-contain mix-blend-screen"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(35_8%_60%)]">
                        Loading
                    </span>
                </div>
            </div>
        </>
    )
}
