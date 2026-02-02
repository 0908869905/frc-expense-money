import { ItemCategory, TransactionType } from "@prisma/client"
import type { Language } from "@/lib/constants/expense-status"

// ========== 共用介面 ==========

export interface InventoryItem {
    id: string
    name: string
    sku: string
    category: string
    storageLocation: string
    currentQuantity: number
    safetyStockLevel: number
    vendorLink: string | null
    transactions?: unknown[]
}

interface LocalizedOption {
    value: string
    labelZh: string
    labelEn: string
}

// ========== 常數定義 ==========

export const ITEM_CATEGORIES: (LocalizedOption & { value: ItemCategory })[] = [
    { value: "MOTOR", labelZh: "馬達", labelEn: "Motor" },
    { value: "SENSOR", labelZh: "感測器", labelEn: "Sensor" },
    { value: "PNEUMATIC", labelZh: "氣壓", labelEn: "Pneumatic" },
    { value: "CONTROLLER", labelZh: "控制器", labelEn: "Controller" },
    { value: "HARDWARE", labelZh: "五金", labelEn: "Hardware" },
    { value: "RAW_MATERIAL", labelZh: "原料", labelEn: "Raw Material" },
    { value: "TOOL", labelZh: "工具", labelEn: "Tool" },
]

export const TRANSACTION_TYPES: (LocalizedOption & { value: TransactionType })[] = [
    { value: "PURCHASE_IN", labelZh: "採購入庫", labelEn: "Purchase In" },
    { value: "PROJECT_USE", labelZh: "專案領用", labelEn: "Project Use" },
    { value: "DAMAGED", labelZh: "損壞報廢", labelEn: "Damaged" },
    { value: "LOST", labelZh: "遺失", labelEn: "Lost" },
    { value: "AUDIT_ADJUSTMENT", labelZh: "盤點調整", labelEn: "Audit Adjustment" },
]

// ========== 工具函式 ==========

function getLocalizedLabel(options: LocalizedOption[], value: string, language: Language): string {
    const found = options.find((opt) => opt.value === value)
    return found ? (language === "zh" ? found.labelZh : found.labelEn) : value
}

export function getCategoryLabel(category: string, language: Language): string {
    return getLocalizedLabel(ITEM_CATEGORIES, category, language)
}

export function getTransactionTypeLabel(type: string, language: Language): string {
    return getLocalizedLabel(TRANSACTION_TYPES, type, language)
}

export function isLowStock(item: InventoryItem): boolean {
    return item.currentQuantity <= item.safetyStockLevel
}

// ========== 批量操作介面 ==========

export interface BatchItemRow {
    id: string
    name: string
    sku: string
    category: string
    storageLocation: string
    currentQuantity: number
    safetyStockLevel: number
    vendorLink: string
    error?: string
}

export interface BatchAdjustRow {
    id: string
    itemId: string
    itemName?: string
    amount: number
    transactionType: string
    projectId: string
    error?: string
}

export interface BatchResult {
    success: boolean
    message: string
    totalCount: number
    successCount: number
    failedCount: number
    results: Array<{
        index: number
        success: boolean
        message: string
        sku?: string
    }>
}
