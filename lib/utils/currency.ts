// å¹?ˆ¥å·¥å…·?½æ•¸

export const SUPPORTED_CURRENCIES = [
    { code: "TWD", name: "?°å°å¹?, symbol: "NT$", locale: "zh-TW" },
    { code: "USD", name: "ç¾å?", symbol: "$", locale: "en-US" },
    { code: "EUR", name: "æ­å?", symbol: "??, locale: "de-DE" },
    { code: "JPY", name: "?¥å?", symbol: "Â¥", locale: "ja-JP" },
    { code: "CNY", name: "äººæ?å¹?, symbol: "Â¥", locale: "zh-CN" },
    { code: "HKD", name: "æ¸¯å¹£", symbol: "HK$", locale: "zh-HK" },
    { code: "KRW", name: "?“å?", symbol: "??, locale: "ko-KR" },
    { code: "GBP", name: "?±é?", symbol: "Â£", locale: "en-GB" },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]["code"];

// ?–å?å¹?ˆ¥è³‡è?
export function getCurrencyInfo(code: string) {
    return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
}

// ?¼å??–é?é¡?(å¸¶å¹£?¥ç¬¦??
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

// ?›ç?å¹?ˆ¥
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // ?ˆæ?ç®—æ? USD (?ºæ?)ï¼Œå??›ç??ç›®æ¨™å¹£??
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
}

// ?è¨­?¯ç? (ä½œç‚º?™ç”¨)
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

// æ¨¡æ“¬?–å??³æ??¯ç? (å¯¦é??‰ç”¨ä¸­å¯??API)
export async function fetchExchangeRates(): Promise<Record<string, number>> {
    // ?™è£¡?¯ä»¥?¥å…¥å¦?Open Exchange Rates, Fixer.io ç­?API
    // ?®å?è¿”å??è¨­??
    return DEFAULT_EXCHANGE_RATES;
}

