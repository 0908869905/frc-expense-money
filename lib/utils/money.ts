/**
 * 金融精確度工具函數
 *
 * 重要規範：
 * 1. 資料庫存儲一律使用「整數」（最小貨幣單位，如：分）
 * 2. 禁止使用 JavaScript 原生數學運算符處理金額
 * 3. 所有金額運算必須透過本模組函數
 */

import Dinero from "dinero.js";

// 支援的貨幣定義
export const CURRENCY_CONFIG = {
    TWD: { code: "TWD", exponent: 0, symbol: "NT$" }, // 台幣無小數點
    USD: { code: "USD", exponent: 2, symbol: "$" },
    EUR: { code: "EUR", exponent: 2, symbol: "€" },
    JPY: { code: "JPY", exponent: 0, symbol: "¥" },
    CNY: { code: "CNY", exponent: 2, symbol: "¥" },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * 將使用者輸入的金額轉換為資料庫存儲單位（整數）
 * @param amount 使用者輸入的金額（如 123.45）
 * @param currency 貨幣代碼
 * @returns 資料庫存儲的整數值（如 12345 分）
 */
export function toStorageUnit(amount: number, currency: CurrencyCode = "TWD"): number {
    const config = CURRENCY_CONFIG[currency];
    const factor = Math.pow(10, config.exponent);
    // 使用 Math.round 避免浮點數精度問題
    return Math.round(amount * factor);
}

/**
 * 將資料庫存儲的整數轉換為顯示金額
 * @param cents 資料庫存儲的整數值
 * @param currency 貨幣代碼
 * @returns 顯示用的金額（如 123.45）
 */
export function toDisplayUnit(cents: number, currency: CurrencyCode = "TWD"): number {
    const config = CURRENCY_CONFIG[currency];
    const factor = Math.pow(10, config.exponent);
    return cents / factor;
}

/**
 * 建立 Dinero 金額物件（用於精確運算）
 * @param cents 資料庫存儲的整數值
 * @param currency 貨幣代碼
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
 * 格式化金額為本地化字串
 * @param cents 資料庫存儲的整數值
 * @param currency 貨幣代碼
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
 * 安全加法（避免浮點數問題）
 * @param a 第一個金額（整數）
 * @param b 第二個金額（整數）
 */
export function addMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);
    return moneyA.add(moneyB).getAmount();
}

/**
 * 安全減法
 */
export function subtractMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);
    return moneyA.subtract(moneyB).getAmount();
}

/**
 * 安全乘法（用於計算稅率等）
 */
export function multiplyMoney(amount: number, multiplier: number, currency: CurrencyCode = "TWD"): number {
    const money = createMoney(amount, currency);
    return money.multiply(multiplier).getAmount();
}

/**
 * 比較金額
 */
export function compareMoney(a: number, b: number, currency: CurrencyCode = "TWD"): -1 | 0 | 1 {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);

    if (moneyA.lessThan(moneyB)) return -1;
    if (moneyA.greaterThan(moneyB)) return 1;
    return 0;
}

/**
 * 檢查金額是否為正數
 */
export function isPositive(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isPositive();
}

/**
 * 檢查金額是否為零
 */
export function isZero(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isZero();
}
