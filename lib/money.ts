/**
 * 金融精確度工具函數
 *
 * 資料庫存儲使用「整數」（最小貨幣單位）
 */

export const CURRENCY_CONFIG = {
    TWD: { code: "TWD", exponent: 0, symbol: "NT$" },
    USD: { code: "USD", exponent: 2, symbol: "$" },
    EUR: { code: "EUR", exponent: 2, symbol: "€" },
    JPY: { code: "JPY", exponent: 0, symbol: "¥" },
    CNY: { code: "CNY", exponent: 2, symbol: "¥" },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

function getFactor(currency: CurrencyCode): number {
    return 10 ** CURRENCY_CONFIG[currency].exponent;
}

export function toStorageUnit(amount: number, currency: CurrencyCode = "TWD"): number {
    return Math.round(amount * getFactor(currency));
}

export function toDisplayUnit(cents: number, currency: CurrencyCode = "TWD"): number {
    return cents / getFactor(currency);
}
