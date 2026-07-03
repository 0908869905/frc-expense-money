"use client"

import { useLanguage } from "@/lib/language-context"
import { useState, useTransition } from "react"
import { ArrowLeft, Search, Package, ArrowDownToLine, ArrowUpFromLine, MapPin, AlertTriangle, Keyboard, ScanLine } from "lucide-react"
import Link from "next/link"
import { getItemBySku, adjustStock } from "@/app/actions/inventory"
import { QRScanner } from "@/components/qr-scanner"
import { type InventoryItem, isLowStock } from "@/types/inventory"

// ========== 常數定義 ==========

const MESSAGES = {
    zh: {
        title: "QR 掃描",
        subtitle: "掃描或輸入料號查詢庫存",
        enterSku: "請輸入或掃描料號",
        lookupFailed: "查詢失敗",
        itemFound: "找到零件！",
        insufficientStock: "庫存不足",
        switchToCamera: "切換到相機掃描",
        switchToManual: "切換到手動輸入",
        manualInput: "手動輸入料號",
        placeholder: "例如: MOTOR-001",
        currentQty: "目前數量",
        safetyStock: "安全庫存",
        lowStockWarning: "庫存不足，請補貨！",
        qty: "數量",
        stockIn: "入庫",
        stockOut: "領用",
        stockInSuccess: (n: number) => `已入庫 ${n} 個`,
        stockOutSuccess: (n: number) => `已領用 ${n} 個`,
        stockInFailed: "入庫失敗",
        stockOutFailed: "領用失敗",
        scanAnother: "繼續掃描",
        lookingUp: "查詢中...",
    },
    en: {
        title: "QR Scan",
        subtitle: "Scan or enter SKU to lookup",
        enterSku: "Please enter or scan SKU",
        lookupFailed: "Lookup failed",
        itemFound: "Item found!",
        insufficientStock: "Insufficient stock",
        switchToCamera: "Switch to camera",
        switchToManual: "Switch to manual input",
        manualInput: "Enter SKU manually",
        placeholder: "e.g. MOTOR-001",
        currentQty: "Current Qty",
        safetyStock: "Safety Stock",
        lowStockWarning: "Low stock, please reorder!",
        qty: "Qty",
        stockIn: "Stock In",
        stockOut: "Stock Out",
        stockInSuccess: (n: number) => `Added ${n}`,
        stockOutSuccess: (n: number) => `Took ${n}`,
        stockInFailed: "Stock in failed",
        stockOutFailed: "Stock out failed",
        scanAnother: "Scan Another",
        lookingUp: "Looking up...",
    },
} as const

const MESSAGE_DISPLAY_DURATION_MS = 3000

// ========== 組件 ==========

export default function ScanPage(): JSX.Element {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [manualSku, setManualSku] = useState("")
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [adjustAmount, setAdjustAmount] = useState(1)
    const [showManualInput, setShowManualInput] = useState(false)
    const [showScanner, setShowScanner] = useState(true)

    const t = MESSAGES[language]

    function showMessageWithTimeout(type: "success" | "error", text: string): void {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), MESSAGE_DISPLAY_DURATION_MS)
    }

    function handleLookup(sku: string): void {
        if (!sku.trim()) {
            setError(t.enterSku)
            return
        }

        setError(null)
        setScannedItem(null)

        startTransition(async () => {
            const result = await getItemBySku(sku.trim())

            if (result.success && result.item) {
                setScannedItem(result.item)
                setShowScanner(false)
                showMessageWithTimeout("success", t.itemFound)
            } else {
                setError(result.message || t.lookupFailed)
            }
        })
    }

    function handleScanSuccess(result: string): void {
        setManualSku(result)
        handleLookup(result)
    }

    function handleStockChange(isStockIn: boolean): void {
        if (!scannedItem || adjustAmount <= 0) return

        if (!isStockIn && adjustAmount > scannedItem.currentQuantity) {
            showMessageWithTimeout("error", t.insufficientStock)
            return
        }

        startTransition(async () => {
            const amount = isStockIn ? adjustAmount : -adjustAmount
            const type = isStockIn ? "PURCHASE_IN" : "PROJECT_USE"
            const result = await adjustStock(scannedItem.id, amount, type)

            if (result.success) {
                const successText = isStockIn
                    ? t.stockInSuccess(adjustAmount)
                    : t.stockOutSuccess(adjustAmount)
                showMessageWithTimeout("success", successText)
                handleLookup(scannedItem.sku)
            } else {
                const failText = isStockIn ? t.stockInFailed : t.stockOutFailed
                showMessageWithTimeout("error", result.message || failText)
            }
        })
    }

    function resetScanner(): void {
        setScannedItem(null)
        setShowScanner(true)
        setAdjustAmount(1)
    }

    const itemIsLowStock = scannedItem ? isLowStock(scannedItem) : false

    return (
        <div className="flex flex-col gap-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/inventory"
                    className="p-2 rounded-lg hover:bg-muted"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${message.type === "success"
                        ? "bg-ok/10 text-ok border border-ok/30"
                        : "bg-danger/10 text-danger border border-danger/30"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* QR Scanner */}
            {!showManualInput && showScanner && (
                <QRScanner onScan={handleScanSuccess} />
            )}

            {/* Toggle Manual Input */}
            <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <Keyboard className="h-4 w-4" />
                {showManualInput ? t.switchToCamera : t.switchToManual}
            </button>

            {/* Manual Input */}
            {showManualInput && (
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium">{t.manualInput}</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualSku}
                            onChange={(e) => setManualSku(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleLookup(manualSku)}
                            placeholder={t.placeholder}
                            className="flex-1 px-4 py-3 border rounded-lg font-mono text-lg bg-background"
                        />
                        <button
                            onClick={() => handleLookup(manualSku)}
                            disabled={isPending || !manualSku.trim()}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-lg bg-danger/10 text-danger border border-danger/30">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isPending && !scannedItem && (
                <div className="p-8 text-center text-muted-foreground">{t.lookingUp}</div>
            )}

            {/* Scanned Item Result */}
            {scannedItem && (
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    {/* Item Header */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{scannedItem.name}</h2>
                            <p className="text-sm font-mono text-muted-foreground">{scannedItem.sku}</p>
                        </div>
                    </div>

                    {/* Item Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="text-sm text-muted-foreground mb-1">{t.currentQty}</div>
                            <div className={`text-3xl font-semibold tech-number ${itemIsLowStock ? "text-danger" : ""}`}>
                                {scannedItem.currentQuantity}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="text-sm text-muted-foreground mb-1">{t.safetyStock}</div>
                            <div className="text-3xl font-semibold tech-number text-muted-foreground">
                                {scannedItem.safetyStockLevel}
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Warning */}
                    {itemIsLowStock && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-warn/10 text-warn border border-warn/30">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-medium">{t.lowStockWarning}</span>
                        </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{scannedItem.storageLocation}</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium whitespace-nowrap">{t.qty}</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAdjustAmount(Math.max(1, adjustAmount - 1))}
                                    className="w-10 h-10 rounded-lg border hover:bg-muted text-xl font-bold"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 h-10 text-center border rounded-lg font-bold text-xl"
                                />
                                <button
                                    onClick={() => setAdjustAmount(adjustAmount + 1)}
                                    className="w-10 h-10 rounded-lg border hover:bg-muted text-xl font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleStockChange(true)}
                                disabled={isPending || adjustAmount <= 0}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-ok text-white rounded-md hover:bg-ok/90 disabled:opacity-50 font-medium"
                            >
                                <ArrowDownToLine className="h-5 w-5" />
                                {t.stockIn}
                            </button>
                            <button
                                onClick={() => handleStockChange(false)}
                                disabled={isPending || adjustAmount <= 0 || adjustAmount > scannedItem.currentQuantity}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-warn text-white rounded-md hover:bg-warn/90 disabled:opacity-50 font-medium"
                            >
                                <ArrowUpFromLine className="h-5 w-5" />
                                {t.stockOut}
                            </button>
                        </div>

                        <button
                            onClick={resetScanner}
                            className="w-full flex items-center justify-center gap-2 py-3 border rounded-lg hover:bg-muted font-medium"
                        >
                            <ScanLine className="h-5 w-5" />
                            {t.scanAnother}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
