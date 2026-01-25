import { ItemCategory, TransactionType } from "@prisma/client"

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

// ========== 常數定義 ==========

interface CategoryOption {
    value: ItemCategory
    labelZh: string
    labelEn: string
}

interface TransactionTypeOption {
    value: TransactionType
    labelZh: string
    labelEn: string
}

export const ITEM_CATEGORIES: CategoryOption[] = [
    { value: "MOTOR", labelZh: "馬達", labelEn: "Motor" },
    { value: "SENSOR", labelZh: "感測器", labelEn: "Sensor" },
    { value: "PNEUMATIC", labelZh: "氣壓", labelEn: "Pneumatic" },
    { value: "CONTROLLER", labelZh: "控制器", labelEn: "Controller" },
    { value: "HARDWARE", labelZh: "五金", labelEn: "Hardware" },
    { value: "RAW_MATERIAL", labelZh: "原料", labelEn: "Raw Material" },
    { value: "TOOL", labelZh: "工具", labelEn: "Tool" },
]

export const TRANSACTION_TYPES: TransactionTypeOption[] = [
    { value: "PURCHASE_IN", labelZh: "採購入庫", labelEn: "Purchase In" },
    { value: "PROJECT_USE", labelZh: "專案領用", labelEn: "Project Use" },
    { value: "DAMAGED", labelZh: "損壞報廢", labelEn: "Damaged" },
    { value: "LOST", labelZh: "遺失", labelEn: "Lost" },
    { value: "AUDIT_ADJUSTMENT", labelZh: "盤點調整", labelEn: "Audit Adjustment" },
]

// ========== 工具函式 ==========

export function getCategoryLabel(category: string, language: "zh" | "en"): string {
    const found = ITEM_CATEGORIES.find((c) => c.value === category)
    return found ? (language === "zh" ? found.labelZh : found.labelEn) : category
}

export function getTransactionTypeLabel(type: string, language: "zh" | "en"): string {
    const found = TRANSACTION_TYPES.find((t) => t.value === type)
    return found ? (language === "zh" ? found.labelZh : found.labelEn) : type
}

export function isLowStock(item: InventoryItem): boolean {
    return item.currentQuantity <= item.safetyStockLevel
}
