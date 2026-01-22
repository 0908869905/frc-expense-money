"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { ArrowRight } from "lucide-react"
import { ClawSvg } from "./claw-svg"

type TransitionPhase = "idle" | "claw-enter" | "pulling" | "done"

interface TransitionButtonProps {
  language: string
}

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

  // 撕裂線是反斜線方向（＼），從 (offset, 0) 到 (0, offset)
  // offset 從 0 增加到 200+
  // 當 offset = 0：線在左上角點，覆蓋整個畫面
  // 當 offset = 100：線是反對角線，覆蓋右下半部
  // 當 offset = 200：線離開畫面，完全露出
  const offset = progress * 220 // 稍微超過 200 確保完全離開

  const points: string[] = []

  // 撕裂線沿著反斜線方向生成鋸齒邊緣
  // 從 (offset, 0) 往 (0, offset) 方向
  for (let i = 0; i <= segments; i++) {
    const t = i / segments

    // 反斜線：x + y = offset
    // 參數化：x = offset * (1-t), y = offset * t
    // 但需要限制在畫面邊緣內
    let baseX = offset * (1 - t)
    let baseY = offset * t

    // 使用改進的鋸齒生成函數
    const jaggedOffset = generateJaggedOffset(i, seed, jaggedDepth)

    // 鋸齒方向垂直於反斜線（45度）
    // 反斜線方向是 (-1, 1)，垂直方向是 (1, 1) / sqrt(2)
    const perpX = jaggedOffset * 0.707
    const perpY = jaggedOffset * 0.707

    const x = baseX + perpX
    const y = baseY + perpY

    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  // 閉合多邊形：覆蓋撕裂線右下方的區域
  // 從撕裂線末端 -> 左下角 -> 右下角 -> 右上角 -> 撕裂線起點
  points.push("-10% 110%")
  points.push("110% 110%")
  points.push("110% -10%")

  return `polygon(${points.join(", ")})`
}

// 生成撕裂粒子
interface TearParticle {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  velocityX: number
  velocityY: number
  opacity: number
  delay: number
}

function generateTearParticles(count: number, seed: number): TearParticle[] {
  const particles: TearParticle[] = []

  for (let i = 0; i < count; i++) {
    // 粒子沿著反斜線分布（從右上到左下）
    const t = i / count // 沿著反斜線的位置
    // 反斜線：x 從大到小，y 從小到大
    // 假設中間位置 offset = 100，線從 (100, 0) 到 (0, 100)
    const diagX = 100 * (1 - t) // 從右往左
    const diagY = 100 * t // 從上往下

    // 在對角線附近隨機偏移
    const offsetRange = 15
    const offsetX = (seededRandom(i * 2 + seed) - 0.5) * offsetRange
    const offsetY = (seededRandom(i * 3 + seed) - 0.5) * offsetRange

    particles.push({
      id: i,
      x: diagX + offsetX,
      y: diagY + offsetY,
      size: 2 + seededRandom(i + seed * 5) * 6,
      rotation: seededRandom(i * 7 + seed) * 360,
      // 粒子往右下飛散（被撕開的方向）
      velocityX: 50 + seededRandom(i * 11 + seed) * 80,
      velocityY: 50 + seededRandom(i * 13 + seed) * 80,
      opacity: 0.5 + seededRandom(i * 17 + seed) * 0.5,
      delay: t * 0.8, // 根據位置延遲，創造波浪效果
    })
  }

  return particles
}

export function TransitionButton({ language }: TransitionButtonProps) {
  const [phase, setPhase] = useState<TransitionPhase>("idle")
  const [tearProgress, setTearProgress] = useState(0)

  // 生成固定的鋸齒種子，確保動畫過程中形狀一致
  const jaggedSeed = useMemo(() => Math.floor(Math.random() * 1000), [])

  // 生成撕裂粒子
  const particles = useMemo(() => generateTearParticles(25, jaggedSeed), [jaggedSeed])

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

      // 階段 2: 豹爪往右下拉開畫面 (2s)
      setPhase("pulling")

      // 開始撕裂動畫
      const startTime = Date.now()
      const duration = 2000

      const animate = () => {
        if (!isAnimatingRef.current) return

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用 easeInOutCubic 緩動函數
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        setTearProgress(eased)

        if (progress < 1 && isAnimatingRef.current) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }, 300)
    timeoutsRef.current.push(pullingTimeout)

    const navigationTimeout = setTimeout(() => {
      if (!isAnimatingRef.current) return

      // 階段 3: 動畫完成，導航到登入頁面
      setPhase("done")
      cleanup()
      window.location.href = "/login"
    }, 2500)
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

  const isAnimating = phase !== "idle" && phase !== "done"

  // 計算不規則鋸齒狀的 clip-path - 使用更多段數和更大的鋸齒深度
  const jaggedClipPath = useMemo(() => {
    return generateJaggedDiagonalPath(tearProgress, 100, 7, jaggedSeed)
  }, [tearProgress, jaggedSeed])

  return (
    <>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isAnimating}
        className="relative z-10 h-14 px-10 text-base font-medium bg-white text-black hover:bg-gray-100 rounded-full shadow-xl shadow-white/10 transition-all duration-300 hover:scale-105 hover:shadow-white/20 cursor-pointer"
      >
        {language === "zh" ? "進入系統" : "Enter System"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {/* 過渡動畫覆蓋層 */}
      {isAnimating && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
          {/* 登入頁面內容 - 在最底層，撕開後露出 */}
          <div
            className="absolute inset-0 w-full h-full bg-black"
            style={{ zIndex: 1 }}
          >
            {/* 登入頁面背景 */}
            <div className="absolute inset-0">
              {/* Left Side - Artistic Visual (hidden on mobile) */}
              <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-1/2 items-center justify-center">
                <div className="absolute inset-0">
                  {/* Large gradient orbs */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/50 via-blue-600/40 to-cyan-500/30 blur-3xl animate-pulse" />
                    <div className="absolute inset-[80px] rounded-full bg-gradient-to-tr from-pink-500/40 via-purple-500/30 to-transparent blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
                  </div>
                  {/* Accent lights */}
                  <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-purple-500/40 blur-3xl" />
                  <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-blue-500/30 blur-3xl" />
                </div>

                {/* Hero Text */}
                <div className="relative z-10 text-center px-12">
                  <h1 className="text-7xl font-black tracking-tighter leading-none mb-4">
                    <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                      FRC
                    </span>
                  </h1>
                  <h1 className="text-7xl font-black tracking-tighter leading-none mb-8">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                      6998
                    </span>
                  </h1>
                  <p className="text-xl tracking-[0.3em] text-gray-400 uppercase font-light">
                    UNIPARDS
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500/50" />
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/50" />
                  </div>
                  <p className="mt-8 text-gray-500 text-sm">
                    {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
                  </p>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 flex flex-col">
                {/* Background for mobile */}
                <div className="absolute inset-0 lg:hidden">
                  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-transparent blur-3xl" />
                </div>

                {/* Language Switcher */}
                <div className="absolute top-6 right-6 z-50">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <span className="text-sm text-white/80">{language === "zh" ? "中" : "EN"}</span>
                  </div>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 relative z-10">
                  <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-12">
                      <h1 className="text-5xl font-black tracking-tighter">
                        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">FRC </span>
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">6998</span>
                      </h1>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-10">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {language === "zh" ? "歡迎回來" : "Welcome back"}
                      </h2>
                      <p className="text-gray-400">
                        {language === "zh" ? "輸入你的帳號密碼登入系統" : "Enter your credentials to login"}
                      </p>
                    </div>

                    {/* Login Form */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{language === "zh" ? "電子郵件" : "Email"}</label>
                        <div className="h-14 bg-white/5 border border-white/10 rounded-xl flex items-center px-4">
                          <span className="text-gray-500">{language === "zh" ? "name@example.com" : "name@example.com"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{language === "zh" ? "密碼" : "Password"}</label>
                        <div className="h-14 bg-white/5 border border-white/10 rounded-xl flex items-center px-4">
                          <span className="text-gray-500">{language === "zh" ? "輸入密碼" : "Enter password"}</span>
                        </div>
                      </div>
                      <div className="h-14 bg-white text-black rounded-xl flex items-center justify-center font-medium">
                        {language === "zh" ? "登入" : "Login"} →
                      </div>
                    </div>

                    {/* Register Link */}
                    <div className="mt-10 text-center">
                      <p className="text-gray-500">
                        {language === "zh" ? "還沒有帳號？" : "Don't have an account?"}{" "}
                        <span className="text-white font-medium">{language === "zh" ? "立即註冊" : "Register now"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="py-6 px-6 text-center">
                  <p className="text-xs text-gray-600">© 2024 FRC6998 保留所有權利。</p>
                </div>
              </div>
            </div>
          </div>
          {/* 豹爪 - 跟隨撕裂線中點移動 */}
          {/* 撕裂線是反斜線：從 (offset, 0) 到 (0, offset)，中點在 (offset/2, offset/2) */}
          <div
            className="absolute w-36 h-48"
            style={{
              zIndex: 50,
              filter: "drop-shadow(0 0 25px rgba(168, 85, 247, 0.8))",
              // 撕裂線中點位置：offset = tearProgress * 220
              // 中點 = (offset/2, offset/2) = (tearProgress * 110, tearProgress * 110)
              top: phase === "claw-enter"
                ? "-80px"
                : `calc(${tearProgress * 110}% - 100px)`,
              left: phase === "claw-enter"
                ? "-80px"
                : `calc(${tearProgress * 110}% - 80px)`,
              opacity: 1,
              // 爪子旋轉使其指向撕裂方向（右下）
              transform: "rotate(135deg)",
              transition: phase === "claw-enter"
                ? "top 300ms ease-out, left 300ms ease-out, opacity 300ms"
                : "opacity 300ms",
            }}
          >
            <ClawSvg className="w-full h-full" />
          </div>

          {/* 被拉開的頁面覆蓋層 - 完整首頁樣式 */}
          <div
            className="absolute inset-0 bg-black"
            style={{
              zIndex: 10,
              clipPath: jaggedClipPath,
            }}
          >
            {/* 完整首頁背景效果 */}
            <div className="absolute inset-0">
              {/* Large gradient circle - artistic focal point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/40 via-blue-600/30 to-cyan-500/20 blur-3xl animate-pulse" />
                <div className="absolute inset-[100px] rounded-full bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-transparent blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
              </div>
              {/* Accent lights */}
              <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-purple-500/30 blur-3xl" />
              <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl" />
              {/* Subtle noise texture */}
              <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
            </div>

            {/* 語言切換器位置 */}
            <div className="absolute top-6 right-6 z-50">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-sm text-white/80">EN</span>
              </div>
            </div>

            {/* 首頁主要內容 - FRC 6998 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              {/* Main Title */}
              <h1 className="relative text-center">
                <span className="block text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-none">
                  <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
                    FRC
                  </span>
                </span>
                <span className="block text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-none -mt-4 md:-mt-8">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    6998
                  </span>
                </span>
              </h1>

              {/* Team English Name */}
              <p className="text-2xl md:text-3xl font-light tracking-[0.3em] text-gray-400 uppercase mt-6">
                UNIPARDS
              </p>

              {/* Divider */}
              <div className="flex items-center justify-center gap-4 py-4 mt-2">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
              </div>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-gray-400 font-light">
                {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
              </p>

              {/* CTA Buttons - 與首頁一致 */}
              <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                <div className="h-14 px-10 text-base font-medium bg-white text-black rounded-full shadow-xl shadow-white/10 flex items-center justify-center">
                  {language === "zh" ? "進入系統" : "Enter System"}
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div className="h-14 px-10 text-base font-medium border border-white/20 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                  {language === "zh" ? "了解更多" : "Learn More"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 py-6">
              <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-6 mx-auto">
                <p className="text-xs text-gray-500">© 2024 FRC6998 保留所有權利。</p>
                <nav className="flex gap-6">
                  <span className="text-xs text-gray-500">服務條款</span>
                  <span className="text-xs text-gray-500">隱私政策</span>
                </nav>
              </div>
            </div>

            {/* 撕裂邊緣陰影效果 - 增加深度感 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(
                  135deg,
                  transparent 0%,
                  transparent ${Math.max(0, 45 - tearProgress * 50)}%,
                  rgba(0, 0, 0, 0.4) ${50 - tearProgress * 50}%,
                  rgba(0, 0, 0, 0.6) ${52 - tearProgress * 50}%,
                  transparent ${55 - tearProgress * 50}%,
                  transparent 100%
                )`,
              }}
            />
          </div>

          {/* 紙張翻捲高光效果 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 11,
              background: `linear-gradient(
                135deg,
                transparent 0%,
                transparent ${Math.max(0, 43 - tearProgress * 50)}%,
                rgba(255, 255, 255, 0.08) ${47 - tearProgress * 50}%,
                rgba(255, 255, 255, 0.15) ${49 - tearProgress * 50}%,
                rgba(255, 255, 255, 0.08) ${51 - tearProgress * 50}%,
                transparent ${53 - tearProgress * 50}%,
                transparent 100%
              )`,
              clipPath: jaggedClipPath,
            }}
          />

          {/* 對角線發光撕裂邊緣效果 */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 20, overflow: "visible" }}
          >
            <defs>
              {/* 增強的發光濾鏡 */}
              <filter id="tear-glow-filter" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="rgba(168, 85, 247, 1)" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 銳利邊緣濾鏡 */}
              <filter id="sharp-edge-filter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* 動態漸層 */}
              <linearGradient id="tear-edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(147, 51, 234, 1)">
                  <animate attributeName="stop-color"
                    values="rgba(147, 51, 234, 1);rgba(59, 130, 246, 1);rgba(147, 51, 234, 1)"
                    dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="rgba(59, 130, 246, 1)">
                  <animate attributeName="stop-color"
                    values="rgba(59, 130, 246, 1);rgba(147, 51, 234, 1);rgba(59, 130, 246, 1)"
                    dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="rgba(147, 51, 234, 1)">
                  <animate attributeName="stop-color"
                    values="rgba(147, 51, 234, 1);rgba(59, 130, 246, 1);rgba(147, 51, 234, 1)"
                    dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>

              {/* 電流效果漸層 */}
              <linearGradient id="electric-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="45%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 1)" />
                <stop offset="55%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>
            </defs>

            {/* 發光的撕裂邊緣線 */}
            {phase === "pulling" && (
              <TearEdgeLine progress={tearProgress} seed={jaggedSeed} />
            )}
          </svg>

          {/* 撕裂粒子效果 - 沿著撕裂線分布 */}
          {phase === "pulling" && particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                zIndex: 30,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size * (0.5 + seededRandom(particle.id) * 0.8), // 不規則形狀
                background: `linear-gradient(${particle.rotation}deg,
                  rgba(168, 85, 247, ${particle.opacity}) 0%,
                  rgba(59, 130, 246, ${particle.opacity * 0.8}) 50%,
                  rgba(255, 255, 255, ${particle.opacity * 0.3}) 100%)`,
                borderRadius: seededRandom(particle.id * 3) > 0.5 ? "2px" : "1px",
                transform: `rotate(${particle.rotation}deg)`,
                animation: `tear-particle-fall 1.8s ease-out ${particle.delay}s forwards,
                           particle-sparkle 0.5s ease-in-out ${particle.delay}s infinite`,
                opacity: 0,
                boxShadow: `
                  0 0 ${particle.size * 1.5}px rgba(168, 85, 247, 0.6),
                  0 0 ${particle.size * 0.5}px rgba(255, 255, 255, 0.8)
                `,
              }}
            />
          ))}

          {/* 額外的閃光粒子 - 更小更亮（沿著反斜線分佈） */}
          {phase === "pulling" && Array.from({ length: 15 }).map((_, i) => {
            const t = i / 15
            // 反斜線方向：x 從右往左，y 從上往下
            const x = 100 * (1 - t) + (seededRandom(i * 100 + jaggedSeed) - 0.5) * 10
            const y = 100 * t + (seededRandom(i * 101 + jaggedSeed) - 0.5) * 10
            return (
              <div
                key={`spark-${i}`}
                className="absolute pointer-events-none rounded-full"
                style={{
                  zIndex: 35,
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 2 + seededRandom(i + jaggedSeed) * 3,
                  height: 2 + seededRandom(i + jaggedSeed) * 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  animation: `tear-particle-fall 1.2s ease-out ${t * 0.6}s forwards`,
                  opacity: 0,
                  boxShadow: "0 0 8px rgba(255, 255, 255, 1), 0 0 15px rgba(168, 85, 247, 0.8)",
                }}
              />
            )
          })}
        </div>
      )}

      {/* 動畫完成後的登入頁面 iframe - 可接收點擊 */}
      {phase === "done" && (
        <iframe
          src="/login"
          className="fixed inset-0 w-full h-full z-[100] border-0"
          style={{ pointerEvents: "auto" }}
          title="Login Page"
        />
      )}
    </>
  )
}

// 撕裂邊緣線組件 - 增強版，帶有多層發光效果
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
    const segments = 80 // 增加段數以獲得更細膩的鋸齒
    const jaggedDepth = 25 // 增加鋸齒深度

    const points: string[] = []
    const offset = progress * 220 // 與 clip-path 一致

    for (let i = 0; i <= segments; i++) {
      const t = i / segments

      // 反斜線方向：從 (offset, 0) 到 (0, offset)
      // 參數化：x = offset * (1-t), y = offset * t
      const baseXPercent = offset * (1 - t)
      const baseYPercent = offset * t

      // 轉換為像素座標
      const baseX = (baseXPercent / 100) * dimensions.width
      const baseY = (baseYPercent / 100) * dimensions.height

      // 增強的鋸齒效果 - 多層波形疊加
      const wave1 = Math.sin(i * 0.5 + seed) * jaggedDepth * 0.4
      const wave2 = Math.sin(i * 1.3 + seed * 1.7) * jaggedDepth * 0.3
      const wave3 = Math.sin(i * 2.7 + seed * 3.1) * jaggedDepth * 0.2
      const wave4 = Math.sin(i * 5.3 + seed * 7.1) * jaggedDepth * 0.1 // 高頻細節

      // 隨機尖刺
      const spikeChance = seededRandom(i * 5 + seed * 13)
      const spike = spikeChance > 0.88 ? (seededRandom(i + seed * 17) - 0.5) * jaggedDepth * 0.5 : 0

      // 基礎隨機擾動
      const randomJag = (seededRandom(i + seed) - 0.5) * jaggedDepth * 0.25

      const perpOffset = wave1 + wave2 + wave3 + wave4 + spike + randomJag
      // 垂直於反斜線的偏移方向：(1, 1) / sqrt(2)
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
      {/* 最外層大範圍光暈 */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(168, 85, 247, 0.15)"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "blur(15px)" }}
      />
      {/* 中層光暈 */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "blur(8px)" }}
      />
      {/* 內層發光 */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(168, 85, 247, 0.6)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "blur(3px)" }}
      />
      {/* 核心亮線 */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#tear-edge-gradient)"
        strokeWidth="3"
        filter="url(#tear-glow-filter)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 最亮的中心 */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}
