"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { batchCreateItems, batchAdjustStock } from "@/app/actions/inventory"
import {
    type InventoryItem,
    type BatchItemRow,
    type BatchAdjustRow,
    type BatchResult,
    ITEM_CATEGORIES,
    TRANSACTION_TYPES,
} from "@/types/inventory"

interface BatchInventoryModalProps {
    mode: "create" | "adjust"
    isOpen: boolean
    onClose: () => void
    items?: InventoryItem[]
    language: string
    onSuccess: () => void
}

const MAX_ROWS = 50

// 異動類型 → 正負號
function getAmountSign(transactionType: string): number {
    switch (transactionType) {
        case "PURCHASE_IN":
            return 1
        case "PROJECT_USE":
        case "DAMAGED":
        case "LOST":
            return -1
        case "AUDIT_ADJUSTMENT":
            return 1 // 盤點調整預設正數，使用者可輸入負數
        default:
            return 1
    }
}

function createEmptyItemRow(): BatchItemRow {
    return {
        id: crypto.randomUUID(),
        name: "",
        sku: "",
        category: "HARDWARE",
        storageLocation: "",
        currentQuantity: 0,
        safetyStockLevel: 0,
        vendorLink: "",
    }
}

function createEmptyAdjustRow(): BatchAdjustRow {
    return {
        id: crypto.randomUUID(),
        itemId: "",
        amount: 1,
        transactionType: "PURCHASE_IN",
        projectId: "",
    }
}

export function BatchInventoryModal({
    mode,
    isOpen,
    onClose,
    items = [],
    language,
    onSuccess,
}: BatchInventoryModalProps) {
    const zh = language === "zh"
    const [isPending, startTransition] = useTransition()
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null)

    // Create mode state
    const [createRows, setCreateRows] = useState<BatchItemRow[]>([createEmptyItemRow()])

    // Adjust mode state
    const [adjustRows, setAdjustRows] = useState<BatchAdjustRow[]>([createEmptyAdjustRow()])

    function handleClose() {
        setCreateRows([createEmptyItemRow()])
        setAdjustRows([createEmptyAdjustRow()])
        setBatchResult(null)
        onClose()
    }

    // ===== Create Mode =====

    function addCreateRow() {
        if (createRows.length >= MAX_ROWS) return
        setCreateRows([...createRows, createEmptyItemRow()])
    }

    function removeCreateRow(id: string) {
        if (createRows.length <= 1) return
        setCreateRows(createRows.filter((r) => r.id !== id))
    }

    function updateCreateRow(id: string, field: keyof BatchItemRow, value: string | number) {
        setCreateRows(
            createRows.map((r) =>
                r.id === id ? { ...r, [field]: value, error: undefined } : r
            )
        )
    }

    function clearAllCreateRows() {
        setCreateRows([createEmptyItemRow()])
        setBatchResult(null)
    }

    function validateCreateRows(): boolean {
        let valid = true
        const skuMap = new Map<string, number[]>()

        const updated = createRows.map((row, idx) => {
            let error = ""
            if (!row.name.trim()) error = zh ? "品名必填" : "Name required"
            else if (!row.sku.trim()) error = zh ? "料號必填" : "SKU required"
            else if (!row.category) error = zh ? "類別必填" : "Category required"
            else if (!row.storageLocation.trim()) error = zh ? "儲存位置必填" : "Location required"

            // 收集 SKU 位置
            const sku = row.sku.trim()
            if (sku) {
                const existing = skuMap.get(sku) || []
                existing.push(idx)
                skuMap.set(sku, existing)
            }

            if (error) {
                valid = false
                return { ...row, error }
            }
            return { ...row, error: undefined }
        })

        // 檢查行內 SKU 重複
        const final = updated.map((row, idx) => {
            const sku = row.sku.trim()
            const positions = skuMap.get(sku)
            if (positions && positions.length > 1 && !row.error) {
                valid = false
                return { ...row, error: zh ? `料號 ${sku} 在批次內重複` : `SKU ${sku} duplicated` }
            }
            return row
        })

        setCreateRows(final)
        return valid
    }

    function handleSubmitCreate() {
        if (!validateCreateRows()) return

        startTransition(async () => {
            const payload = createRows.map((r) => ({
                name: r.name.trim(),
                sku: r.sku.trim(),
                category: r.category,
                storageLocation: r.storageLocation.trim(),
                currentQuantity: r.currentQuantity,
                safetyStockLevel: r.safetyStockLevel,
                vendorLink: r.vendorLink.trim() || undefined,
            }))

            const result = await batchCreateItems(payload)
            setBatchResult(result)

            if (result.success) {
                // 全部成功
                onSuccess()
                setTimeout(handleClose, 1500)
            } else if (result.successCount > 0) {
                // 部分成功：移除成功行，保留失敗行
                const failedIndices = new Set(
                    result.results.filter((r) => !r.success).map((r) => r.index)
                )
                const failedRows = createRows
                    .filter((_, idx) => failedIndices.has(idx))
                    .map((row, idx) => {
                        const resultEntry = result.results.find(
                            (r) => !r.success && r.index === createRows.indexOf(row)
                        )
                        return { ...row, error: resultEntry?.message }
                    })
                setCreateRows(failedRows.length > 0 ? failedRows : [createEmptyItemRow()])
                onSuccess()
            }
            // 全部失敗：標記每行錯誤
            else {
                setCreateRows(
                    createRows.map((row, idx) => {
                        const resultEntry = result.results.find((r) => r.index === idx)
                        return { ...row, error: resultEntry?.message }
                    })
                )
            }
        })
    }

    // ===== Adjust Mode =====

    function addAdjustRow() {
        if (adjustRows.length >= MAX_ROWS) return
        setAdjustRows([...adjustRows, createEmptyAdjustRow()])
    }

    function removeAdjustRow(id: string) {
        if (adjustRows.length <= 1) return
        setAdjustRows(adjustRows.filter((r) => r.id !== id))
    }

    function updateAdjustRow(id: string, field: keyof BatchAdjustRow, value: string | number) {
        setAdjustRows(
            adjustRows.map((r) => {
                if (r.id !== id) return r
                const updated = { ...r, [field]: value, error: undefined }
                // 自動帶入零件名稱
                if (field === "itemId") {
                    const found = items.find((i) => i.id === value)
                    updated.itemName = found?.name
                }
                return updated
            })
        )
    }

    function clearAllAdjustRows() {
        setAdjustRows([createEmptyAdjustRow()])
        setBatchResult(null)
    }

    function validateAdjustRows(): boolean {
        let valid = true
        const updated = adjustRows.map((row) => {
            let error = ""
            if (!row.itemId) error = zh ? "請選擇零件" : "Select an item"
            else if (row.amount === 0) error = zh ? "數量不能為 0" : "Amount cannot be 0"
            else if (row.transactionType === "PROJECT_USE" && !row.projectId.trim()) {
                // 專案領用時 projectId 非必填，但建議填寫
            }

            if (error) {
                valid = false
                return { ...row, error }
            }
            return { ...row, error: undefined }
        })
        setAdjustRows(updated)
        return valid
    }

    function handleSubmitAdjust() {
        if (!validateAdjustRows()) return

        startTransition(async () => {
            const payload = adjustRows.map((r) => {
                const sign = getAmountSign(r.transactionType)
                // AUDIT_ADJUSTMENT 允許使用者自己控制正負
                const amount =
                    r.transactionType === "AUDIT_ADJUSTMENT"
                        ? r.amount
                        : sign * Math.abs(r.amount)
                return {
                    itemId: r.itemId,
                    amount,
                    transactionType: r.transactionType,
                    projectId: r.projectId.trim() || undefined,
                }
            })

            const result = await batchAdjustStock(payload)
            setBatchResult(result)

            if (result.success) {
                onSuccess()
                setTimeout(handleClose, 1500)
            } else if (result.successCount > 0) {
                const failedIndices = new Set(
                    result.results.filter((r) => !r.success).map((r) => r.index)
                )
                const failedRows = adjustRows
                    .filter((_, idx) => failedIndices.has(idx))
                    .map((row) => {
                        const resultEntry = result.results.find(
                            (r) => !r.success && r.index === adjustRows.indexOf(row)
                        )
                        return { ...row, error: resultEntry?.message }
                    })
                setAdjustRows(failedRows.length > 0 ? failedRows : [createEmptyAdjustRow()])
                onSuccess()
            } else {
                setAdjustRows(
                    adjustRows.map((row, idx) => {
                        const resultEntry = result.results.find((r) => r.index === idx)
                        return { ...row, error: resultEntry?.message }
                    })
                )
            }
        })
    }

    const title = mode === "create"
        ? (zh ? "批量新增零件" : "Batch Add Items")
        : (zh ? "批量庫存調整" : "Batch Stock Adjustment")

    const rowCount = mode === "create" ? createRows.length : adjustRows.length

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title} size="2xl">
            <div className="flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={mode === "create" ? addCreateRow : addAdjustRow}
                        disabled={rowCount >= MAX_ROWS}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {zh ? "新增一行" : "Add Row"}
                    </button>
                    <button
                        onClick={mode === "create" ? clearAllCreateRows : clearAllAdjustRows}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-muted"
                    >
                        {zh ? "清除全部" : "Clear All"}
                    </button>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {zh ? `${rowCount} 行` : `${rowCount} rows`}
                        {rowCount >= MAX_ROWS && (
                            <span className="text-yellow-600 ml-1">
                                ({zh ? "已達上限" : "max reached"})
                            </span>
                        )}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border rounded-lg">
                    {mode === "create" ? (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left p-2 font-medium min-w-[120px]">
                                        {zh ? "品名 *" : "Name *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[120px]">
                                        {zh ? "料號 *" : "SKU *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[100px]">
                                        {zh ? "類別 *" : "Category *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[100px]">
                                        {zh ? "儲存位置 *" : "Location *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[80px]">
                                        {zh ? "初始數量" : "Init Qty"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[80px]">
                                        {zh ? "安全庫存" : "Safety"}
                                    </th>
                                    <th className="text-left p-2 font-medium w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {createRows.map((row) => (
                                    <tr key={row.id} className={row.error ? "bg-red-50/50" : ""}>
                                        <td className="p-1.5">
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={(e) =>
                                                    updateCreateRow(row.id, "name", e.target.value)
                                                }
                                                className={`w-full px-2 py-1 border rounded text-sm ${
                                                    row.error ? "border-red-400" : ""
                                                }`}
                                                placeholder={zh ? "品名" : "Name"}
                                            />
                                        </td>
                                        <td className="p-1.5">
                                            <input
                                                type="text"
                                                value={row.sku}
                                                onChange={(e) =>
                                                    updateCreateRow(row.id, "sku", e.target.value)
                                                }
                                                className={`w-full px-2 py-1 border rounded text-sm font-mono ${
                                                    row.error ? "border-red-400" : ""
                                                }`}
                                                placeholder="REV-21-1650"
                                            />
                                        </td>
                                        <td className="p-1.5">
                                            <select
                                                value={row.category}
                                                onChange={(e) =>
                                                    updateCreateRow(row.id, "category", e.target.value)
                                                }
                                                className="w-full px-2 py-1 border rounded text-sm"
                                            >
                                                {ITEM_CATEGORIES.map((cat) => (
                                                    <option key={cat.value} value={cat.value}>
                                                        {zh ? cat.labelZh : cat.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-1.5">
                                            <input
                                                type="text"
                                                value={row.storageLocation}
                                                onChange={(e) =>
                                                    updateCreateRow(
                                                        row.id,
                                                        "storageLocation",
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full px-2 py-1 border rounded text-sm ${
                                                    row.error ? "border-red-400" : ""
                                                }`}
                                                placeholder={zh ? "A櫃-3層" : "A-3"}
                                            />
                                        </td>
                                        <td className="p-1.5">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.currentQuantity}
                                                onChange={(e) =>
                                                    updateCreateRow(
                                                        row.id,
                                                        "currentQuantity",
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                        </td>
                                        <td className="p-1.5">
                                            <input
                                                type="number"
                                                min={0}
                                                value={row.safetyStockLevel}
                                                onChange={(e) =>
                                                    updateCreateRow(
                                                        row.id,
                                                        "safetyStockLevel",
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                        </td>
                                        <td className="p-1.5 text-center">
                                            <button
                                                onClick={() => removeCreateRow(row.id)}
                                                disabled={createRows.length <= 1}
                                                className="p-1 rounded hover:bg-red-100 text-red-500 disabled:opacity-30"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left p-2 font-medium min-w-[150px]">
                                        {zh ? "零件 *" : "Item *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[70px]">
                                        {zh ? "目前數量" : "Current"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[120px]">
                                        {zh ? "異動類型 *" : "Type *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[80px]">
                                        {zh ? "數量 *" : "Amount *"}
                                    </th>
                                    <th className="text-left p-2 font-medium min-w-[100px]">
                                        {zh ? "專案 ID" : "Project ID"}
                                    </th>
                                    <th className="text-left p-2 font-medium w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {adjustRows.map((row) => {
                                    const selectedItem = items.find((i) => i.id === row.itemId)
                                    const showProjectId = row.transactionType === "PROJECT_USE"
                                    const isAudit = row.transactionType === "AUDIT_ADJUSTMENT"

                                    return (
                                        <tr
                                            key={row.id}
                                            className={row.error ? "bg-red-50/50" : ""}
                                        >
                                            <td className="p-1.5">
                                                <select
                                                    value={row.itemId}
                                                    onChange={(e) =>
                                                        updateAdjustRow(
                                                            row.id,
                                                            "itemId",
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                                        row.error ? "border-red-400" : ""
                                                    }`}
                                                >
                                                    <option value="">
                                                        {zh ? "-- 選擇零件 --" : "-- Select --"}
                                                    </option>
                                                    {items.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name} ({item.sku})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-1.5 text-center text-muted-foreground">
                                                {selectedItem
                                                    ? selectedItem.currentQuantity
                                                    : "-"}
                                            </td>
                                            <td className="p-1.5">
                                                <select
                                                    value={row.transactionType}
                                                    onChange={(e) =>
                                                        updateAdjustRow(
                                                            row.id,
                                                            "transactionType",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                >
                                                    {TRANSACTION_TYPES.map((t) => (
                                                        <option key={t.value} value={t.value}>
                                                            {zh ? t.labelZh : t.labelEn}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-1.5">
                                                <input
                                                    type="number"
                                                    min={isAudit ? undefined : 1}
                                                    value={row.amount}
                                                    onChange={(e) =>
                                                        updateAdjustRow(
                                                            row.id,
                                                            "amount",
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                                        row.error ? "border-red-400" : ""
                                                    }`}
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                {showProjectId ? (
                                                    <input
                                                        type="text"
                                                        value={row.projectId}
                                                        onChange={(e) =>
                                                            updateAdjustRow(
                                                                row.id,
                                                                "projectId",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-2 py-1 border rounded text-sm"
                                                        placeholder="2024-Robot"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground text-xs px-2">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-1.5 text-center">
                                                <button
                                                    onClick={() => removeAdjustRow(row.id)}
                                                    disabled={adjustRows.length <= 1}
                                                    className="p-1 rounded hover:bg-red-100 text-red-500 disabled:opacity-30"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Row-level errors summary */}
                {(mode === "create" ? createRows : adjustRows).some((r) => r.error) && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-red-700">
                            {(mode === "create" ? createRows : adjustRows)
                                .filter((r) => r.error)
                                .map((r, idx) => (
                                    <div key={idx}>{r.error}</div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Batch result summary */}
                {batchResult && (
                    <div
                        className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                            batchResult.success
                                ? "bg-green-50 border-green-200"
                                : "bg-yellow-50 border-yellow-200"
                        }`}
                    >
                        {batchResult.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                        )}
                        <div className={batchResult.success ? "text-green-700" : "text-yellow-700"}>
                            <div className="font-medium">{batchResult.message}</div>
                            {batchResult.successCount > 0 && batchResult.failedCount > 0 && (
                                <div className="mt-1">
                                    {zh
                                        ? `${batchResult.successCount} 筆成功，${batchResult.failedCount} 筆失敗`
                                        : `${batchResult.successCount} succeeded, ${batchResult.failedCount} failed`}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex gap-3 pt-2 border-t">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                    >
                        {zh ? "取消" : "Cancel"}
                    </button>
                    <button
                        onClick={mode === "create" ? handleSubmitCreate : handleSubmitAdjust}
                        disabled={isPending}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isPending
                            ? (zh ? "處理中..." : "Processing...")
                            : (zh
                                ? `提交 (${rowCount} 筆)`
                                : `Submit (${rowCount})`)}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
