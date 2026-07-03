"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Camera, XCircle, RotateCcw } from "lucide-react"

// ========== 常數定義 ==========

const MESSAGES = {
    zh: {
        permissionDenied: "相機權限被拒絕",
        noCameraFound: "找不到相機",
        failedToStart: "無法啟動相機",
        allowCameraAccess: "請在瀏覽器設定中允許相機權限",
        clickToStart: "點擊下方按鈕啟動相機",
        startCamera: "啟動相機掃描",
        stop: "停止掃描",
        restart: "重新啟動",
        scanningHint: "將 QR Code 對準框框內，保持距離 10-20 公分",
        scanning: "掃描中...",
    },
    en: {
        permissionDenied: "Camera permission denied",
        noCameraFound: "No camera found",
        failedToStart: "Failed to start camera",
        allowCameraAccess: "Please allow camera access in browser settings",
        clickToStart: "Click button below to start camera",
        startCamera: "Start Camera",
        stop: "Stop",
        restart: "Restart",
        scanningHint: "Align QR Code within the frame, keep 10-20cm distance",
        scanning: "Scanning...",
    },
} as const

const DUPLICATE_SCAN_COOLDOWN_MS = 5000

// ========== 類型定義 ==========

interface QRScannerProps {
    onScan: (result: string) => void
    onError?: (error: string) => void
}

type ScannerState = "idle" | "scanning" | "error"

interface Html5QrCodeInstance {
    start: (
        cameraId: { facingMode: string },
        config: { fps: number; qrbox: { width: number; height: number }; aspectRatio?: number },
        onSuccess: (text: string) => void,
        onError: () => void
    ) => Promise<null>
    stop: () => Promise<void>
}

// ========== 組件 ==========

export function QRScanner({ onScan, onError }: QRScannerProps): JSX.Element {
    const { language } = useLanguage()
    const scannerRef = useRef<HTMLDivElement>(null)
    const html5QrCodeRef = useRef<Html5QrCodeInstance | null>(null)
    const lastScannedRef = useRef<string | null>(null)
    const [state, setState] = useState<ScannerState>("idle")
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const t = MESSAGES[language]

    async function startScanner(): Promise<void> {
        if (!scannerRef.current) return

        setErrorMessage(null)

        try {
            const { Html5Qrcode } = await import("html5-qrcode")

            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop()
                } catch {
                    // Ignore stop errors
                }
            }

            const html5QrCode = new Html5Qrcode("qr-reader")
            html5QrCodeRef.current = html5QrCode

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 15,
                    qrbox: { width: 200, height: 200 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    if (decodedText === lastScannedRef.current) return
                    lastScannedRef.current = decodedText

                    if (navigator.vibrate) {
                        navigator.vibrate(100)
                    }
                    onScan(decodedText)

                    setTimeout(() => { lastScannedRef.current = null }, DUPLICATE_SCAN_COOLDOWN_MS)
                },
                () => { /* Scanning in progress */ }
            )

            setState("scanning")
            setHasPermission(true)
        } catch (err) {
            const error = err as Error
            console.error("QR Scanner error:", error)
            setState("error")

            const message = error.message || String(err)

            if (message.includes("Permission") || message.includes("NotAllowedError")) {
                setHasPermission(false)
                setErrorMessage(t.permissionDenied)
            } else if (message.includes("NotFoundError")) {
                setErrorMessage(t.noCameraFound)
            } else {
                setErrorMessage(t.failedToStart)
            }

            onError?.(message || "Scanner error")
        }
    }

    async function stopScanner(): Promise<void> {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop()
                html5QrCodeRef.current = null
            } catch {
                // Ignore stop errors
            }
        }
        setState("idle")
    }

    async function restartScanner(): Promise<void> {
        await stopScanner()
        setTimeout(startScanner, 100)
    }

    useEffect(() => {
        return () => {
            stopScanner()
        }
    }, [])

    return (
        <div className="flex flex-col gap-4">
            {/* Scan Area */}
            <div
                ref={scannerRef}
                className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-black"
            >
                <div id="qr-reader" className="w-full h-full" />

                {/* Idle State */}
                {state === "idle" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
                        <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center px-4">
                            {t.clickToStart}
                        </p>
                    </div>
                )}

                {/* Error State */}
                {state === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-danger/10">
                        <XCircle className="h-16 w-16 text-danger mb-4" />
                        <p className="text-danger text-center px-4 font-medium">{errorMessage}</p>
                        {hasPermission === false && (
                            <p className="text-danger text-sm text-center px-4 mt-2">
                                {t.allowCameraAccess}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
                {state !== "scanning" ? (
                    <button
                        onClick={startScanner}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Camera className="h-5 w-5" />
                        {t.startCamera}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={stopScanner}
                            className="flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-muted font-medium"
                        >
                            {t.stop}
                        </button>
                        <button
                            onClick={restartScanner}
                            className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted"
                            title={t.restart}
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Scanning Hint */}
            {state === "scanning" && (
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{t.scanningHint}</p>
                    <p className="text-xs text-muted-foreground animate-pulse">{t.scanning}</p>
                </div>
            )}
        </div>
    )
}
