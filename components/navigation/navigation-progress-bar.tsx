"use client"

import { useNavigationProgress } from "@/lib/navigation-progress-context"

export function NavigationProgressBar(): JSX.Element | null {
    const { isNavigating, progress } = useNavigationProgress()

    if (!isNavigating) {
        return null
    }

    return (
        <>
            {/* 頂部進度條 */}
            <div
                className="fixed top-0 left-0 right-0 h-[3px] z-[100] overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Page loading progress"
            >
                <div
                    className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 transition-all duration-300 ease-out relative"
                    style={{
                        width: `${progress}%`,
                        boxShadow: "0 0 10px rgba(34, 211, 238, 0.5)"
                    }}
                >
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                        style={{ backgroundSize: "200% 100%" }}
                    />
                </div>
            </div>

            {/* 中間走動貓咪動畫 */}
            <div className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none">
                <video
                    src="/loading-cat-v2.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-80 h-80 object-contain mix-blend-screen"
                />
            </div>
        </>
    )
}
