"use client";

/**
 * 審核結果 Dialog - 顯示收據審核的詳細結果
 */

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    FileText,
    Calendar,
    DollarSign,
    Store,
    Hash,
    type LucideIcon,
} from "lucide-react";
import type { AuditResult, AuditIssueSeverity } from "@/types/audit";

interface SeverityConfig {
    icon: LucideIcon;
    bgColor: string;
    textColor: string;
    borderColor: string;
}

const SEVERITY_CONFIG: Record<AuditIssueSeverity, SeverityConfig> = {
    error: {
        icon: XCircle,
        bgColor: "bg-red-100 dark:bg-red-900/30",
        textColor: "text-red-700 dark:text-red-400",
        borderColor: "border-red-200 dark:border-red-800",
    },
    warning: {
        icon: AlertTriangle,
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        textColor: "text-yellow-700 dark:text-yellow-400",
        borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    info: {
        icon: Info,
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        textColor: "text-blue-700 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
    },
};

function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
}

function getProgressColor(score: number): string {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
}

interface AuditResultDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    result: AuditResult | null;
    itemDescription?: string;
}

export function AuditResultDialog({
    open,
    onOpenChange,
    result,
    itemDescription,
}: AuditResultDialogProps): React.ReactElement | null {
    if (!result) return null;

    return (
        <Modal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={
                <span className="flex items-center gap-2">
                    {result.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    收據審核結果
                </span>
            }
        >
            <div className="space-y-4">
                {itemDescription && (
                    <p className="text-sm text-muted-foreground">{itemDescription}</p>
                )}

                {/* 匹配分數 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">匹配分數</span>
                        <span className={`text-2xl font-bold ${getScoreColor(result.matchScore)}`}>
                            {result.matchScore}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full transition-all ${getProgressColor(result.matchScore)}`}
                            style={{ width: `${result.matchScore}%` }}
                        />
                    </div>
                </div>

                {/* 審核狀態 Badge */}
                <div className="flex items-center gap-2">
                    <Badge variant={result.isValid ? "default" : "destructive"}>
                        {result.isValid ? "✅ 審核通過" : "❌ 審核未通過"}
                    </Badge>
                    {result.extractedData && (
                        <Badge variant="secondary">
                            信心度 {Math.round(result.extractedData.confidence * 100)}%
                        </Badge>
                    )}
                </div>

                {/* OCR 擷取資料 */}
                {result.extractedData && (
                    <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                        <h4 className="font-medium text-sm flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            OCR 擷取結果
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {result.extractedData.totalAmount !== null && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">金額：</span>
                                    <span className="font-medium">
                                        ${result.extractedData.totalAmount / 100}
                                    </span>
                                </div>
                            )}
                            {result.extractedData.date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">日期：</span>
                                    <span className="font-medium">{result.extractedData.date}</span>
                                </div>
                            )}
                            {result.extractedData.vendorName && (
                                <div className="flex items-center gap-1 col-span-2">
                                    <Store className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">商家：</span>
                                    <span className="font-medium">{result.extractedData.vendorName}</span>
                                </div>
                            )}
                            {result.extractedData.invoiceNumber && (
                                <div className="flex items-center gap-1 col-span-2">
                                    <Hash className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">發票：</span>
                                    <span className="font-mono font-medium">
                                        {result.extractedData.invoiceNumber}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 問題清單 */}
                {result.issues.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">發現的問題</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {result.issues.map((issue, index) => {
                                const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`rounded-lg border p-3 ${config.bgColor} ${config.borderColor}`}
                                    >
                                        <div className={`flex items-start gap-2 ${config.textColor}`}>
                                            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{issue.message}</p>
                                                {(issue.expected || issue.actual) && (
                                                    <div className="text-xs opacity-80">
                                                        {issue.expected && <span>預期：{issue.expected}</span>}
                                                        {issue.expected && issue.actual && <span> → </span>}
                                                        {issue.actual && <span>實際：{issue.actual}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 無問題時顯示 */}
                {result.issues.length === 0 && result.isValid && (
                    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-green-700 dark:text-green-400">
                            收據資訊與報帳項目完全匹配！
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
