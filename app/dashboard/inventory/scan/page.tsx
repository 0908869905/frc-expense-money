"use client"

import { useLanguage } from "@/lib/language-context"
import { useState, useTransition } from "react"
import { ArrowLeft, Search, Package, ArrowDownToLine, ArrowUpFromLine, MapPin, AlertTriangle, Keyboard, ScanLine } from "lucide-react"
import Link from "next/link"
import { getItemBySku, adjustStock } from "@/app/actions/inventory"
import { QRScanner } from "@/components/qr-scanner"
import { type InventoryItem, isLowStock } from "@/types/inventory"

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

    function showMessage(type: "success" | "error", text: string): void {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    function handleLookup(sku: string): void {
        if (!sku.trim()) {
            setError(language === "zh" ? "請輸入或掃描料號" : "Please enter or scan SKU")
            return
        }

        setError(null)
        setScannedItem(null)

        startTransition(async () => {
            const result = await getItemBySku(sku.trim())

            if (result.success && result.item) {
                setScannedItem(result.item)
                setShowScanner(false) // 找到零件後隱藏掃描器
                showMessage("success", language === "zh" ? "找到零件！" : "Item found!")
            } else {
                setError(result.message || (language === "zh" ? "查詢失敗" : "Lookup failed"))
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
            showMessage("error", language === "zh" ? "庫存不足" : "Insufficient stock")
            return
        }

        startTransition(async () => {
            const amount = isStockIn ? adjustAmount : -adjustAmount
            const type = isStockIn ? "PURCHASE_IN" : "PROJECT_USE"
            const result = await adjustStock(scannedItem.id, amount, type)

            if (result.success) {
                const successText = isStockIn
                    ? (language === "zh" ? `已入庫 ${adjustAmount} 個` : `Added ${adjustAmount}`)
                    : (language === "zh" ? `已領用 ${adjustAmount} 個` : `Took ${adjustAmount}`)
                showMessage("success", successText)
                handleLookup(scannedItem.sku)
            } else {
                const failText = isStockIn
                    ? (language === "zh" ? "入庫失敗" : "Stock in failed")
                    : (language === "zh" ? "領用失敗" : "Stock out failed")
                showMessage("error", result.message || failText)
            }
        })
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
                    <h1 className="text-2xl font-bold">
                        {language === "zh" ? "QR 掃描" : "QR Scan"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {language === "zh" ? "掃描或輸入料號查詢庫存" : "Scan or enter SKU to lookup"}
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${message.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* QR Scanner - 只在沒有找到零件時顯示 */}
            {!showManualInput && showScanner && (
                <QRScanner
                    onScan={handleScanSuccess}
                    onError={(err) => console.error("Scanner error:", err)}
                />
            )}

            {/* Toggle Manual Input */}
            <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <Keyboard className="h-4 w-4" />
                {showManualInput
                    ? (language === "zh" ? "切換到相機掃描" : "Switch to camera")
                    : (language === "zh" ? "切換到手動輸入" : "Switch to manual input")}
            </button>

            {/* Manual Input */}
            {showManualInput && (
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium">
                        {language === "zh" ? "手動輸入料號" : "Enter SKU manually"}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualSku}
                            onChange={(e) => setManualSku(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleLookup(manualSku)}
                            placeholder={language === "zh" ? "例如: MOTOR-001" : "e.g. MOTOR-001"}
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
                <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isPending && !scannedItem && (
                <div className="p-8 text-center text-muted-foreground">
                    {language === "zh" ? "查詢中..." : "Looking up..."}
                </div>
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
                            <div className="text-sm text-muted-foreground mb-1">
                                {language === "zh" ? "目前數量" : "Current Qty"}
                            </div>
                            <div className={`text-3xl font-bold ${itemIsLowStock ? "text-red-600" : ""}`}>
                                {scannedItem.currentQuantity}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="text-sm text-muted-foreground mb-1">
                                {language === "zh" ? "安全庫存" : "Safety Stock"}
                            </div>
                            <div className="text-3xl font-bold text-muted-foreground">
                                {scannedItem.safetyStockLevel}
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Warning */}
                    {itemIsLowStock && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-medium">
                                {language === "zh" ? "庫存不足，請補貨！" : "Low stock, please reorder!"}
                            </span>
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
                            <label className="text-sm font-medium whitespace-nowrap">
                                {language === "zh" ? "數量" : "Qty"}
                            </label>
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
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                            >
                                <ArrowDownToLine className="h-5 w-5" />
                                {language === "zh" ? "入庫" : "Stock In"}
                            </button>
                            <button
                                onClick={() => handleStockChange(false)}
                                disabled={isPending || adjustAmount <= 0 || adjustAmount > scannedItem.currentQuantity}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                            >
                                <ArrowUpFromLine className="h-5 w-5" />
                                {language === "zh" ? "領用" : "Stock Out"}
                            </button>
                        </div>

                        {/* 繼續掃描按鈕 */}
                        <button
                            onClick={() => {
                                setScannedItem(null)
                                setShowScanner(true)
                                setAdjustAmount(1)
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 border rounded-lg hover:bg-muted font-medium"
                        >
                            <ScanLine className="h-5 w-5" />
                            {language === "zh" ? "繼續掃描" : "Scan Another"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
