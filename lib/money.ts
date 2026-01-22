/**
 * 金融精確度工具函數
 *
 * 重要規範：
 * 1. 資料庫存儲一律使用「整數」（最小貨幣單位，如：分）
 * 2. 禁止使用 JavaScript 原生數學運算符處理金額
 * 3. 所有金額運算必須透過本模組函數
 */

import Dinero from "dinero.js";

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

export function createMoney(cents: number, currency: CurrencyCode = "TWD") {
    const config = CURRENCY_CONFIG[currency];
    return Dinero({
        amount: cents,
        currency: config.code as Dinero.Currency,
        precision: config.exponent,
    });
}

export function toStorageUnit(amount: number, currency: CurrencyCode = "TWD"): number {
    return Math.round(amount * getFactor(currency));
}

export function toDisplayUnit(cents: number, currency: CurrencyCode = "TWD"): number {
    return cents / getFactor(currency);
}

export function formatMoney(
    cents: number,
    currency: CurrencyCode = "TWD",
    locale: string = "zh-TW"
): string {
    const config = CURRENCY_CONFIG[currency];
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: config.exponent,
        maximumFractionDigits: config.exponent,
    }).format(toDisplayUnit(cents, currency));
}

export function addMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    return createMoney(a, currency).add(createMoney(b, currency)).getAmount();
}

export function subtractMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    return createMoney(a, currency).subtract(createMoney(b, currency)).getAmount();
}

export function multiplyMoney(amount: number, multiplier: number, currency: CurrencyCode = "TWD"): number {
    return createMoney(amount, currency).multiply(multiplier).getAmount();
}

export function compareMoney(a: number, b: number, currency: CurrencyCode = "TWD"): -1 | 0 | 1 {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);

    if (moneyA.lessThan(moneyB)) return -1;
    if (moneyA.greaterThan(moneyB)) return 1;
    return 0;
}

export function isPositive(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isPositive();
}

export function isZero(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isZero();
}
