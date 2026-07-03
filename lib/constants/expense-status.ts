/**
 * 報帳狀態與組別常數
 * 工程帳冊 v2：狀態 = 指示點 + 文字（token 語意色），不用淺色藥丸
 */

export type ExpenseStatus = "PENDING_MANAGER" | "PENDING_FINANCE" | "PAID" | "REJECTED" | "RETURNED";

// Import and re-export Language from central location
import type { Language } from "@/lib/language-context";
export type { Language };

interface LocalizedLabel {
    labelZh: string;
    labelEn: string;
}

interface StatusConfig extends LocalizedLabel {
    /** 舊 API：直接可貼在小徽章上的 class（token 化，深淺主題皆可用） */
    colorClass: string;
    /** 指示點底色 */
    dotClass: string;
    /** 文字顏色 */
    textClass: string;
}

interface DepartmentConfig extends LocalizedLabel { }

const DEFAULT_STATUS_COLOR = "border border-border bg-muted text-muted-foreground";

export const STATUS_CONFIG: Record<ExpenseStatus, StatusConfig> = {
    PENDING_MANAGER: {
        colorClass: "border border-warn/30 bg-warn/10 text-warn",
        dotClass: "bg-warn",
        textClass: "text-warn",
        labelZh: "待主管審核",
        labelEn: "Pending Manager",
    },
    PENDING_FINANCE: {
        colorClass: "border border-info/30 bg-info/10 text-info",
        dotClass: "bg-info",
        textClass: "text-info",
        labelZh: "待財務審核",
        labelEn: "Pending Finance",
    },
    PAID: {
        colorClass: "border border-ok/30 bg-ok/10 text-ok",
        dotClass: "bg-ok",
        textClass: "text-ok",
        labelZh: "已付款",
        labelEn: "Paid",
    },
    REJECTED: {
        colorClass: "border border-danger/30 bg-danger/10 text-danger",
        dotClass: "bg-danger",
        textClass: "text-danger",
        labelZh: "已拒絕",
        labelEn: "Rejected",
    },
    RETURNED: {
        colorClass: "border border-warn/30 bg-warn/10 text-warn",
        dotClass: "bg-warn",
        textClass: "text-warn",
        labelZh: "已退回",
        labelEn: "Returned",
    },
};

export const DEPARTMENT_CONFIG: Record<string, DepartmentConfig> = {
    ELECTRICAL: { labelZh: "電資組", labelEn: "Electrical" },
    MECHANICAL: { labelZh: "機構組", labelEn: "Mechanical" },
    DOCUMENTATION: { labelZh: "文書組", labelEn: "Documentation" },
    PR: { labelZh: "公關組", labelEn: "PR" },
    FINANCE: { labelZh: "財管組", labelEn: "Finance" },
    DESIGN: { labelZh: "意象組", labelEn: "Design" },
    MENTOR: { labelZh: "老師/導師", labelEn: "Mentor" },
};

/**
 * 通用的本地化標籤取得函式
 */
export function getLocalizedLabel(config: LocalizedLabel | undefined, fallback: string, language: Language): string {
    if (!config) return fallback;
    return language === "zh" ? config.labelZh : config.labelEn;
}

export function getStatusColor(status: string): string {
    return STATUS_CONFIG[status as ExpenseStatus]?.colorClass ?? DEFAULT_STATUS_COLOR;
}

/** 狀態指示點底色（搭配 .status-dot 使用） */
export function getStatusDotColor(status: string): string {
    return STATUS_CONFIG[status as ExpenseStatus]?.dotClass ?? "bg-muted-foreground";
}

/** 狀態文字顏色 */
export function getStatusTextColor(status: string): string {
    return STATUS_CONFIG[status as ExpenseStatus]?.textClass ?? "text-muted-foreground";
}

export function getStatusLabel(status: string, language: Language = "zh"): string {
    return getLocalizedLabel(STATUS_CONFIG[status as ExpenseStatus], status, language);
}

export function getDepartmentLabel(dept: string, language: Language = "zh"): string {
    const config = DEPARTMENT_CONFIG[dept];
    if (!config) return dept;
    return getLocalizedLabel(config, dept, language);
}
