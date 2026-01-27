/**
 * 資金來源常數
 */

export { formatCurrency } from "@/lib/currency";
export { formatDate } from "@/lib/utils";
import type { Language } from "./expense-status";

export interface FundingRecord {
    id: string;
    title: string;
    amount: number;
    type: string;
    source: string | null;
    description: string | null;
    date: Date | string;
    recordedBy: string;
    createdAt?: Date | string;
}

interface FundingTypeOption {
    value: string;
    labelZh: string;
    labelEn: string;
}

export const FUNDING_TYPES: FundingTypeOption[] = [
    { value: "SPONSORSHIP", labelZh: "贊助", labelEn: "Sponsorship" },
    { value: "DONATION", labelZh: "捐款", labelEn: "Donation" },
    { value: "GRANT", labelZh: "補助金", labelEn: "Grant" },
    { value: "FUNDRAISING", labelZh: "募款活動", labelEn: "Fundraising" },
    { value: "OTHER", labelZh: "其他", labelEn: "Other" },
];

export function getTypeLabel(type: string, language: Language = "zh"): string {
    const found = FUNDING_TYPES.find((t) => t.value === type);
    return found ? (language === "zh" ? found.labelZh : found.labelEn) : type;
}
