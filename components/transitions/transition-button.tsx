"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { ArrowRight } from "lucide-react"
import { ClawSvg } from "./claw-svg"

type TransitionPhase = "idle" | "claw-enter" | "pulling" | "done"

interface TransitionButtonProps {
  language: string
}

// Animation timing constants
const CLAW_ENTER_DURATION = 300
const TEAR_DURATION = 2000
const NAVIGATION_DELAY = 2500
const TEAR_PROGRESS_SCALE = 220 // Scale factor for clip-path offset

// 簡單的偽隨機數生成器（基於種子）
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 生成更不規則的鋸齒效果 - 模擬真實紙張撕裂
function generateJaggedOffset(
  index: number,
  seed: number,
  baseDepth: number
): number {
  // 多層正弦波疊加，創建更自然的不規則感
  const wave1 = Math.sin(index * 0.4 + seed) * baseDepth * 0.3
  const wave2 = Math.sin(index * 1.1 + seed * 1.7) * baseDepth * 0.25
  const wave3 = Math.sin(index * 2.3 + seed * 3.2) * baseDepth * 0.2
  const wave4 = Math.sin(index * 4.7 + seed * 5.1) * baseDepth * 0.12
  const wave5 = Math.sin(index * 8.3 + seed * 11.7) * baseDepth * 0.08 // 高頻細節

  // 隨機尖刺效果 - 模擬紙張纖維斷裂
  const spikeChance = seededRandom(index * 3 + seed * 7)
  const spike = spikeChance > 0.82
    ? (seededRandom(index + seed * 11) - 0.5) * baseDepth * 0.8
    : 0

  // 大型撕裂 - 偶爾會有較大的不規則區域
  const bigTearChance = seededRandom(index * 7 + seed * 13)
  const bigTear = bigTearChance > 0.95
    ? (seededRandom(index * 2 + seed * 19) - 0.5) * baseDepth * 1.2
    : 0

  // 基礎隨機擾動
  const random = (seededRandom(index + seed) - 0.5) * baseDepth * 0.2

  // 區域性變化 - 某些區段的鋸齒更密集
  const regionalVariation = Math.sin(index * 0.15 + seed * 0.5) * baseDepth * 0.15

  return wave1 + wave2 + wave3 + wave4 + wave5 + spike + bigTear + random + regionalVariation
}

// 生成不規則鋸齒狀的 clip-path
// 撕裂方向：反斜線（＼）從右上往左下，揭開左上角露出登入頁面
// 覆蓋區域 = 撕裂線右下方
function generateJaggedDiagonalPath(
  progress: number, // 0 = 完全覆蓋, 1 = 完全露出
  segments: number = 50,
  jaggedDepth: number = 4, // 鋸齒深度（百分比）
  seed: number = 42
): string {
  if (progress >= 1) {
    // 完全露出 - 沒有覆蓋
    return "polygon(0% 0%, 0% 0%, 0% 0%)"
  }

  if (progress <= 0) {
    // 完全覆蓋
    return "polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)"
  }

  // Diagonal tear line: from (offset, 0) to (0, offset)
  // offset=0: covers entire screen, offset=200+: fully revealed
  const offset = progress * TEAR_PROGRESS_SCALE

  const points: string[] = []

  // 撕裂線沿著反斜線方向生成鋸齒邊緣
  for (let i = 0; i <= segments; i++) {
    const t = i / segments

    let baseX = offset * (1 - t)
    let baseY = offset * t

    const jaggedOffset = generateJaggedOffset(i, seed, jaggedDepth)

    // 鋸齒方向垂直於反斜線（45度）
    const perpX = jaggedOffset * 0.707
    const perpY = jaggedOffset * 0.707

    const x = baseX + perpX
    const y = baseY + perpY

    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  // 閉合多邊形：覆蓋撕裂線右下方的區域
  points.push("-10% 110%")
  points.push("110% 110%")
  points.push("110% -10%")

  return `polygon(${points.join(", ")})`
}

/** 撕開後露出的登入頁靜態預覽（與 app/login/page.tsx 視覺一致） */
function LoginPreview({ language }: { language: string }) {
  return (
    <div className="absolute inset-0 flex bg-background text-foreground">
      {/* 左半：工程圖框品牌面板 */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between border-r border-border p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <span className="relative z-10 ledger-label">BudgetFlow</span>
        <div className="relative z-10">
          <p className="font-mono text-sm text-primary mb-4 tracking-[0.2em] uppercase">
            FIRST Robotics Competition
          </p>
          <p className="text-7xl font-bold tracking-tight leading-none mb-2">FRC</p>
          <p className="font-mono text-7xl font-semibold tracking-tight leading-none mb-6">6998</p>
          <p className="font-mono text-xl tracking-[0.35em] text-muted-foreground uppercase">UNIPARDS</p>
          <div className="mt-8 h-px w-24 bg-primary" />
          <p className="mt-6 text-sm text-muted-foreground">
            {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
          </p>
        </div>
        <div className="relative z-10 border border-border bg-card/80 rounded-md overflow-hidden max-w-xs">
          <div className="grid grid-cols-[auto_1fr] text-xs font-mono">
            <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">Team</span>
            <span className="px-3 py-1.5 border-b border-border">FRC 6998 UNIPARDS</span>
            <span className="px-3 py-1.5 border-r border-border text-muted-foreground uppercase tracking-wider">System</span>
            <span className="px-3 py-1.5">BudgetFlow</span>
          </div>
        </div>
      </div>

      {/* 右半：登入表單骨架 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-12">
            <p className="text-4xl font-bold tracking-tight">
              FRC <span className="font-mono text-primary">6998</span>
            </p>
          </div>
          <p className="text-2xl font-semibold mb-2">
            {language === "zh" ? "歡迎回來" : "Welcome back"}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {language === "zh" ? "輸入你的帳號密碼登入系統" : "Enter your credentials to login"}
          </p>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">{language === "zh" ? "電子郵件" : "Email"}</p>
              <div className="h-12 rounded-md border border-input bg-card flex items-center px-3">
                <span className="text-muted-foreground/70 text-base">name@example.com</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{language === "zh" ? "密碼" : "Password"}</p>
              <div className="h-12 rounded-md border border-input bg-card flex items-center px-3">
                <span className="text-muted-foreground/70 text-base">{language === "zh" ? "輸入密碼" : "Enter password"}</span>
              </div>
            </div>
            <div className="h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-base font-medium">
              {language === "zh" ? "登入" : "Login"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 被撕開的首頁靜態複本（與 app/page.tsx 視覺一致） */
function LandingCover({ language }: { language: string }) {
  return (
    <div className="absolute inset-0 bg-background text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-6 left-6">
        <span className="ledger-label">BudgetFlow</span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-4xl">
          <p className="font-mono text-sm text-primary tracking-[0.25em] uppercase">
            FIRST Robotics Competition
          </p>
          <div>
            <span className="block text-8xl md:text-9xl lg:text-[11rem] font-bold tracking-tight leading-none">
              FRC
            </span>
            <span className="block font-mono text-8xl md:text-9xl lg:text-[11rem] font-semibold tracking-tight leading-none -mt-2 md:-mt-4 text-primary">
              6998
            </span>
          </div>
          <p className="font-mono text-xl md:text-2xl tracking-[0.35em] text-muted-foreground uppercase">
            UNIPARDS
          </p>
          <div className="flex items-center justify-center py-2">
            <div className="h-px w-24 bg-primary" />
          </div>
          <p className="text-lg md:text-xl text-muted-foreground">
            {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
          </p>
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <div className="h-12 px-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-base font-medium">
            {language === "zh" ? "進入系統" : "Enter System"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
          <div className="h-12 px-8 rounded-md border border-border bg-card flex items-center justify-center text-base font-medium">
            {language === "zh" ? "了解更多" : "Learn More"}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TransitionButton({ language }: TransitionButtonProps) {
  const [phase, setPhase] = useState<TransitionPhase>("idle")
  const [tearProgress, setTearProgress] = useState(0)

  // 生成固定的鋸齒種子，確保動畫過程中形狀一致
  const jaggedSeed = useMemo(() => Math.floor(Math.random() * 1000), [])

  // 使用 useRef 來追蹤計時器和動畫幀，以便清理
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  // 清理所有計時器和動畫幀
  const cleanup = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    isAnimatingRef.current = false
  }, [])

  // 組件卸載時清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const handleClick = () => {
    if (phase !== "idle" || isAnimatingRef.current) return

    isAnimatingRef.current = true

    // 階段 1: 豹爪出現在左上角 (0.3s)
    setPhase("claw-enter")

    const pullingTimeout = setTimeout(() => {
      if (!isAnimatingRef.current) return

      setPhase("pulling")

      const startTime = Date.now()

      const animate = () => {
        if (!isAnimatingRef.current) return

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / TEAR_DURATION, 1)

        // easeInOutCubic easing function
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        setTearProgress(eased)

        if (progress < 1 && isAnimatingRef.current) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }, CLAW_ENTER_DURATION)
    timeoutsRef.current.push(pullingTimeout)

    const navigationTimeout = setTimeout(() => {
      if (!isAnimatingRef.current) return

      setPhase("done")
      cleanup()
      window.location.href = "/login"
    }, NAVIGATION_DELAY)
    timeoutsRef.current.push(navigationTimeout)
  }

  // 監聽頁面可見性變化，如果用戶返回則重置狀態
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && phase !== "idle") {
        cleanup()
        setPhase("idle")
        setTearProgress(0)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [phase, cleanup])

  // Keep animation overlay visible until browser navigates to /login
  const isAnimating = phase !== "idle"

  // 計算不規則鋸齒狀的 clip-path
  const jaggedClipPath = useMemo(() => {
    return generateJaggedDiagonalPath(tearProgress, 100, 7, jaggedSeed)
  }, [tearProgress, jaggedSeed])

  return (
    <>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isAnimating}
        className="relative z-10 h-12 px-8 text-base font-medium cursor-pointer"
      >
        {language === "zh" ? "進入系統" : "Enter System"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {/* 過渡動畫覆蓋層 */}
      {isAnimating && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
          {/* 登入頁面預覽 - 在最底層，撕開後露出 */}
          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            <LoginPreview language={language} />
          </div>

          {/* Claw follows the tear line midpoint */}
          <ClawOverlay phase={phase} tearProgress={tearProgress} />

          {/* 被拉開的首頁覆蓋層 */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: 10,
              clipPath: jaggedClipPath,
            }}
          >
            <LandingCover language={language} />

            {/* 撕裂邊緣陰影 - 沿撕裂線的深度感 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(
                  135deg,
                  transparent 0%,
                  transparent ${Math.max(0, 45 - tearProgress * 50)}%,
                  rgba(0, 0, 0, 0.25) ${50 - tearProgress * 50}%,
                  rgba(0, 0, 0, 0.35) ${52 - tearProgress * 50}%,
                  transparent ${55 - tearProgress * 50}%,
                  transparent 100%
                )`,
              }}
            />
          </div>

          {/* 撕裂邊緣線（琥珀） */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 20, overflow: "visible" }}
          >
            {phase === "pulling" && (
              <TearEdgeLine progress={tearProgress} seed={jaggedSeed} />
            )}
          </svg>
        </div>
      )}
    </>
  )
}

// 撕裂邊緣線組件：琥珀色三層線，無濾鏡無粒子
function TearEdgeLine({ progress, seed }: { progress: number; seed: number }) {
  // 安全獲取視窗尺寸（SSR 兼容）
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const pathData = useMemo(() => {
    const segments = 80
    const jaggedDepth = 25

    const points: string[] = []
    const offset = progress * TEAR_PROGRESS_SCALE

    for (let i = 0; i <= segments; i++) {
      const t = i / segments

      const baseXPercent = offset * (1 - t)
      const baseYPercent = offset * t

      const baseX = (baseXPercent / 100) * dimensions.width
      const baseY = (baseYPercent / 100) * dimensions.height

      const wave1 = Math.sin(i * 0.5 + seed) * jaggedDepth * 0.4
      const wave2 = Math.sin(i * 1.3 + seed * 1.7) * jaggedDepth * 0.3
      const wave3 = Math.sin(i * 2.7 + seed * 3.1) * jaggedDepth * 0.2
      const wave4 = Math.sin(i * 5.3 + seed * 7.1) * jaggedDepth * 0.1

      const spikeChance = seededRandom(i * 5 + seed * 13)
      const spike = spikeChance > 0.88 ? (seededRandom(i + seed * 17) - 0.5) * jaggedDepth * 0.5 : 0
      const randomJag = (seededRandom(i + seed) - 0.5) * jaggedDepth * 0.25

      const perpOffset = wave1 + wave2 + wave3 + wave4 + spike + randomJag
      const x = baseX + perpOffset * 0.707
      const y = baseY + perpOffset * 0.707

      if (i === 0) {
        points.push(`M ${x} ${y}`)
      } else {
        points.push(`L ${x} ${y}`)
      }
    }

    return points.join(" ")
  }, [progress, seed, dimensions.width, dimensions.height])

  return (
    <g>
      {/* 外層柔光 */}
      <path
        d={pathData}
        fill="none"
        stroke="hsl(26 95% 55% / 0.25)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "blur(6px)" }}
      />
      {/* 琥珀主線 */}
      <path
        d={pathData}
        fill="none"
        stroke="hsl(26 95% 55%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 中心亮線 */}
      <path
        d={pathData}
        fill="none"
        stroke="hsl(40 30% 96% / 0.9)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

// Claw overlay component - follows the tear line midpoint
function ClawOverlay({ phase, tearProgress }: { phase: TransitionPhase; tearProgress: number }) {
  const isEntering = phase === "claw-enter"
  // Tear line midpoint: offset/2 = tearProgress * 110
  const midpoint = tearProgress * (TEAR_PROGRESS_SCALE / 2)

  return (
    <div
      className="absolute w-36 h-48 text-foreground"
      style={{
        zIndex: 50,
        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45))",
        top: isEntering ? "-80px" : `calc(${midpoint}% - 100px)`,
        left: isEntering ? "-80px" : `calc(${midpoint}% - 80px)`,
        opacity: 1,
        transform: "rotate(135deg)",
        transition: isEntering
          ? "top 300ms ease-out, left 300ms ease-out, opacity 300ms"
          : "opacity 300ms",
      }}
    >
      <ClawSvg className="w-full h-full" />
    </div>
  )
}
