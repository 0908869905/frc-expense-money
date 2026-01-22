// �?��工具?�數

export const SUPPORTED_CURRENCIES = [
    { code: "TWD", name: "新台幣", symbol: "NT$", locale: "zh-TW" },
    { code: "USD", name: "美元", symbol: "$", locale: "en-US" },
    { code: "EUR", name: "歐元", symbol: "€", locale: "de-DE" },
    { code: "JPY", name: "日圓", symbol: "¥", locale: "ja-JP" },
    { code: "CNY", name: "人民幣", symbol: "¥", locale: "zh-CN" },
    { code: "HKD", name: "港幣", symbol: "HK$", locale: "zh-HK" },
    { code: "KRW", name: "韓圓", symbol: "₩", locale: "ko-KR" },
    { code: "GBP", name: "英鎊", symbol: "£", locale: "en-GB" },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]["code"];

// ?��?�?��資�?
export function getCurrencyInfo(code: string) {
    return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
}

// ?��??��?�?(帶幣?�符??
export function formatCurrencyAmount(
    amount: number,
    currencyCode: string = "TWD"
): string {
    const currency = getCurrencyInfo(currencyCode);

    return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
        maximumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
    }).format(amount);
}

// ?��?�?��
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // ?��?算�? USD (?��?)，�??��??�目標幣??
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
}

// ?�設?��? (作為?�用)
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

// 模擬?��??��??��? (實�??�用中可??API)
export async function fetchExchangeRates(): Promise<Record<string, number>> {
    // ?�裡?�以?�入�?Open Exchange Rates, Fixer.io �?API
    // ?��?返�??�設??
    return DEFAULT_EXCHANGE_RATES;
}

