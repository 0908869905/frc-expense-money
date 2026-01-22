"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { scanInvoice, OCRResult } from "@/app/actions/ocr";
import { useLanguage } from "@/lib/context/language-context";
import { cn } from "@/lib/utils/utils";

interface InvoiceScannerProps {
    onScanComplete?: (data: OCRResult["data"]) => void;
    onError?: (error: string) => void;
    className?: string;
}

export function InvoiceScanner({ onScanComplete, onError, className }: InvoiceScannerProps) {
    const { t } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<OCRResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        // 驗�?檔�?類�?
        if (!file.type.startsWith("image/")) {
            onError?.("請選?��??��?�?);
            return;
        }

        // 驗�?檔�?大�? (5MB)
        if (file.size > 5 * 1024 * 1024) {
            onError?.("?��?大�?不能超�? 5MB");
            return;
        }

        // 轉�???Base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            setPreview(base64);
            setIsScanning(true);
            setResult(null);

            try {
                const scanResult = await scanInvoice(base64);
                setResult(scanResult);

                if (scanResult.success && scanResult.data) {
                    onScanComplete?.(scanResult.data);
                } else {
                    onError?.(scanResult.error || "辨�?失�?");
                }
            } catch (error) {
                onError?.("OCR ?��??��??��?使用");
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    }, [onScanComplete, onError]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const clearPreview = () => {
        setPreview(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* 上傳?�??*/}
            {!preview ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                        ?�放?�票?��??��??��???
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        ?�援 JPG?�PNG?�WEBP (?��?5MB)
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                        }}
                    />
                </div>
            ) : (
                <div className="relative">
                    {/* ?��??�覽 */}
                    <div className="relative rounded-xl overflow-hidden border">
                        <img
                            src={preview}
                            alt="Invoice preview"
                            className="w-full max-h-64 object-contain bg-muted"
                        />
                        <button
                            onClick={clearPreview}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X className="h-4 w-4 text-white" />
                        </button>
                    </div>

                    {/* ?��??�??*/}
                    {isScanning && (
                        <div className="mt-4 flex items-center gap-2 text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">�?��辨�??�票...</span>
                        </div>
                    )}

                    {/* ?��?結�? */}
                    {result && (
                        <div className={cn(
                            "mt-4 p-4 rounded-lg",
                            result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                        )}>
                            <div className="flex items-start gap-2">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    {result.success && result.data ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-green-800">
                                                辨�??��? (信�?�? {Math.round((result.data.confidence || 0) * 100)}%)
                                            </p>
                                            <div className="text-sm text-green-700 space-y-1">
                                                {result.data.invoiceNumber && (
                                                    <p>?�票?�碼: <strong>{result.data.invoiceNumber}</strong></p>
                                                )}
                                                {result.data.date && (
                                                    <p>?��?: <strong>{result.data.date}</strong></p>
                                                )}
                                                {result.data.totalAmount !== null && (
                                                    <p>?��?: <strong>NT$ {result.data.totalAmount}</strong></p>
                                                )}
                                                {result.data.vendorName && (
                                                    <p>?�家: <strong>{result.data.vendorName}</strong></p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-800">
                                            {result.error || "?��?辨�??�票?�容"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

