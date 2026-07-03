"use client"

import { useState, useEffect, useRef } from "react"
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
  "你知道嗎？FRC 6998 UNIPARDS 來自台灣！",
  "機器人賽季充滿挑戰與創意",
  "透明的財務管理讓團隊更有效率",
  "每一筆支出都是邁向冠軍的一步",
  "報帳系統讓財務流程更順暢",
]

const FUN_FACTS_EN = [
  "Did you know? FRC 6998 UNIPARDS is from Taiwan!",
  "Robotics season is full of challenges and creativity",
  "Transparent finance makes team more efficient",
  "Every expense is a step towards championship",
  "This system streamlines financial workflows",
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
    <div className="fixed inset-0 z-[200] bg-[hsl(220_8%_9%)] text-[hsl(40_12%_92%)] overflow-hidden">
      {/* 藍圖網格背景 */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220 6% 21% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(220 6% 21% / 0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 主要內容：開機自檢面板 */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 transition-opacity duration-500 ${
          showContent ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 隊伍識別 */}
        <div className="mb-2 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none">
            FRC <span className="font-mono font-semibold text-[hsl(26_95%_55%)]">6998</span>
          </h1>
        </div>

        {/* UNIPARDS 字母逐一顯示 */}
        <div className="mb-10">
          <p className="font-mono text-lg md:text-xl tracking-[0.4em] text-[hsl(220_6%_62%)] uppercase">
            {teamName.split("").map((letter, i) => (
              <span
                key={i}
                className={`inline-block transition-opacity duration-200 ${
                  i < letterRevealCount ? "opacity-100" : "opacity-0"
                }`}
              >
                {letter}
              </span>
            ))}
          </p>
        </div>

        {/* 載入步驟：POST 自檢清單 */}
        <div className="w-full max-w-sm mb-8 rounded-md border border-[hsl(220_6%_21%)] bg-[hsl(220_7%_12%)] p-4 font-mono text-sm">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[hsl(220_6%_62%)]">
            System Check
          </p>
          <div className="space-y-2.5">
            {LOADING_STEPS.map((step, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep && currentStep < LOADING_STEPS.length

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    isCompleted || isCurrent ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span className="flex items-center justify-center w-5 h-5 shrink-0">
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-[hsl(150_40%_48%)]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-[hsl(26_95%_55%)] animate-spin" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(220_6%_35%)]" />
                    )}
                  </span>
                  <span
                    className={`transition-colors duration-300 ${
                      isCompleted
                        ? "text-[hsl(150_40%_48%)]"
                        : isCurrent
                          ? "text-[hsl(40_12%_92%)]"
                          : "text-[hsl(220_6%_50%)]"
                    }`}
                  >
                    {t(step.labelZh, step.labelEn)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 進度條：hairline 軌道 + 琥珀實線 */}
        <div className="w-full max-w-sm mb-8">
          <div className="relative h-1 bg-[hsl(220_6%_18%)] rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[hsl(26_95%_55%)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 font-mono text-xs">
            <span className="text-[hsl(220_6%_62%)] uppercase tracking-wider">
              {t("載入中", "Loading")}
            </span>
            <span className="text-[hsl(26_95%_55%)] tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* 趣味提示 */}
        <div className="relative h-10 w-full max-w-md overflow-hidden">
          {funFacts.map((fact, index) => (
            <p
              key={index}
              className={`absolute inset-0 flex items-center justify-center text-center font-mono text-xs text-[hsl(220_6%_62%)] transition-all duration-500 ${
                index === funFactIndex
                  ? "opacity-100 translate-y-0"
                  : index === (funFactIndex - 1 + funFacts.length) % funFacts.length
                    ? "opacity-0 -translate-y-3"
                    : "opacity-0 translate-y-3"
              }`}
            >
              <span className="text-[hsl(26_95%_55%)] mr-2">{"//"}</span>
              {fact}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
