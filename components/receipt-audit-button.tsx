"use client";

/**
 * 收據審核按鈕
 * 可放在費用項目旁，點擊後進行智慧審核
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ScanSearch, Loader2, Upload, CheckCircle2, XCircle } from "lucide-react";
import { auditExpenseItem } from "@/app/actions/ocr";
import { AuditResultDialog } from "@/components/audit-result-dialog";
import type { AuditResult } from "@/types/audit";

interface ReceiptAuditButtonProps {
    itemId: string;
    itemDescription: string;
    receiptUrl?: string | null;
    existingAuditStatus?: boolean | null;
    onAuditComplete?: (result: AuditResult) => void;
    variant?: "default" | "icon" | "compact";
}

export function ReceiptAuditButton({
    itemId,
    itemDescription,
    receiptUrl,
    existingAuditStatus,
    onAuditComplete,
    variant = "default",
}: ReceiptAuditButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AuditResult | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 處理檔案上傳
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("請選擇圖片檔案");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await performAudit(base64);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    // 執行審核
    const performAudit = async (imageSource: string) => {
        setIsLoading(true);
        try {
            const auditResult = await auditExpenseItem(itemId, imageSource);
            setResult(auditResult);
            setDialogOpen(true);
            onAuditComplete?.(auditResult);
        } catch (error) {
            console.error("審核失敗:", error);
            setResult({
                success: false,
                isValid: false,
                matchScore: 0,
                issues: [{
                    type: "INVALID_FORMAT",
                    severity: "error",
                    message: "審核過程發生錯誤",
                }],
                error: "審核失敗",
            });
            setDialogOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    // 點擊按鈕
    const handleClick = async () => {
        if (receiptUrl) {
            await performAudit(receiptUrl);
        } else {
            fileInputRef.current?.click();
        }
    };

    // 取得審核狀態顯示
    const getStatusIcon = () => {
        if (existingAuditStatus === true) {
            return <CheckCircle2 className="h-3 w-3 text-green-500" />;
        }
        if (existingAuditStatus === false) {
            return <XCircle className="h-3 w-3 text-red-500" />;
        }
        return null;
    };

    // 渲染按鈕
    const renderButton = () => {
        if (variant === "icon") {
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClick}
                    disabled={isLoading}
                    className="h-8 w-8"
                    title="智慧審核收據"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ScanSearch className="h-4 w-4" />
                    )}
                </Button>
            );
        }

        if (variant === "compact") {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClick}
                    disabled={isLoading}
                    className="gap-1"
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <>
                            <ScanSearch className="h-3 w-3" />
                            {getStatusIcon()}
                        </>
                    )}
                    審核
                </Button>
            );
        }

        // default variant
        return (
            <Button
                variant="outline"
                onClick={handleClick}
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        審核中...
                    </>
                ) : (
                    <>
                        {receiptUrl ? (
                            <ScanSearch className="h-4 w-4" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {receiptUrl ? "智慧審核收據" : "上傳並審核收據"}
                        {getStatusIcon()}
                    </>
                )}
            </Button>
        );
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            {renderButton()}
            <AuditResultDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                result={result}
                itemDescription={itemDescription}
            />
        </>
    );
}
