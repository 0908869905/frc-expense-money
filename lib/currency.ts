/**
 * 幣別工具函數
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

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW"]);

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    TWD: 31.5,
    EUR: 0.92,
    JPY: 150,
    CNY: 7.2,
    HKD: 7.8,
    KRW: 1300,
    GBP: 0.79,
};

export function getCurrencyInfo(code: string) {
    return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

export function formatCurrencyAmount(amount: number, currencyCode: string = "TWD"): string {
    const currency = getCurrencyInfo(currencyCode);
    const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(currencyCode) ? 0 : 2;

    return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(amount);
}

export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
): number {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency] ?? 1;
    const toRate = rates[toCurrency] ?? 1;

    return (amount / fromRate) * toRate;
}

export function fetchExchangeRates(): Promise<Record<string, number>> {
    return Promise.resolve(DEFAULT_EXCHANGE_RATES);
}
