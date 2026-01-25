/**
 * 幣別工具函數
 *
 * 統一的貨幣格式化模組，預設使用 TWD（新台幣）
 */

export const SUPPORTED_CURRENCIES = [
    { code: "TWD", name: "新台幣", symbol: "NT$", locale: "zh-TW" },
    { code: "USD", name: "美元", symbol: "$", locale: "en-US" },
    { code: "EUR", name: "歐元", symbol: "€", locale: "de-DE" },
    { code: "JPY", name: "日圓", symbol: "¥", locale: "ja-JP" },
    { code: "CNY", name: "人民幣", symbol: "¥", locale: "zh-CN" },
    { code: "HKD", name: "港幣", symbol: "HK$", locale: "zh-HK" },
    { code: "KRW", name: "韓元", symbol: "₩", locale: "ko-KR" },
    { code: "GBP", name: "英鎊", symbol: "£", locale: "en-GB" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "TWD"]);

export function getCurrencyInfo(code: string): (typeof SUPPORTED_CURRENCIES)[number] {
    return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

/**
 * 格式化貨幣金額
 * @param amount 金額
 * @param currencyCode 幣別代碼（預設 TWD）
 */
export function formatCurrency(amount: number, currencyCode: string = "TWD"): string {
    const currency = getCurrencyInfo(currencyCode);
    const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(currencyCode) ? 0 : 2;

    return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(amount);
}
