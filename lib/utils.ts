import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { formatCurrency } from "@/lib/currency";

/** 驗證 URL 是否為安全的 http/https 協議 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const LOCALE_MAP = { zh: "zh-TW", en: "en-US" } as const;

/** 格式化日期 */
export function formatDate(date: Date | string, language: "zh" | "en" = "zh"): string {
  return new Date(date).toLocaleDateString(LOCALE_MAP[language], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}