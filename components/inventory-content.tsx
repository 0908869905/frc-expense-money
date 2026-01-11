"use client"

import { useLanguage } from "@/lib/language-context"
import { useState, useTransition } from "react"
import { Package, AlertTriangle, Plus, Edit2, Trash2, ArrowUpDown, ExternalLink, Search, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { adjustStock, createItem, updateItem, deleteItem } from "@/app/actions/inventory"
import { ItemCategory, TransactionType } from "@prisma/client"

interface InventoryItem {
    id: string
    name: string
    sku: string
    category: string
    storageLocation: string
    currentQuantity: number
    safetyStockLevel: number
    vendorLink: string | null
    transactions?: any[]
}

interface InventoryContentProps {
    items: InventoryItem[]
    restockItems: InventoryItem[]
    userRole: string
}

const CATEGORIES: { value: ItemCategory; labelZh: string; labelEn: string }[] = [
    { value: "MOTOR", labelZh: "擐祇?", labelEn: "Motor" },
    { value: "SENSOR", labelZh: "?葫??, labelEn: "Sensor" },
    { value: "PNEUMATIC", labelZh: "瘞??", labelEn: "Pneumatic" },
    { value: "CONTROLLER", labelZh: "?批??, labelEn: "Controller" },
    { value: "HARDWARE", labelZh: "鈭?", labelEn: "Hardware" },
    { value: "RAW_MATERIAL", labelZh: "??", labelEn: "Raw Material" },
    { value: "TOOL", labelZh: "撌亙", labelEn: "Tool" },
]

const TRANSACTION_TYPES: { value: TransactionType; labelZh: string; labelEn: string }[] = [
    { value: "PURCHASE_IN", labelZh: "?∟頃?亙澈", labelEn: "Purchase In" },
    { value: "PROJECT_USE", labelZh: "撠??", labelEn: "Project Use" },
    { value: "DAMAGED", labelZh: "???勗誥", labelEn: "Damaged" },
    { value: "LOST", labelZh: "?箏仃", labelEn: "Lost" },
    { value: "AUDIT_ADJUSTMENT", labelZh: "?日?隤踵", labelEn: "Audit Adjustment" },
]

export function InventoryContent({ items, restockItems, userRole }: InventoryContentProps) {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [localItems, setLocalItems] = useState(items)
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showAdjustModal, setShowAdjustModal] = useState(false)
    const [showStockInModal, setShowStockInModal] = useState(false)
    const [showStockOutModal, setShowStockOutModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category: "HARDWARE" as ItemCategory,
        storageLocation: "",
        currentQuantity: 0,
        safetyStockLevel: 0,
        vendorLink: "",
    })
    const [adjustData, setAdjustData] = useState({
        amount: 0,
        type: "PURCHASE_IN" as TransactionType,
        projectId: "",
    })

    const isAdmin = userRole === "ADMIN"

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const getCategoryLabel = (category: string) => {
        const cat = CATEGORIES.find((c) => c.value === category)
        return cat ? (language === "zh" ? cat.labelZh : cat.labelEn) : category
    }

    const getTypeLabel = (type: string) => {
        const t = TRANSACTION_TYPES.find((tt) => tt.value === type)
        return t ? (language === "zh" ? t.labelZh : t.labelEn) : type
    }

    // Filter items
    const filteredItems = localItems.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    // Handlers
    const handleAddItem = async () => {
        startTransition(async () => {
            const result = await createItem(formData)
            if (result.success) {
                showMessage("success", result.message || "??")
                setShowAddModal(false)
                window.location.reload()
            } else {
                showMessage("error", result.message || "憭望?")
            }
        })
    }

    const handleUpdateItem = async () => {
        if (!selectedItem) return
        startTransition(async () => {
            const result = await updateItem(selectedItem.id, formData)
            if (result.success) {
                showMessage("success", result.message || "??")
                setShowEditModal(false)
                window.location.reload()
            } else {
                showMessage("error", result.message || "憭望?")
            }
        })
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm(language === "zh" ? "蝣箏?閬?斗迨?嗡辣??" : "Delete this item?")) return
        startTransition(async () => {
            const result = await deleteItem(itemId)
            if (result.success) {
                setLocalItems((prev) => prev.filter((i) => i.id !== itemId))
                showMessage("success", result.message || "撌脣??)
            } else {
                showMessage("error", result.message || "憭望?")
            }
        })
    }

    const handleAdjustStock = async () => {
        if (!selectedItem) return
        startTransition(async () => {
            const result = await adjustStock(
                selectedItem.id,
                adjustData.amount,
                adjustData.type,
                adjustData.projectId || undefined
            )
            if (result.success) {
                showMessage("success", result.message || "??")
                setShowAdjustModal(false)
                window.location.reload()
            } else {
                showMessage("error", result.message || "憭望?")
            }
        })
    }

    const openAddModal = () => {
        setFormData({
            name: "",
            sku: "",
            category: "HARDWARE",
            storageLocation: "",
            currentQuantity: 0,
            safetyStockLevel: 0,
            vendorLink: "",
        })
        setShowAddModal(true)
    }

    const openEditModal = (item: InventoryItem) => {
        setSelectedItem(item)
        setFormData({
            name: item.name,
            sku: item.sku,
            category: item.category as ItemCategory,
            storageLocation: item.storageLocation,
            currentQuantity: item.currentQuantity,
            safetyStockLevel: item.safetyStockLevel,
            vendorLink: item.vendorLink || "",
        })
        setShowEditModal(true)
    }

    const openAdjustModal = (item: InventoryItem) => {
        setSelectedItem(item)
        setAdjustData({ amount: 0, type: "PURCHASE_IN", projectId: "" })
        setShowAdjustModal(true)
    }

    const openStockInModal = (item: InventoryItem) => {
        setSelectedItem(item)
        setAdjustData({ amount: 1, type: "PURCHASE_IN", projectId: "" })
        setShowStockInModal(true)
    }

    const openStockOutModal = (item: InventoryItem) => {
        setSelectedItem(item)
        setAdjustData({ amount: 1, type: "PROJECT_USE", projectId: "" })
        setShowStockOutModal(true)
    }

    const handleQuickStockIn = async () => {
        if (!selectedItem || adjustData.amount <= 0) return
        startTransition(async () => {
            const result = await adjustStock(
                selectedItem.id,
                adjustData.amount,
                "PURCHASE_IN",
                undefined
            )
            if (result.success) {
                showMessage("success", result.message || "?亙澈??")
                setShowStockInModal(false)
                window.location.reload()
            } else {
                showMessage("error", result.message || "憭望?")
            }
        })
    }

    const handleQuickStockOut = async () => {
        if (!selectedItem || adjustData.amount <= 0) return
        startTransition(async () => {
            const result = await adjustStock(
                selectedItem.id,
                -adjustData.amount, // 鞎銵函內?箏澈
                adjustData.type,
                adjustData.projectId || undefined
            )
            if (result.success) {
                showMessage("success", result.message || "???")
                setShowStockOutModal(false)
                window.location.reload()
            } else {
                showMessage("error", result.message || "憭望?")
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {language === "zh" ? "摨怠?蝞∠?" : "Inventory Management"}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === "zh" ? "蝞∠? FRC ?嗡辣摨怠?" : "Manage parts inventory"}
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    {language === "zh" ? "?啣??嗡辣" : "Add Item"}
                </button>
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
                            {language === "zh" ? "?閬?鞎? : "Need Restock"} ({restockItems.length})
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
                        placeholder={language === "zh" ? "????????.." : "Search name or SKU..."}
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
                    <option value="all">{language === "zh" ? "????? : "All Categories"}</option>
                    {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {language === "zh" ? cat.labelZh : cat.labelEn}
                        </option>
                    ))}
                </select>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border bg-card overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "??" : "Name"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "??" : "SKU"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "憿" : "Category"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "雿蔭" : "Location"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "?賊?" : "Qty"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "摰摨怠?" : "Safety"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "??" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    {language === "zh" ? "瘝??嗡辣" : "No items"}
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/20">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4 text-muted-foreground font-mono text-sm">{item.sku}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-muted rounded text-xs">
                                            {getCategoryLabel(item.category)}
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
                                                onClick={() => openStockInModal(item)}
                                                className="p-1.5 rounded hover:bg-green-100 text-green-600"
                                                title={language === "zh" ? "?亙澈" : "Stock In"}
                                            >
                                                <ArrowDownToLine className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openStockOutModal(item)}
                                                className="p-1.5 rounded hover:bg-orange-100 text-orange-600"
                                                title={language === "zh" ? "?" : "Stock Out"}
                                            >
                                                <ArrowUpFromLine className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openAdjustModal(item)}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={language === "zh" ? "?脤?隤踵" : "Advanced"}
                                            >
                                                <ArrowUpDown className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={language === "zh" ? "蝺刻摩" : "Edit"}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {item.vendorLink && (
                                                <a
                                                    href={item.vendorLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded hover:bg-muted"
                                                    title={language === "zh" ? "鞈潸眺???" : "Vendor Link"}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 rounded text-red-600 hover:bg-red-50"
                                                    title={language === "zh" ? "?芷" : "Delete"}
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
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {showAddModal
                                ? language === "zh"
                                    ? "?啣??嗡辣"
                                    : "Add Item"
                                : language === "zh"
                                    ? "蝺刻摩?嗡辣"
                                    : "Edit Item"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "??" : "Name"}
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
                                    {language === "zh" ? "?? (SKU)" : "SKU"}
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
                                    {language === "zh" ? "憿" : "Category"}
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value as ItemCategory })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {language === "zh" ? cat.labelZh : cat.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "?脣?雿蔭" : "Storage Location"}
                                </label>
                                <input
                                    type="text"
                                    value={formData.storageLocation}
                                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                                    placeholder="A瑹?3撅?
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            {showAddModal && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {language === "zh" ? "???賊?" : "Initial Quantity"}
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
                                    {language === "zh" ? "摰摨怠?瘞港?" : "Safety Stock Level"}
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
                                    {language === "zh" ? "鞈潸眺???" : "Vendor Link"}
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
                                onClick={() => {
                                    setShowAddModal(false)
                                    setShowEditModal(false)
                                }}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "??" : "Cancel"}
                            </button>
                            <button
                                onClick={showAddModal ? handleAddItem : handleUpdateItem}
                                disabled={isPending}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isPending
                                    ? language === "zh"
                                        ? "??銝?.."
                                        : "Processing..."
                                    : language === "zh"
                                        ? "?脣?"
                                        : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {showAdjustModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-2">
                            {language === "zh" ? "隤踵摨怠?" : "Adjust Stock"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {selectedItem.name} ({language === "zh" ? "?桀?" : "Current"}: {selectedItem.currentQuantity})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "?啣?憿?" : "Transaction Type"}
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
                                    {language === "zh" ? "?賊? (甇??亙澈嚗?=?箏澈)" : "Amount (+in/-out)"}
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
                                        {language === "zh" ? "撠? ID" : "Project ID"}
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
                                onClick={() => setShowAdjustModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "??" : "Cancel"}
                            </button>
                            <button
                                onClick={handleAdjustStock}
                                disabled={isPending || adjustData.amount === 0}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isPending
                                    ? language === "zh"
                                        ? "??銝?.."
                                        : "Processing..."
                                    : language === "zh"
                                        ? "蝣箄?隤踵"
                                        : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock In Modal */}
            {showStockInModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-sm mx-4">
                        <h2 className="text-xl font-bold mb-2 text-green-600 flex items-center gap-2">
                            <ArrowDownToLine className="h-5 w-5" />
                            {language === "zh" ? "?嗡辣?亙澈" : "Stock In"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {selectedItem.name} ({language === "zh" ? "?桀?" : "Current"}: {selectedItem.currentQuantity})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "?亙澈?賊?" : "Quantity to Add"}
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
                                onClick={() => setShowStockInModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "??" : "Cancel"}
                            </button>
                            <button
                                onClick={handleQuickStockIn}
                                disabled={isPending || adjustData.amount <= 0}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {isPending
                                    ? language === "zh"
                                        ? "??銝?.."
                                        : "Processing..."
                                    : language === "zh"
                                        ? "蝣箄??亙澈"
                                        : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock Out Modal */}
            {showStockOutModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-sm mx-4">
                        <h2 className="text-xl font-bold mb-2 text-orange-600 flex items-center gap-2">
                            <ArrowUpFromLine className="h-5 w-5" />
                            {language === "zh" ? "?嗡辣?" : "Stock Out"}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {selectedItem.name} ({language === "zh" ? "?桀?" : "Current"}: {selectedItem.currentQuantity})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {language === "zh" ? "??賊?" : "Quantity to Take"}
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
                                    {language === "zh" ? "?券?撠?" : "Purpose/Project"}
                                </label>
                                <input
                                    type="text"
                                    value={adjustData.projectId}
                                    onChange={(e) => setAdjustData({ ...adjustData, projectId: e.target.value })}
                                    placeholder={language === "zh" ? "靘?: 2024 璈鈭? : "e.g. 2024 Robot"}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowStockOutModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                            >
                                {language === "zh" ? "??" : "Cancel"}
                            </button>
                            <button
                                onClick={handleQuickStockOut}
                                disabled={isPending || adjustData.amount <= 0 || adjustData.amount > selectedItem.currentQuantity}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                                {isPending
                                    ? language === "zh"
                                        ? "??銝?.."
                                        : "Processing..."
                                    : language === "zh"
                                        ? "蝣箄??"
                                        : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

