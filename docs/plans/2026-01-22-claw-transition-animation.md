# 豹爪撕裂過渡動畫 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在主畫面點擊「進入系統」按鈕後，播放豹爪從中央撕裂畫面的動畫，然後過渡到登入頁面。

**Architecture:** 使用 View Transitions API 實現跨頁面過渡，搭配 CSS 動畫呈現三階段效果（豹爪出現 → 撕裂畫面 → 展開露出登入頁）。動畫元件使用 React + CSS 實現，不規則撕裂邊緣使用 SVG clip-path，碎片效果使用 CSS 動畫。

**Tech Stack:** Next.js 14 App Router, View Transitions API, CSS Animations, SVG clip-path, TypeScript

---

## Task 1: 建立過渡動畫 Hook

**Files:**
- Create: `lib/hooks/use-view-transition.ts`

**Step 1: 建立 useViewTransition hook**

```typescript
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
```

**Step 2: Commit**

```bash
git add lib/hooks/use-view-transition.ts
git commit -m "feat: add useViewTransition hook for View Transitions API"
```

---

## Task 2: 建立豹爪 SVG 元件

**Files:**
- Create: `components/transitions/claw-svg.tsx`

**Step 1: 建立豹爪 SVG 元件**

```tsx
"use client"

interface ClawSvgProps {
  className?: string
  style?: React.CSSProperties
}

export function ClawSvg({ className, style }: ClawSvgProps) {
  return (
    <svg
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* 豹爪剪影 - 四指向下抓 */}
      <g fill="white" filter="url(#claw-glow)">
        {/* 第一指（左） */}
        <path d="M40 0 Q35 60 25 120 Q20 150 30 180 Q35 160 45 130 Q55 80 50 20 Z" />
        {/* 第二指 */}
        <path d="M70 0 Q65 70 55 140 Q50 175 60 210 Q68 185 78 150 Q90 90 85 25 Z" />
        {/* 第三指（中） */}
        <path d="M105 0 Q100 80 92 160 Q88 200 98 240 Q108 210 118 170 Q130 100 125 30 Z" />
        {/* 第四指（右） */}
        <path d="M140 0 Q135 70 128 140 Q125 175 135 210 Q143 185 150 150 Q162 90 157 25 Z" />
        {/* 掌心部分 */}
        <path d="M30 180 Q50 220 90 230 Q130 225 150 200 Q140 230 100 250 Q60 245 30 180 Z" />
      </g>
      {/* 發光效果 */}
      <defs>
        <filter id="claw-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
```

**Step 2: Commit**

```bash
git add components/transitions/claw-svg.tsx
git commit -m "feat: add claw SVG component for transition animation"
```

---

## Task 3: 建立紙張碎片元件

**Files:**
- Create: `components/transitions/paper-fragments.tsx`

**Step 1: 建立紙張碎片元件**

```tsx
"use client"

import { useEffect, useState } from "react"

interface Fragment {
  id: number
  x: number
  y: number
  rotation: number
  size: number
  delay: number
  duration: number
}

interface PaperFragmentsProps {
  isActive: boolean
  count?: number
}

export function PaperFragments({ isActive, count = 20 }: PaperFragmentsProps) {
  const [fragments, setFragments] = useState<Fragment[]>([])

  useEffect(() => {
    if (isActive) {
      // 在撕裂線附近生成碎片
      const newFragments: Fragment[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 45 + Math.random() * 10, // 集中在中央 45-55%
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        size: 4 + Math.random() * 12,
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.6,
      }))
      setFragments(newFragments)
    } else {
      setFragments([])
    }
  }, [isActive, count])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {fragments.map((fragment) => (
        <div
          key={fragment.id}
          className="absolute bg-white/80 animate-fragment-fall"
          style={{
            left: `${fragment.x}%`,
            top: `${fragment.y}%`,
            width: `${fragment.size}px`,
            height: `${fragment.size * 1.2}px`,
            transform: `rotate(${fragment.rotation}deg)`,
            animationDelay: `${fragment.delay}s`,
            animationDuration: `${fragment.duration}s`,
            clipPath: "polygon(10% 0%, 90% 5%, 95% 90%, 5% 100%)",
          }}
        />
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/transitions/paper-fragments.tsx
git commit -m "feat: add paper fragments component for tear effect"
```

---

## Task 4: 建立撕裂遮罩 SVG

**Files:**
- Create: `components/transitions/tear-mask.tsx`

**Step 1: 建立不規則撕裂邊緣遮罩**

```tsx
"use client"

interface TearMaskProps {
  side: "left" | "right"
  className?: string
}

export function TearMask({ side, className }: TearMaskProps) {
  // 生成不規則鋸齒邊緣的 path
  const generateTearPath = () => {
    const points: string[] = []
    const segments = 30

    if (side === "left") {
      // 左半邊：從右上角開始，沿著撕裂邊緣到右下角
      points.push("M 100 0") // 右上角

      for (let i = 0; i <= segments; i++) {
        const y = (i / segments) * 100
        // 不規則的鋸齒效果
        const baseX = 100
        const offset = Math.sin(i * 0.8) * 3 + Math.random() * 2
        const x = baseX + offset
        points.push(`L ${x} ${y}`)
      }

      points.push("L 100 100") // 右下角
      points.push("L 0 100")   // 左下角
      points.push("L 0 0")     // 左上角
      points.push("Z")
    } else {
      // 右半邊：從左上角開始，沿著撕裂邊緣到左下角
      points.push("M 0 0") // 左上角

      for (let i = 0; i <= segments; i++) {
        const y = (i / segments) * 100
        const baseX = 0
        const offset = Math.sin(i * 0.8) * 3 + Math.random() * 2
        const x = baseX - offset
        points.push(`L ${x} ${y}`)
      }

      points.push("L 0 100")   // 左下角
      points.push("L 100 100") // 右下角
      points.push("L 100 0")   // 右上角
      points.push("Z")
    }

    return points.join(" ")
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <clipPath id={`tear-clip-${side}`} clipPathUnits="objectBoundingBox">
          <path d={generateTearPath()} transform="scale(0.01)" />
        </clipPath>
      </defs>
    </svg>
  )
}

// 預定義的撕裂邊緣 clip-path（用於 CSS）
export const tearClipPathLeft = `polygon(
  0% 0%,
  100% 0%,
  102% 3%, 98% 7%, 101% 12%, 97% 18%, 103% 23%, 99% 28%, 101% 33%,
  98% 38%, 102% 43%, 97% 48%, 101% 53%, 99% 58%, 103% 63%, 98% 68%,
  101% 73%, 97% 78%, 102% 83%, 99% 88%, 101% 93%, 98% 97%, 100% 100%,
  0% 100%
)`

export const tearClipPathRight = `polygon(
  100% 0%,
  0% 0%,
  -2% 3%, 2% 7%, -1% 12%, 3% 18%, -3% 23%, 1% 28%, -1% 33%,
  2% 38%, -2% 43%, 3% 48%, -1% 53%, 1% 58%, -3% 63%, 2% 68%,
  -1% 73%, 3% 78%, -2% 83%, 1% 88%, -1% 93%, 2% 97%, 0% 100%,
  100% 100%
)`
```

**Step 2: Commit**

```bash
git add components/transitions/tear-mask.tsx
git commit -m "feat: add tear mask component with jagged edge clip-paths"
```

---

## Task 5: 建立主要過渡動畫元件

**Files:**
- Create: `components/transitions/claw-transition.tsx`

**Step 1: 建立豹爪撕裂過渡元件**

```tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ClawSvg } from "./claw-svg"
import { PaperFragments } from "./paper-fragments"
import { tearClipPathLeft, tearClipPathRight } from "./tear-mask"

type TransitionPhase = "idle" | "claw-enter" | "tearing" | "revealing" | "done"

interface ClawTransitionProps {
  targetHref: string
  trigger: boolean
  onComplete?: () => void
  children: React.ReactNode
}

export function ClawTransition({ targetHref, trigger, onComplete, children }: ClawTransitionProps) {
  const [phase, setPhase] = useState<TransitionPhase>("idle")
  const [showFragments, setShowFragments] = useState(false)
  const router = useRouter()

  const startTransition = useCallback(() => {
    if (phase !== "idle") return

    // 階段 1: 豹爪出現 (0.3s)
    setPhase("claw-enter")

    setTimeout(() => {
      // 階段 2: 撕裂畫面 (0.8s)
      setPhase("tearing")
      setShowFragments(true)
    }, 300)

    setTimeout(() => {
      // 階段 3: 展開露出 (0.6s)
      setPhase("revealing")
    }, 1100)

    setTimeout(() => {
      // 導航到目標頁面
      router.push(targetHref)
      setPhase("done")
      setShowFragments(false)
      onComplete?.()
    }, 1700)
  }, [phase, router, targetHref, onComplete])

  useEffect(() => {
    if (trigger && phase === "idle") {
      startTransition()
    }
  }, [trigger, phase, startTransition])

  return (
    <>
      {/* 原始內容 */}
      <div
        className="transition-content"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>

      {/* 過渡動畫覆蓋層 */}
      {phase !== "idle" && phase !== "done" && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* 豹爪 */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-32 h-48
              transition-all duration-300 ease-out
              ${phase === "claw-enter" ? "top-0 opacity-100" : ""}
              ${phase === "tearing" || phase === "revealing" ? "top-1/3 opacity-100" : ""}
              ${phase === "idle" ? "-top-48 opacity-0" : ""}
            `}
            style={{
              filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))",
            }}
          >
            <ClawSvg className="w-full h-full" />
          </div>

          {/* 撕裂效果 - 左半邊 */}
          <div
            className={`
              absolute inset-0 bg-black
              transition-transform duration-600 ease-in-out
              ${phase === "revealing" ? "-translate-x-full" : "translate-x-0"}
            `}
            style={{
              clipPath: phase === "tearing" || phase === "revealing" ? tearClipPathLeft : "none",
              transformOrigin: "left center",
            }}
          >
            {/* 複製原始畫面內容到左半邊 */}
            <div className="w-[200%] h-full overflow-hidden">
              {children}
            </div>
          </div>

          {/* 撕裂效果 - 右半邊 */}
          <div
            className={`
              absolute inset-0 bg-black
              transition-transform duration-600 ease-in-out
              ${phase === "revealing" ? "translate-x-full" : "translate-x-0"}
            `}
            style={{
              clipPath: phase === "tearing" || phase === "revealing" ? tearClipPathRight : "none",
              left: "50%",
              width: "50%",
              transformOrigin: "right center",
            }}
          >
            {/* 複製原始畫面內容到右半邊 */}
            <div className="w-[200%] h-full overflow-hidden -translate-x-1/2">
              {children}
            </div>
          </div>

          {/* 撕裂線發光效果 */}
          {(phase === "tearing" || phase === "revealing") && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full animate-pulse"
              style={{
                background: "linear-gradient(180deg, transparent 0%, rgba(168, 85, 247, 0.8) 20%, rgba(168, 85, 247, 0.8) 80%, transparent 100%)",
                boxShadow: "0 0 30px 10px rgba(168, 85, 247, 0.4)",
              }}
            />
          )}
        </div>
      )}

      {/* 紙張碎片 */}
      <PaperFragments isActive={showFragments} count={25} />
    </>
  )
}
```

**Step 2: Commit**

```bash
git add components/transitions/claw-transition.tsx
git commit -m "feat: add main claw transition component with three-phase animation"
```

---

## Task 6: 新增動畫 CSS

**Files:**
- Modify: `app/globals.css`

**Step 1: 在 globals.css 末尾加入過渡動畫樣式**

在檔案最後加入以下內容：

```css
/* ===== 豹爪撕裂過渡動畫 ===== */

/* 碎片飄落動畫 */
@keyframes fragment-fall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotate(720deg) scale(0.3);
  }
}

.animate-fragment-fall {
  animation: fragment-fall 1s ease-in forwards;
}

/* 豹爪進入動畫 */
@keyframes claw-enter {
  0% {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* 豹爪撕裂動畫 */
@keyframes claw-tear {
  0% {
    transform: translateX(-50%) translateY(0);
  }
  100% {
    transform: translateX(-50%) translateY(40vh);
  }
}

/* 撕裂線出現動畫 */
@keyframes tear-line-appear {
  0% {
    height: 0;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    height: 100%;
    opacity: 1;
  }
}

/* View Transitions API 自訂動畫 */
::view-transition-old(root) {
  animation: none;
}

::view-transition-new(root) {
  animation: none;
}

/* 過渡期間隱藏預設動畫 */
::view-transition-group(root) {
  animation-duration: 0s;
}

/* 撕裂動畫的 timing function */
.duration-600 {
  transition-duration: 600ms;
}

.ease-tear {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add CSS animations for claw transition effect"
```

---

## Task 7: 建立過渡觸發按鈕元件

**Files:**
- Create: `components/transitions/transition-link.tsx`

**Step 1: 建立可觸發過渡的連結元件**

```tsx
"use client"

import { useState, ReactNode } from "react"
import { ClawTransition } from "./claw-transition"

interface TransitionLinkProps {
  href: string
  children: ReactNode
  className?: string
  transitionContent?: ReactNode
}

export function TransitionLink({ href, children, className, transitionContent }: TransitionLinkProps) {
  const [isTriggered, setIsTriggered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsTriggered(true)
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      {isTriggered && (
        <ClawTransition
          targetHref={href}
          trigger={isTriggered}
          onComplete={() => setIsTriggered(false)}
        >
          {transitionContent || <div className="fixed inset-0 bg-black" />}
        </ClawTransition>
      )}
    </>
  )
}
```

**Step 2: Commit**

```bash
git add components/transitions/transition-link.tsx
git commit -m "feat: add TransitionLink component for easy transition triggering"
```

---

## Task 8: 建立 barrel export

**Files:**
- Create: `components/transitions/index.ts`

**Step 1: 建立統一匯出檔**

```typescript
export { ClawTransition } from "./claw-transition"
export { ClawSvg } from "./claw-svg"
export { PaperFragments } from "./paper-fragments"
export { TearMask, tearClipPathLeft, tearClipPathRight } from "./tear-mask"
export { TransitionLink } from "./transition-link"
```

**Step 2: Commit**

```bash
git add components/transitions/index.ts
git commit -m "feat: add barrel export for transition components"
```

---

## Task 9: 修改主頁面整合過渡動畫

**Files:**
- Modify: `app/page.tsx`

**Step 1: 修改主頁面的登入按鈕**

找到這段程式碼（約第 96-104 行）：

```tsx
<Link href="/login">
  <Button
    size="lg"
    className="h-14 px-10 text-base font-medium bg-white text-black hover:bg-gray-100 rounded-full shadow-xl shadow-white/10 transition-all duration-300 hover:scale-105 hover:shadow-white/20"
  >
    {language === "zh" ? "進入系統" : "Enter System"}
    <ArrowRight className="ml-2 h-5 w-5" />
  </Button>
</Link>
```

替換為：

```tsx
<TransitionButton language={language} />
```

**Step 2: 在檔案開頭加入 import**

在其他 import 之後加入：

```tsx
import { TransitionButton } from "@/components/transitions/transition-button"
```

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate claw transition on landing page login button"
```

---

## Task 10: 建立主頁專用的過渡按鈕

**Files:**
- Create: `components/transitions/transition-button.tsx`

**Step 1: 建立整合完整過渡邏輯的按鈕**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { ArrowRight } from "lucide-react"
import { ClawSvg } from "./claw-svg"
import { PaperFragments } from "./paper-fragments"
import { tearClipPathLeft, tearClipPathRight } from "./tear-mask"

type TransitionPhase = "idle" | "claw-enter" | "tearing" | "revealing" | "done"

interface TransitionButtonProps {
  language: string
}

export function TransitionButton({ language }: TransitionButtonProps) {
  const [phase, setPhase] = useState<TransitionPhase>("idle")
  const [showFragments, setShowFragments] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    if (phase !== "idle") return

    // 階段 1: 豹爪出現 (0.3s)
    setPhase("claw-enter")

    setTimeout(() => {
      // 階段 2: 撕裂畫面 (0.8s)
      setPhase("tearing")
      setShowFragments(true)
    }, 300)

    setTimeout(() => {
      // 階段 3: 展開露出 (0.6s)
      setPhase("revealing")
    }, 1100)

    setTimeout(() => {
      // 導航到登入頁面
      router.push("/login")
    }, 1700)
  }

  const isAnimating = phase !== "idle" && phase !== "done"

  return (
    <>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isAnimating}
        className="h-14 px-10 text-base font-medium bg-white text-black hover:bg-gray-100 rounded-full shadow-xl shadow-white/10 transition-all duration-300 hover:scale-105 hover:shadow-white/20"
      >
        {language === "zh" ? "進入系統" : "Enter System"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {/* 過渡動畫覆蓋層 */}
      {isAnimating && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* 豹爪 */}
          <div
            className={`
              absolute left-1/2 w-40 h-56 z-[110]
              transition-all ease-out
              ${phase === "claw-enter" ? "duration-300 top-0 -translate-x-1/2 -translate-y-0 opacity-100" : ""}
              ${phase === "tearing" ? "duration-800 top-[35%] -translate-x-1/2 -translate-y-1/2 opacity-100" : ""}
              ${phase === "revealing" ? "duration-300 top-[35%] -translate-x-1/2 -translate-y-1/2 opacity-0" : ""}
              ${phase === "idle" ? "-top-56 -translate-x-1/2 opacity-0" : ""}
            `}
            style={{
              filter: "drop-shadow(0 0 30px rgba(168, 85, 247, 0.6))",
            }}
          >
            <ClawSvg className="w-full h-full" />
          </div>

          {/* 左半邊撕裂 */}
          <div
            className={`
              absolute top-0 left-0 w-1/2 h-full bg-black overflow-hidden
              transition-transform ease-in-out
              ${phase === "revealing" ? "duration-600 -translate-x-full" : "duration-0 translate-x-0"}
            `}
            style={{
              clipPath: phase === "tearing" || phase === "revealing" ? tearClipPathLeft : "none",
            }}
          />

          {/* 右半邊撕裂 */}
          <div
            className={`
              absolute top-0 right-0 w-1/2 h-full bg-black overflow-hidden
              transition-transform ease-in-out
              ${phase === "revealing" ? "duration-600 translate-x-full" : "duration-0 translate-x-0"}
            `}
            style={{
              clipPath: phase === "tearing" || phase === "revealing" ? tearClipPathRight : "none",
            }}
          />

          {/* 撕裂線發光效果 */}
          {(phase === "tearing" || phase === "revealing") && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full z-[105]"
              style={{
                background: "linear-gradient(180deg, transparent 0%, rgba(168, 85, 247, 0.9) 15%, rgba(59, 130, 246, 0.9) 50%, rgba(168, 85, 247, 0.9) 85%, transparent 100%)",
                boxShadow: "0 0 40px 15px rgba(168, 85, 247, 0.5), 0 0 80px 30px rgba(59, 130, 246, 0.3)",
                animation: phase === "tearing" ? "tear-line-appear 0.8s ease-out forwards" : "none",
              }}
            />
          )}
        </div>
      )}

      {/* 紙張碎片 */}
      <PaperFragments isActive={showFragments} count={30} />
    </>
  )
}
```

**Step 2: 更新 barrel export**

在 `components/transitions/index.ts` 加入：

```typescript
export { TransitionButton } from "./transition-button"
```

**Step 3: Commit**

```bash
git add components/transitions/transition-button.tsx components/transitions/index.ts
git commit -m "feat: add TransitionButton with complete claw tear animation"
```

---

## Task 11: 最終整合與測試

**Files:**
- Modify: `app/page.tsx`

**Step 1: 確認 page.tsx 的完整修改**

確保 `app/page.tsx` 的 import 和按鈕部分正確：

開頭 imports（加入）：
```tsx
import { TransitionButton } from "@/components/transitions/transition-button"
```

移除：
```tsx
import Link from "next/link"  // 如果沒有其他地方用到可以保留
```

CTA 按鈕區塊（約第 95-114 行）修改為：

```tsx
{/* CTA Buttons */}
<div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
  <TransitionButton language={language} />
  <Link href="/about">
    <Button
      variant="outline"
      size="lg"
      className="h-14 px-10 text-base font-medium border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-full transition-all duration-300"
    >
      {t("learn_more")}
    </Button>
  </Link>
</div>
```

**Step 2: 執行開發伺服器測試**

```bash
cd D:\FRC報帳\Money && npm run dev
```

預期結果：
1. 訪問 http://localhost:3000
2. 點擊「進入系統」按鈕
3. 看到豹爪從上方出現
4. 豹爪向下移動，畫面從中間撕裂
5. 紙張碎片飄落
6. 左右兩半向外滑出
7. 自動跳轉到 /login 頁面

**Step 3: 最終 Commit**

```bash
git add app/page.tsx
git commit -m "feat: complete claw transition integration on landing page"
```

---

## 檔案清單總覽

建立的新檔案：
- `lib/hooks/use-view-transition.ts`
- `components/transitions/claw-svg.tsx`
- `components/transitions/paper-fragments.tsx`
- `components/transitions/tear-mask.tsx`
- `components/transitions/claw-transition.tsx`
- `components/transitions/transition-link.tsx`
- `components/transitions/transition-button.tsx`
- `components/transitions/index.ts`

修改的檔案：
- `app/globals.css` - 加入動畫 CSS
- `app/page.tsx` - 整合過渡按鈕
