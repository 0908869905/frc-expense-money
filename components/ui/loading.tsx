"use client"

import { cn } from "@/lib/utils"

export type SpinnerSize = "sm" | "md" | "lg"

interface SpinnerProps {
    size?: SpinnerSize
    className?: string
}

const SPINNER_SIZES: Record<SpinnerSize, string> = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
}

export function Spinner({ size = "md", className }: SpinnerProps): React.ReactElement {
    return (
        <div
            className={cn(
                "animate-spin rounded-full border-primary border-t-transparent",
                SPINNER_SIZES[size],
                className
            )}
        />
    )
}

interface LoadingOverlayProps {
    isLoading: boolean
    children: React.ReactNode
    text?: string
}

export function LoadingOverlay({ isLoading, children, text }: LoadingOverlayProps) {
    return (
        <div className="relative">
            {children}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
                    <Spinner size="lg" />
                    {text && (
                        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                    )}
                </div>
            )}
        </div>
    )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    children: React.ReactNode
}

export function LoadingButton({
    isLoading = false,
    loadingText,
    children,
    disabled,
    className,
    ...props
}: LoadingButtonProps) {
    return (
        <button
            disabled={disabled || isLoading}
            className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            {...props}
        >
            {isLoading && <Spinner size="sm" className="border-primary-foreground border-t-transparent" />}
            {isLoading && loadingText ? loadingText : children}
        </button>
    )
}

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted",
                className
            )}
        />
    )
}

// 預建的 Skeleton 組合
export function SkeletonCard() {
    return (
        <div className="rounded-xl border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
        </div>
    )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    )
}
