"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNavigationProgress, normalizePath } from "@/lib/navigation-progress-context"
import { ComponentProps, useCallback, MouseEvent } from "react"

interface NavigationLinkProps extends ComponentProps<typeof Link> {
    children: React.ReactNode
}

/**
 * A wrapper around Next.js Link that triggers the navigation progress bar.
 * Use this instead of Link for internal navigation that should show progress.
 */
export function NavigationLink({
    children,
    href,
    onClick,
    ...props
}: NavigationLinkProps) {
    const pathname = usePathname()
    const { startNavigation } = useNavigationProgress()

    const handleClick = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            const targetPath = typeof href === "string" ? href : href.pathname ?? ""
            const isHashLink = targetPath.startsWith("#")
            const isSamePath = normalizePath(pathname) === normalizePath(targetPath)

            if (!isHashLink && !isSamePath) {
                startNavigation(targetPath)
            }

            onClick?.(e)
        },
        [href, pathname, startNavigation, onClick]
    )

    return (
        <Link href={href} onClick={handleClick} {...props}>
            {children}
        </Link>
    )
}
