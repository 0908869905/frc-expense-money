"use client"

import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

interface ViewTransitionOptions {
  onTransitionStart?: () => void
  onTransitionEnd?: () => void
}

export function useViewTransition() {
  const router = useRouter()
  const isTransitioning = useRef(false)

  const navigate = useCallback(
    async (href: string, options?: ViewTransitionOptions) => {
      if (isTransitioning.current) return
      isTransitioning.current = true

      options?.onTransitionStart?.()

      // 檢查瀏覽器是否支援 View Transitions API
      if (!document.startViewTransition) {
        // Fallback: 直接導航
        router.push(href)
        isTransitioning.current = false
        options?.onTransitionEnd?.()
        return
      }

      const transition = document.startViewTransition(async () => {
        router.push(href)
        // 等待 Next.js 完成導航
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      try {
        await transition.finished
      } finally {
        isTransitioning.current = false
        options?.onTransitionEnd?.()
      }
    },
    [router]
  )

  const supportsViewTransitions = typeof document !== "undefined" && "startViewTransition" in document

  return { navigate, supportsViewTransitions }
}
