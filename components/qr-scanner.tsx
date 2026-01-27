"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Camera, XCircle, RotateCcw } from "lucide-react"

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

export function QRScanner({ onScan, onError }: QRScannerProps): JSX.Element {
    const { language } = useLanguage()
    const scannerRef = useRef<HTMLDivElement>(null)
    const html5QrCodeRef = useRef<Html5QrCodeInstance | null>(null)
    const lastScannedRef = useRef<string | null>(null)
    const [state, setState] = useState<ScannerState>("idle")
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
                    // 避免重複掃描同一個碼
                    if (decodedText === lastScannedRef.current) return
                    lastScannedRef.current = decodedText

                    // 掃描成功後震動提示（如果支援）
                    if (navigator.vibrate) {
                        navigator.vibrate(100)
                    }
                    console.log("QR Code scanned:", decodedText)
                    onScan(decodedText)

                    // 5 秒後允許重新掃描同一個碼
                    setTimeout(() => { lastScannedRef.current = null }, 5000)
                },
                () => { /* Scanning in progress */ }
            )

            setState("scanning")
            setHasPermission(true)
        } catch (err) {
            const error = err as Error
            console.error("QR Scanner error:", error)
            setState("error")

            const message = error.message || ""
            if (message.includes("Permission")) {
                setHasPermission(false)
                setErrorMessage(language === "zh" ? "相機權限被拒絕" : "Camera permission denied")
            } else if (message.includes("NotFoundError")) {
                setErrorMessage(language === "zh" ? "找不到相機" : "No camera found")
            } else {
                setErrorMessage(language === "zh" ? "無法啟動相機" : "Failed to start camera")
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
                            {language === "zh"
                                ? "點擊下方按鈕啟動相機"
                                : "Click button below to start camera"}
                        </p>
                    </div>
                )}

                {/* Error State */}
                {state === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50">
                        <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        <p className="text-red-600 text-center px-4 font-medium">{errorMessage}</p>
                        {hasPermission === false && (
                            <p className="text-red-500 text-sm text-center px-4 mt-2">
                                {language === "zh"
                                    ? "請在瀏覽器設定中允許相機權限"
                                    : "Please allow camera access in browser settings"}
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
                        {language === "zh" ? "啟動相機掃描" : "Start Camera"}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={stopScanner}
                            className="flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-muted font-medium"
                        >
                            {language === "zh" ? "停止掃描" : "Stop"}
                        </button>
                        <button
                            onClick={restartScanner}
                            className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted"
                            title={language === "zh" ? "重新啟動" : "Restart"}
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Scanning Hint */}
            {state === "scanning" && (
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        {language === "zh"
                            ? "將 QR Code 對準框框內，保持距離 10-20 公分"
                            : "Align QR Code within the frame, keep 10-20cm distance"}
                    </p>
                    <p className="text-xs text-muted-foreground animate-pulse">
                        {language === "zh"
                            ? "🔍 掃描中..."
                            : "🔍 Scanning..."}
                    </p>
                </div>
            )}
        </div>
    )
}
