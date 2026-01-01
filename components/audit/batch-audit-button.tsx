"use client";

/**
 * ?πÊ¨°ÂØ©Ê†∏?âÈ?
 * ‰∏ÄÊ¨°ÂØ©?∏Â†±Â∏≥ÂñÆ?ßÊ??âÈ???
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
            console.error("?πÊ¨°ÂØ©Ê†∏Â§±Ê?:", error);
            setResult({
                success: false,
                totalItems: 0,
                auditedItems: 0,
                passedItems: 0,
                failedItems: 0,
                results: [],
                error: "?πÊ¨°ÂØ©Ê†∏Â§±Ê?",
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
                        ?πÊ¨°ÂØ©Ê†∏‰∏?..
                    </>
                ) : (
                    <>
                        <FileStack className="h-4 w-4" />
                        ?πÊ¨°ÂØ©Ê†∏?®ÈÉ®?∂Ê?
                    </>
                )}
            </Button>

            {/* ?πÊ¨°ÂØ©Ê†∏ÁµêÊ? Modal */}
            <Modal
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <FileStack className="h-5 w-5" />
                        ?πÊ¨°ÂØ©Ê†∏ÁµêÊ?
                    </span>
                }
            >
                {result && (
                    <div className="space-y-4">
                        {/* Á∏ΩË¶Ω */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="rounded-lg bg-muted p-2">
                                <div className="text-2xl font-bold">{result.totalItems}</div>
                                <div className="text-xs text-muted-foreground">Á∏ΩÈ???/div>
                            </div>
                            <div className="rounded-lg bg-muted p-2">
                                <div className="text-2xl font-bold">{result.auditedItems}</div>
                                <div className="text-xs text-muted-foreground">Â∑≤ÂØ©??/div>
                            </div>
                            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {result.passedItems}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">?öÈ?</div>
                            </div>
                            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {result.failedItems}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400">?™ÈÄöÈ?</div>
                            </div>
                        </div>

                        {/* ?≤Â∫¶Ê¢?*/}
                        {result.auditedItems > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">?öÈ???/span>
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

                        {/* ?ÑÈ??ÆÁ???*/}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">?ÑÈ??ÆÂØ©?∏Á???/h4>
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
                                                    {item.result.issues[0]?.message || "?°Ê?ÂØ©Ê†∏"}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ?ØË™§Ë®äÊÅØ */}
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

