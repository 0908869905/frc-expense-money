"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Check, Loader2 } from "lucide-react"

interface LoadingStep {
  id: string
  labelZh: string
  labelEn: string
}

const LOADING_STEPS: LoadingStep[] = [
  { id: "auth", labelZh: "驗證身份", labelEn: "Authenticating" },
  { id: "user", labelZh: "載入使用者資料", labelEn: "Loading user data" },
  { id: "dashboard", labelZh: "準備儀表板", labelEn: "Preparing dashboard" },
  { id: "sync", labelZh: "同步最新資訊", labelEn: "Syncing information" },
]

const FUN_FACTS_ZH = [
  "💡 你知道嗎？FRC 6998 UNIPARDS 來自台灣！",
  "🤖 機器人賽季充滿挑戰與創意",
  "💰 透明的財務管理讓團隊更有效率",
  "🏆 每一筆支出都是邁向冠軍的一步",
  "⚡ 報帳系統讓財務流程更順暢",
]

const FUN_FACTS_EN = [
  "💡 Did you know? FRC 6998 UNIPARDS is from Taiwan!",
  "🤖 Robotics season is full of challenges and creativity",
  "💰 Transparent finance makes team more efficient",
  "🏆 Every expense is a step towards championship",
  "⚡ This system streamlines financial workflows",
]

export interface LoginResult {
  success: boolean
  error?: string
}

interface LoadingScreenProps {
  language: string
  onComplete: (result: LoginResult) => void
  loginPromise: Promise<LoginResult>
}

// 偽隨機數生成器
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function LoadingScreen({ language, onComplete, loginPromise }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showContent, setShowContent] = useState(false)
  const [funFactIndex, setFunFactIndex] = useState(0)
  const [letterRevealCount, setLetterRevealCount] = useState(0)
  const [loginComplete, setLoginComplete] = useState(false)
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const funFacts = language === "zh" ? FUN_FACTS_ZH : FUN_FACTS_EN
  const teamName = "UNIPARDS"

  // 生成隨機粒子
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: seededRandom(i * 3) * 100,
      y: seededRandom(i * 7) * 100,
      size: 2 + seededRandom(i * 11) * 4,
      duration: 15 + seededRandom(i * 13) * 20,
      delay: seededRandom(i * 17) * 10,
      opacity: 0.1 + seededRandom(i * 19) * 0.3,
    }))
  }, [])

  // 生成電路線條
  const circuitLines = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      angle: i * 45,
      length: 80 + seededRandom(i * 23) * 120,
      delay: i * 0.15,
    }))
  }, [])

  // 監聽登入 Promise
  useEffect(() => {
    loginPromise.then((result) => {
      setLoginResult(result)
      setLoginComplete(true)
    })
  }, [loginPromise])

  // 初始動畫：顯示內容
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // UNIPARDS 字母逐一顯示
  useEffect(() => {
    if (!showContent) return

    const interval = setInterval(() => {
      setLetterRevealCount(prev => {
        if (prev >= teamName.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [showContent])

  // 進度控制 - 根據登入狀態調整速度
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        // 如果登入已完成，快速推進到 100%
        if (loginComplete) {
          if (prev >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
            }
            return 100
          }
          return Math.min(prev + 5, 100) // 快速完成
        }

        // 登入未完成時，緩慢推進到 80%
        if (prev >= 80) {
          return prev // 停在 80% 等待登入
        }
        return prev + 1
      })
    }, loginComplete ? 30 : 50)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [loginComplete])

  // 步驟進度 - 根據百分比計算當前步驟
  useEffect(() => {
    const totalSteps = LOADING_STEPS.length
    const stepProgress = Math.floor((progress / 100) * totalSteps)
    setCurrentStep(Math.min(stepProgress, totalSteps))
  }, [progress])

  // 趣味提示輪播
  useEffect(() => {
    const interval = setInterval(() => {
      setFunFactIndex(prev => (prev + 1) % funFacts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [funFacts.length])

  // 完成後回調
  useEffect(() => {
    if (progress >= 100 && loginResult) {
      const timer = setTimeout(() => {
        onComplete(loginResult)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, loginResult, onComplete])

  const t = (zh: string, en: string) => language === "zh" ? zh : en

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden">
      {/* 背景漸層光暈 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-cyan-500/15 blur-3xl animate-pulse" />
          <div
            className="absolute inset-[120px] rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-500/15 to-transparent blur-2xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
        {/* 角落光暈 */}
        <div className="absolute top-20 left-20 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      {/* 浮動粒子 */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-cyan-400/50"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            animation: `float-particle ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* 電路線條動畫 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
        {circuitLines.map(line => (
          <div
            key={line.id}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              transform: `rotate(${line.angle}deg)`,
              width: line.length,
              height: 2,
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-500/60 via-blue-500/40 to-transparent"
              style={{
                animation: `circuit-extend 2s ease-out forwards`,
                animationDelay: `${line.delay + 0.3}s`,
                transform: 'scaleX(0)',
                transformOrigin: 'left',
              }}
            />
            {/* 電路節點 */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400"
              style={{
                animation: `node-appear 0.3s ease-out forwards`,
                animationDelay: `${line.delay + 1.5}s`,
                opacity: 0,
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
              }}
            />
          </div>
        ))}
      </div>

      {/* 主要內容 */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo */}
        <div className="relative mb-4">
          <div className="text-center">
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none mb-2">
              <span
                className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.5))',
                  animation: 'logo-glow 3s ease-in-out infinite',
                }}
              >
                FRC
              </span>
            </h1>
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none">
              <span
                className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(236, 72, 153, 0.4))',
                  animation: 'logo-glow 3s ease-in-out infinite',
                  animationDelay: '0.5s',
                }}
              >
                6998
              </span>
            </h1>
          </div>

          {/* Logo 光環效果 */}
          <div
            className="absolute inset-0 -z-10 blur-2xl opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* UNIPARDS 字母逐一顯示 */}
        <div className="mb-8">
          <p className="text-2xl md:text-3xl tracking-[0.4em] text-gray-400 uppercase font-light">
            {teamName.split('').map((letter, i) => (
              <span
                key={i}
                className={`inline-block transition-all duration-300 ${
                  i < letterRevealCount
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{
                  transitionDelay: `${i * 50}ms`,
                  color: i < letterRevealCount ? 'rgb(156, 163, 175)' : 'transparent',
                }}
              >
                {letter}
              </span>
            ))}
          </p>
        </div>

        {/* 分隔線 */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
          <div
            className="w-2 h-2 rounded-full bg-purple-500"
            style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}
          />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
        </div>

        {/* 載入步驟 */}
        <div className="w-full max-w-sm mb-8 space-y-3">
          {LOADING_STEPS.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep && currentStep < LOADING_STEPS.length

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500'
                    : isCurrent
                      ? 'border-cyan-400 bg-cyan-400/20'
                      : 'border-gray-600 bg-transparent'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                      ? 'text-cyan-300'
                      : 'text-gray-500'
                }`}>
                  {t(step.labelZh, step.labelEn)}
                  {isCurrent && <span className="ml-1 animate-pulse">...</span>}
                </span>
              </div>
            )
          })}
        </div>

        {/* 進度條 */}
        <div className="w-full max-w-sm mb-8">
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            {/* 光澤效果 */}
            <div
              className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                animation: 'shimmer 2s infinite',
                left: `${progress - 20}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">
              {t("載入中", "Loading")}
            </span>
            <span className="text-xs text-cyan-400 font-mono">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* 趣味提示 */}
        <div className="relative h-12 w-full max-w-md overflow-hidden">
          {funFacts.map((fact, index) => (
            <p
              key={index}
              className={`absolute inset-0 flex items-center justify-center text-center text-sm text-gray-400 transition-all duration-500 ${
                index === funFactIndex
                  ? 'opacity-100 translate-y-0'
                  : index === (funFactIndex - 1 + funFacts.length) % funFacts.length
                    ? 'opacity-0 -translate-y-4'
                    : 'opacity-0 translate-y-4'
              }`}
            >
              {fact}
            </p>
          ))}
        </div>
      </div>

      {/* CSS 動畫 */}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }

        @keyframes circuit-extend {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }

        @keyframes node-appear {
          0% {
            opacity: 0;
            transform: translateY(-50%) scale(0);
          }
          100% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        @keyframes logo-glow {
          0%, 100% {
            filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 50px rgba(168, 85, 247, 0.8));
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}
