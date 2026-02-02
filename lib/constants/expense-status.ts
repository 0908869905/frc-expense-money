/**
 * 報帳狀態與組別常數
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
    colorClass: string;
}

interface DepartmentConfig extends LocalizedLabel {
    icon: string;
}

const DEFAULT_STATUS_COLOR = "bg-gray-100 text-gray-700";

export const STATUS_CONFIG: Record<ExpenseStatus, StatusConfig> = {
    PENDING_MANAGER: { colorClass: "bg-yellow-100 text-yellow-700", labelZh: "待主管審核", labelEn: "Pending Manager" },
    PENDING_FINANCE: { colorClass: "bg-blue-100 text-blue-700", labelZh: "待財務審核", labelEn: "Pending Finance" },
    PAID: { colorClass: "bg-green-100 text-green-700", labelZh: "已付款", labelEn: "Paid" },
    REJECTED: { colorClass: "bg-red-100 text-red-700", labelZh: "已拒絕", labelEn: "Rejected" },
    RETURNED: { colorClass: "bg-orange-100 text-orange-700", labelZh: "已退回", labelEn: "Returned" },
};

export const DEPARTMENT_CONFIG: Record<string, DepartmentConfig> = {
    ELECTRICAL: { labelZh: "電資組", labelEn: "Electrical", icon: "⚡" },
    MECHANICAL: { labelZh: "機構組", labelEn: "Mechanical", icon: "⚙️" },
    DOCUMENTATION: { labelZh: "文書組", labelEn: "Documentation", icon: "📝" },
    PR: { labelZh: "公關組", labelEn: "PR", icon: "📣" },
    FINANCE: { labelZh: "財管組", labelEn: "Finance", icon: "💰" },
    DESIGN: { labelZh: "意象組", labelEn: "Design", icon: "🎨" },
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

export function getStatusLabel(status: string, language: Language = "zh"): string {
    return getLocalizedLabel(STATUS_CONFIG[status as ExpenseStatus], status, language);
}

export function getDepartmentLabel(dept: string, language: Language = "zh"): string {
    const config = DEPARTMENT_CONFIG[dept];
    if (!config) return dept;
    return `${config.icon} ${getLocalizedLabel(config, dept, language)}`;
}
