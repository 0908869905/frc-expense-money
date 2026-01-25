"use client"

import { useLanguage } from "@/lib/language-context"
import { QRCodeSVG } from "qrcode.react"
import { X, Printer, Download } from "lucide-react"
import { useRef } from "react"

interface InventoryItem {
    id: string
    name: string
    sku: string
    category: string
    storageLocation: string
    currentQuantity: number
    safetyStockLevel: number
}

interface InventoryQRModalProps {
    item: InventoryItem
    onClose: () => void
}

export function InventoryQRModal({ item, onClose }: InventoryQRModalProps) {
    const { language } = useLanguage()
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        const printContent = printRef.current
        if (!printContent) return

        const printWindow = window.open("", "_blank")
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${item.name} - QR Code</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .label {
                        border: 2px solid #000;
                        padding: 20px;
                        text-align: center;
                        max-width: 300px;
                    }
                    .qr-container {
                        margin-bottom: 15px;
                    }
                    .sku {
                        font-size: 18px;
                        font-weight: bold;
                        font-family: monospace;
                        margin-bottom: 8px;
                    }
                    .name {
                        font-size: 14px;
                        margin-bottom: 5px;
                    }
                    .location {
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body {
                            min-height: auto;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="qr-container">
                        ${printContent.querySelector("svg")?.outerHTML || ""}
                    </div>
                    <div class="sku">${item.sku}</div>
                    <div class="name">${item.name}</div>
                    <div class="location">${item.storageLocation}</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handleDownload = () => {
        const svg = printRef.current?.querySelector("svg")
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            const pngFile = canvas.toDataURL("image/png")

            const downloadLink = document.createElement("a")
            downloadLink.download = `${item.sku}-qr.png`
            downloadLink.href = pngFile
            downloadLink.click()
        }

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl p-6 w-full max-w-sm mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                        {language === "zh" ? "QR Code" : "QR Code"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* QR Code */}
                <div
                    ref={printRef}
                    className="flex flex-col items-center p-6 bg-white rounded-lg border mb-4"
                >
                    <QRCodeSVG
                        value={item.sku}
                        size={180}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                {/* Item Info */}
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {language === "zh" ? "料號" : "SKU"}
                        </span>
                        <span className="font-mono font-semibold">{item.sku}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {language === "zh" ? "名稱" : "Name"}
                        </span>
                        <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {language === "zh" ? "位置" : "Location"}
                        </span>
                        <span>{item.storageLocation}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {language === "zh" ? "數量" : "Quantity"}
                        </span>
                        <span className="font-semibold">{item.currentQuantity}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
                    >
                        <Download className="h-4 w-4" />
                        {language === "zh" ? "下載" : "Download"}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Printer className="h-4 w-4" />
                        {language === "zh" ? "列印標籤" : "Print Label"}
                    </button>
                </div>
            </div>
        </div>
    )
}
