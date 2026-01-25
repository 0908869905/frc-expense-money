/**
 * 資金來源常數
 */

export { formatCurrency } from "@/lib/currency";
export { formatDate } from "@/lib/utils";

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

export interface FundingType {
    value: string;
    label: string;
    labelEn: string;
}

export const FUNDING_TYPES: FundingType[] = [
    { value: "SPONSORSHIP", label: "贊助", labelEn: "Sponsorship" },
    { value: "DONATION", label: "捐款", labelEn: "Donation" },
    { value: "GRANT", label: "補助金", labelEn: "Grant" },
    { value: "FUNDRAISING", label: "募款活動", labelEn: "Fundraising" },
    { value: "OTHER", label: "其他", labelEn: "Other" },
];

export function getTypeLabel(type: string, language: "zh" | "en" = "zh"): string {
    const found = FUNDING_TYPES.find((t) => t.value === type);
    return found ? (language === "zh" ? found.label : found.labelEn) : type;
}
