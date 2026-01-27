"use client"

import { useLanguage } from "@/lib/language-context"
import { useState, useTransition } from "react"
import { Package, AlertTriangle, Plus, Edit2, Trash2, ArrowUpDown, ExternalLink, Search, ArrowDownToLine, ArrowUpFromLine, QrCode, ScanLine } from "lucide-react"
import { adjustStock, createItem, updateItem, deleteItem } from "@/app/actions/inventory"
import { ItemCategory, TransactionType } from "@prisma/client"
import { InventoryQRModal } from "./inventory-qr-modal"
import { useMessage } from "@/hooks/useMessage"
import Link from "next/link"
import type { Language } from "@/lib/constants/expense-status"
import {
    type InventoryItem,
    ITEM_CATEGORIES,
    TRANSACTION_TYPES,
    getCategoryLabel,
} from "@/types/inventory"

interface InventoryContentProps {
    items: InventoryItem[]
    restockItems: InventoryItem[]
    userRole: string
}

type ModalType = "add" | "edit" | "adjust" | "stockIn" | "stockOut" | "qr" | null

interface FormData {
    name: string
    sku: string
    category: ItemCategory
    storageLocation: string
    currentQuantity: number
    safetyStockLevel: number
    vendorLink: string
}

interface AdjustData {
    amount: number
    type: TransactionType
    projectId: string
}

const INITIAL_FORM_DATA: FormData = {
    name: "",
    sku: "",
    category: "HARDWARE",
    storageLocation: "",
    currentQuantity: 0,
    safetyStockLevel: 0,
    vendorLink: "",
}

export function InventoryContent({ items, restockItems, userRole }: InventoryContentProps): JSX.Element {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [localItems, setLocalItems] = useState(items)
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [locationFilter, setLocationFilter] = useState<string>("all")
    const { message, showMessage } = useMessage()

    const [activeModal, setActiveModal] = useState<ModalType>(null)
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
    const [adjustData, setAdjustData] = useState<AdjustData>({ amount: 0, type: "PURCHASE_IN", projectId: "" })

    const isAdmin = userRole === "ADMIN"
    const uniqueLocations = Array.from(new Set(localItems.map(item => item.storageLocation).filter(Boolean))).sort()

    const filteredItems = localItems.filter((item) => {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
            item.name.toLowerCase().includes(searchLower) ||
            item.sku.toLowerCase().includes(searchLower) ||
            item.storageLocation?.toLowerCase().includes(searchLower)
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
        const matchesLocation = locationFilter === "all" || item.storageLocation === locationFilter
        return matchesSearch && matchesCategory && matchesLocation
    })

    function closeModal(): void {
        setActiveModal(null)
        setSelectedItem(null)
    }

    function openModal(type: ModalType, item?: InventoryItem): void {
        setSelectedItem(item ?? null)
        setActiveModal(type)

        if (type === "add") {
            setFormData(INITIAL_FORM_DATA)
        } else if (type === "edit" && item) {
            setFormData({
                name: item.name,
                sku: item.sku,
                category: item.category as ItemCategory,
                storageLocation: item.storageLocation,
                currentQuantity: item.currentQuantity,
                safetyStockLevel: item.safetyStockLevel,
                vendorLink: item.vendorLink || "",
            })
        } else if (type === "adjust" && item) {
            setAdjustData({ amount: 0, type: "PURCHASE_IN", projectId: "" })
        } else if (type === "stockIn" && item) {
            setAdjustData({ amount: 1, type: "PURCHASE_IN", projectId: "" })
        } else if (type === "stockOut" && item) {
            setAdjustData({ amount: 1, type: "PROJECT_USE", projectId: "" })
        }
    }

    async function handleAddItem(): Promise<void> {
        startTransition(async () => {
            const result = await createItem(formData)
            if (result.success) {
                showMessage("success", result.message || "成功")
                closeModal()
                window.location.reload()
            } else {
                showMessage("error", result.message || "失敗")
            }
        })
    }

    async function handleUpdateItem(): Promise<void> {
        if (!selectedItem) return
        startTransition(async () => {
            const result = await updateItem(selectedItem.id, formData)
            if (result.success) {
                showMessage("success", result.message || "成功")
                closeModal()
                window.location.reload()
            } else {
                showMessage("error", result.message || "失敗")
            }
        })
    }

    async function handleDeleteItem(itemId: string): Promise<void> {
        const confirmMessage = language === "zh" ? "確定要刪除此零件嗎？" : "Delete this item?"
        if (!confirm(confirmMessage)) return

        startTransition(async () => {
            const result = await deleteItem(itemId)
            if (result.success) {
                setLocalItems((prev) => prev.filter((i) => i.id !== itemId))
                showMessage("success", result.message || "已刪除")
            } else {
                showMessage("error", result.message || "失敗")
            }
        })
    }

    async function handleAdjustStock(): Promise<void> {
        if (!selectedItem) return
        startTransition(async () => {
            const result = await adjustStock(
                selectedItem.id,
                adjustData.amount,
                adjustData.type,
                adjustData.projectId || undefined
            )
            if (result.success) {
                showMessage("success", result.message || "成功")
                closeModal()
                window.location.reload()
            } else {
                showMessage("error", result.message || "失敗")
            }
        })
    }

    async function handleQuickStock(isStockIn: boolean): Promise<void> {
        if (!selectedItem || adjustData.amount <= 0) return
        startTransition(async () => {
            const amount = isStockIn ? adjustData.amount : -adjustData.amount
            const type = isStockIn ? "PURCHASE_IN" : adjustData.type
            const result = await adjustStock(selectedItem.id, amount, type, adjustData.projectId || undefined)

            if (result.success) {
                const successMessage = isStockIn
                    ? (language === "zh" ? "入庫成功" : "Stock in successful")
                    : (language === "zh" ? "領用成功" : "Stock out successful")
                showMessage("success", result.message || successMessage)
                closeModal()
                window.location.reload()
            } else {
                showMessage("error", result.message || "失敗")
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {language === "zh" ? "庫存管理" : "Inventory Management"}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === "zh" ? "管理 FRC 零件庫存" : "Manage FRC parts inventory"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/inventory/scan"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                    >
                        <ScanLine className="h-4 w-4" />
                        {language === "zh" ? "掃描" : "Scan"}
                    </Link>
                    <button
                        onClick={() => openModal("add")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        {language === "zh" ? "新增零件" : "Add Item"}
                    </button>
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

            {/* Restock Alert */}
            {restockItems.length > 0 && (
                <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold text-yellow-800">
                            {language === "zh" ? "需要補貨" : "Need Restock"} ({restockItems.length})
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {restockItems.map((item) => (
                            <span
                                key={item.id}
                                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                            >
                                {item.name} ({item.currentQuantity}/{item.safetyStockLevel})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={language === "zh" ? "搜尋品名、料號或位置..." : "Search name, SKU or location..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-background"
                >
                    <option value="all">{language === "zh" ? "所有類別" : "All Categories"}</option>
                    {ITEM_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {language === "zh" ? cat.labelZh : cat.labelEn}
                        </option>
                    ))}
                </select>
                <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-background"
                >
                    <option value="all">{language === "zh" ? "所有位置" : "All Locations"}</option>
                    {uniqueLocations.map((loc) => (
                        <option key={loc} value={loc}>
                            {loc}
                        </option>
                    ))}
                </select>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border bg-card overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "品名" : "Name"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "料號" : "SKU"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "類別" : "Category"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "位置" : "Location"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "數量" : "Qty"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "安全庫存" : "Safety"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "操作" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    {language === "zh" ? "沒有零件" : "No items"}
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/20">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4 text-muted-foreground font-mono text-sm">{item.sku}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-muted rounded text-xs">
                                            {getCategoryLabel(item.category, language as Language)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{item.storageLocation}</td>
                                    <td className="p-4">
                                        <span
                                            className={`font-semibold ${item.currentQuantity <= item.safetyStockLevel
                                                ? "text-red-600"
                                                : "text-foreground"
                                                }`}
                                        >
                                            {item.currentQuantity}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{item.safetyStockLevel}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openModal("qr", item)}
                                                className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
                                                title="QR Code"
                                            >
                                                <QrCode className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openModal("stockIn", item)}
                                                className="p-1.5 rounded hover:bg-green-100 text-green-600"
                                                title={language === "zh" ? "入庫" : "Stock In"}
                                            >
                                                <ArrowDownToLine className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openModal("stockOut", item)}
                                                className="p-1.5 rounded hover:bg-orange-100 text-orange-600"
                                                title={language === "zh" ? "領用" : "Stock Out"}
                                            >
                                                <ArrowUpFromLine className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openModal("adjust", item)}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={language === "zh" ? "進階調整" : "Advanced"}
                                            >
                                                <ArrowUpDown className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openModal("edit", item)}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={language === "zh" ? "編輯" : "Edit"}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {item.vendorLink && (
                                                <a
                                                    href={item.vendorLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded hover:bg-muted"
                                                    title={language === "zh" ? "購買連結" : "Vendor Link"}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 rounded text-red-600 hover:bg-red-50"
                                                    title={language === "zh" ? "刪除" : "Delete"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {(activeModal === "add" || activeModal === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {activeModal === "add"
                                ? (language === "zh" ? "新增零件" : "Add Item")
                                : (language === "zh" ? "編輯零件" : "Edit Item")}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "品名" : "Name"}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "料號 (SKU)" : "SKU"}
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="REV-21-1650"
                                    className="w-full px-3 py-2 border rounded-lg font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "類別" : "Category"}
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value as ItemCategory })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    {ITEM_CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {language === "zh" ? cat.labelZh : cat.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "儲存位置" : "Storage Location"}
                                </label>
                                <input
                                    type="text"
                                    value={formData.storageLocation}
                                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                                    placeholder="A櫃-3層"
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            {activeModal === "add" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {language === "zh" ? "初始數量" : "Initial Quantity"}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.currentQuantity}
                                        onChange={(e) =>
                                            setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "安全庫存水位" : "Safety Stock Level"}
                                </label>
                                <input
                                    type="number"
                                    value={formData.safetyStockLevel}
                                    onChange={(e) =>
                                        setFormData({ ...formData, safetyStockLevel: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "購買連結" : "Vendor Link"}
                                </label>
                                <input
                                    type="url"
                                    value={formData.vendorLink}
                                    onChange={(e) => setFormData({ ...formData, vendorLink: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "取消" : "Cancel"}
                            </button>
                            <button
                                onClick={activeModal === "add" ? handleAddItem : handleUpdateItem}
                                disabled={isPending}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isPending
                                    ? (language === "zh" ? "處理中..." : "Processing...")
                                    : (language === "zh" ? "儲存" : "Save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {activeModal === "adjust" && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-2">
                            {language === "zh" ? "調整庫存" : "Adjust Stock"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {selectedItem.name} ({language === "zh" ? "目前" : "Current"}: {selectedItem.currentQuantity})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "異動類型" : "Transaction Type"}
                                </label>
                                <select
                                    value={adjustData.type}
                                    onChange={(e) =>
                                        setAdjustData({ ...adjustData, type: e.target.value as TransactionType })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    {TRANSACTION_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {language === "zh" ? t.labelZh : t.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "數量 (正=入庫，負=出庫)" : "Amount (+in/-out)"}
                                </label>
                                <input
                                    type="number"
                                    value={adjustData.amount}
                                    onChange={(e) =>
                                        setAdjustData({ ...adjustData, amount: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            {adjustData.type === "PROJECT_USE" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {language === "zh" ? "專案 ID" : "Project ID"}
                                    </label>
                                    <input
                                        type="text"
                                        value={adjustData.projectId}
                                        onChange={(e) => setAdjustData({ ...adjustData, projectId: e.target.value })}
                                        placeholder="2024-Robot"
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "取消" : "Cancel"}
                            </button>
                            <button
                                onClick={handleAdjustStock}
                                disabled={isPending || adjustData.amount === 0}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isPending
                                    ? (language === "zh" ? "處理中..." : "Processing...")
                                    : (language === "zh" ? "確認調整" : "Confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock In Modal */}
            {activeModal === "stockIn" && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-sm mx-4">
                        <h2 className="text-xl font-bold mb-2 text-green-600 flex items-center gap-2">
                            <ArrowDownToLine className="h-5 w-5" />
                            {language === "zh" ? "零件入庫" : "Stock In"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {selectedItem.name} ({language === "zh" ? "目前" : "Current"}: {selectedItem.currentQuantity})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "入庫數量" : "Quantity to Add"}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustData.amount}
                                    onChange={(e) =>
                                        setAdjustData({ ...adjustData, amount: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-center text-xl font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "取消" : "Cancel"}
                            </button>
                            <button
                                onClick={() => handleQuickStock(true)}
                                disabled={isPending || adjustData.amount <= 0}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {isPending
                                    ? (language === "zh" ? "處理中..." : "Processing...")
                                    : (language === "zh" ? "確認入庫" : "Confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock Out Modal */}
            {activeModal === "stockOut" && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-sm mx-4">
                        <h2 className="text-xl font-bold mb-2 text-orange-600 flex items-center gap-2">
                            <ArrowUpFromLine className="h-5 w-5" />
                            {language === "zh" ? "零件領用" : "Stock Out"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {selectedItem.name} ({language === "zh" ? "目前" : "Current"}: {selectedItem.currentQuantity})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "領用數量" : "Quantity to Take"}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedItem.currentQuantity}
                                    value={adjustData.amount}
                                    onChange={(e) =>
                                        setAdjustData({ ...adjustData, amount: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-center text-xl font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "用途/專案" : "Purpose/Project"}
                                </label>
                                <input
                                    type="text"
                                    value={adjustData.projectId}
                                    onChange={(e) => setAdjustData({ ...adjustData, projectId: e.target.value })}
                                    placeholder={language === "zh" ? "例如: 2024 機器人" : "e.g. 2024 Robot"}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "取消" : "Cancel"}
                            </button>
                            <button
                                onClick={() => handleQuickStock(false)}
                                disabled={isPending || adjustData.amount <= 0 || adjustData.amount > selectedItem.currentQuantity}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                                {isPending
                                    ? (language === "zh" ? "處理中..." : "Processing...")
                                    : (language === "zh" ? "確認領用" : "Confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {activeModal === "qr" && selectedItem && (
                <InventoryQRModal
                    item={selectedItem}
                    onClose={closeModal}
                />
            )}
        </div>
    )
}
