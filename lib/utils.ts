import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { formatCurrency } from "@/lib/currency";

const LOCALE_MAP = { zh: "zh-TW", en: "en-US" } as const;

/** 格式化日期 */
export function formatDate(date: Date | string, language: "zh" | "en" = "zh"): string {
  return new Date(date).toLocaleDateString(LOCALE_MAP[language], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}