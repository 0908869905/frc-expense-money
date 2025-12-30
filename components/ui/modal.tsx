"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: React.ReactNode
    children: React.ReactNode
    className?: string
    size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
    size = "md",
}: ModalProps) {
    const [isAnimating, setIsAnimating] = React.useState(false)
    const [shouldRender, setShouldRender] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setShouldRender(true)
            // Trigger animation after mount
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true)
                })
            })
        } else {
            setIsAnimating(false)
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false)
            }, 200) // Match animation duration
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }
        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen, onClose])

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    if (!shouldRender) return null

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
                    isAnimating ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full bg-card rounded-xl shadow-2xl transition-all duration-200",
                    sizeClasses[size],
                    isAnimating
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 translate-y-4",
                    className
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-muted transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={cn("p-4", !title && "pt-8")}>
                    {!title && (
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    )
}
