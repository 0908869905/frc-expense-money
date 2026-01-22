"use client";

/**
 * 批次審核按鈕
 * 一次審核報帳單的所有收據
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileStack,
} from "lucide-react";
import { batchAuditExpenseReport } from "@/app/actions/ocr";
import type { BatchAuditResult } from "@/types/audit";

interface BatchAuditButtonProps {
    reportId: string;
    reportTitle?: string;
    onAuditComplete?: (result: BatchAuditResult) => void;
}

export function BatchAuditButton({
    reportId,
    reportTitle,
    onAuditComplete,
}: BatchAuditButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BatchAuditResult | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleAudit = async () => {
        setIsLoading(true);
        try {
            const auditResult = await batchAuditExpenseReport(reportId);
            setResult(auditResult);
            setDialogOpen(true);
            onAuditComplete?.(auditResult);
        } catch (error) {
            console.error("批次審核失敗:", error);
            setResult({
                success: false,
                totalItems: 0,
                auditedItems: 0,
                passedItems: 0,
                failedItems: 0,
                results: [],
                error: "批次審核失敗",
            });
            setDialogOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (isValid: boolean | undefined, hasError: boolean) => {
        if (hasError) return <XCircle className="h-4 w-4 text-red-500" />;
        if (isValid === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (isValid === false) return <XCircle className="h-4 w-4 text-red-500" />;
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={handleAudit}
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        批次審核中...
                    </>
                ) : (
                    <>
                        <FileStack className="h-4 w-4" />
                        批次審核全部收據
                    </>
                )}
            </Button>

            {/* 批次審核結果 Modal */}
            <Modal
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <FileStack className="h-5 w-5" />
                        批次審核結果
                    </span>
                }
            >
                {result && (
                    <div className="space-y-4">
                        {/* 總覽 */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="rounded-lg bg-muted p-2">
                                <div className="text-2xl font-bold">{result.totalItems}</div>
                                <div className="text-xs text-muted-foreground">總項目</div>
                            </div>
                            <div className="rounded-lg bg-muted p-2">
                                <div className="text-2xl font-bold">{result.auditedItems}</div>
                                <div className="text-xs text-muted-foreground">已審核</div>
                            </div>
                            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {result.passedItems}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">通過</div>
                            </div>
                            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {result.failedItems}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400">不通過</div>
                            </div>
                        </div>

                        {/* 進度條 */}
                        {result.auditedItems > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">通過率</span>
                                    <span className="font-medium">
                                        {Math.round((result.passedItems / result.auditedItems) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-red-200 dark:bg-red-900/50 overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{
                                            width: `${(result.passedItems / result.auditedItems) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 各項目詳情 */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">各項審核詳情</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {result.results.map((item) => (
                                    <div
                                        key={item.itemId}
                                        className="flex items-center justify-between rounded-lg border p-2"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {getStatusIcon(
                                                item.result.isValid,
                                                !item.result.success
                                            )}
                                            <span className="text-sm truncate">
                                                {item.description}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {item.result.success ? (
                                                <Badge
                                                    variant={item.result.isValid ? "default" : "destructive"}
                                                    className="text-xs"
                                                >
                                                    {item.result.matchScore}%
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs">
                                                    {item.result.issues[0]?.message || "無法審核"}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 錯誤訊息 */}
                        {result.error && (
                            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    {result.error}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
