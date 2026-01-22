/**
 * ?��?精確度工?�函??
 * 
 * ?��?規�?�?
 * 1. 資�?庫�??��?律使?�「整?�」�??�小貨�?��位�?如�??��?
 * 2. 禁止使用 JavaScript ?��??�學?��?符�??��?�?
 * 3. ?�?��?額�?算�??�透�??�模組函??
 */

import Dinero from "dinero.js";

// ?�援?�貨�??�?
export const CURRENCY_CONFIG = {
    TWD: { code: "TWD", exponent: 0, symbol: "NT$" }, // ?�幣?��??��?
    USD: { code: "USD", exponent: 2, symbol: "$" },
    EUR: { code: "EUR", exponent: 2, symbol: "€" },
    JPY: { code: "JPY", exponent: 0, symbol: "¥" },
    CNY: { code: "CNY", exponent: 2, symbol: "¥" },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * 將使?�者輸?��??��?轉�??��??�庫存儲?��?（整?��?
 * @param amount 使用?�輸?��??��?（�? 123.45�?
 * @param currency 貨幣�?��
 * @returns 資�?庫�??��??�數?��?�?12345 ?��?
 */
export function toStorageUnit(amount: number, currency: CurrencyCode = "TWD"): number {
    const config = CURRENCY_CONFIG[currency];
    const factor = Math.pow(10, config.exponent);
    // 使用 Math.round ?��?浮�??�精度�?�?
    return Math.round(amount * factor);
}

/**
 * 將�??�庫存儲?�整?��??�為顯示?��?
 * @param cents 資�?庫�??��??�數??
 * @param currency 貨幣�?��
 * @returns 顯示?��??��?（�? 123.45�?
 */
export function toDisplayUnit(cents: number, currency: CurrencyCode = "TWD"): number {
    const config = CURRENCY_CONFIG[currency];
    const factor = Math.pow(10, config.exponent);
    return cents / factor;
}

/**
 * 建�? Dinero ?��??�件（用?�精確�?算�?
 * @param cents 資�?庫�??��??�數??
 * @param currency 貨幣�?��
 */
export function createMoney(cents: number, currency: CurrencyCode = "TWD") {
    const config = CURRENCY_CONFIG[currency];
    return Dinero({
        amount: cents,
        currency: config.code as Dinero.Currency,
        precision: config.exponent,
    });
}

/**
 * ?��??��?額為?�地?��?�?
 * @param cents 資�?庫�??��??�數??
 * @param currency 貨幣�?��
 * @param locale 語系
 */
export function formatMoney(
    cents: number,
    currency: CurrencyCode = "TWD",
    locale: string = "zh-TW"
): string {
    const config = CURRENCY_CONFIG[currency];
    const displayAmount = toDisplayUnit(cents, currency);

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: config.exponent,
        maximumFractionDigits: config.exponent,
    }).format(displayAmount);
}

/**
 * 安全?��?（避?�浮點數?��?�?
 * @param a 第�??��?額�??�數�?
 * @param b 第�??��?額�??�數�?
 */
export function addMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);
    return moneyA.add(moneyB).getAmount();
}

/**
 * 安全減�?
 */
export function subtractMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);
    return moneyA.subtract(moneyB).getAmount();
}

/**
 * 安全乘�?（用?��?算�??��?�?
 */
export function multiplyMoney(amount: number, multiplier: number, currency: CurrencyCode = "TWD"): number {
    const money = createMoney(amount, currency);
    return money.multiply(multiplier).getAmount();
}

/**
 * 比�??��?
 */
export function compareMoney(a: number, b: number, currency: CurrencyCode = "TWD"): -1 | 0 | 1 {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);

    if (moneyA.lessThan(moneyB)) return -1;
    if (moneyA.greaterThan(moneyB)) return 1;
    return 0;
}

/**
 * 檢查?��??�否?�正??
 */
export function isPositive(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isPositive();
}

/**
 * 檢查?��??�否?�零
 */
export function isZero(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isZero();
}

