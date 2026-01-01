/**
 * ?‘è?ç²¾ç¢ºåº¦å·¥?·å‡½??
 * 
 * ?è?è¦ç?ï¼?
 * 1. è³‡æ?åº«å??²ä?å¾‹ä½¿?¨ã€Œæ•´?¸ã€ï??€å°è²¨å¹?–®ä½ï?å¦‚ï??†ï?
 * 2. ç¦æ­¢ä½¿ç”¨ JavaScript ?Ÿç??¸å­¸?‹ç?ç¬¦è??†é?é¡?
 * 3. ?€?‰é?é¡é?ç®—å??ˆé€é??¬æ¨¡çµ„å‡½??
 */

import Dinero from "dinero.js";

// ?¯æ´?„è²¨å¹??ç¾?
export const CURRENCY_CONFIG = {
    TWD: { code: "TWD", exponent: 0, symbol: "NT$" }, // ?°å¹£?¡å??¸é?
    USD: { code: "USD", exponent: 2, symbol: "$" },
    EUR: { code: "EUR", exponent: 2, symbol: "?? },
    JPY: { code: "JPY", exponent: 0, symbol: "Â¥" },
    CNY: { code: "CNY", exponent: 2, symbol: "Â¥" },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * å°‡ä½¿?¨è€…è¼¸?¥ç??‘é?è½‰æ??ºè??™åº«å­˜å„²?®ä?ï¼ˆæ•´?¸ï?
 * @param amount ä½¿ç”¨?…è¼¸?¥ç??‘é?ï¼ˆå? 123.45ï¼?
 * @param currency è²¨å¹£ä»?¢¼
 * @returns è³‡æ?åº«å??²ç??´æ•¸?¼ï?å¦?12345 ?†ï?
 */
export function toStorageUnit(amount: number, currency: CurrencyCode = "TWD"): number {
    const config = CURRENCY_CONFIG[currency];
    const factor = Math.pow(10, config.exponent);
    // ä½¿ç”¨ Math.round ?¿å?æµ®é??¸ç²¾åº¦å?é¡?
    return Math.round(amount * factor);
}

/**
 * å°‡è??™åº«å­˜å„²?„æ•´?¸è??›ç‚ºé¡¯ç¤º?‘é?
 * @param cents è³‡æ?åº«å??²ç??´æ•¸??
 * @param currency è²¨å¹£ä»?¢¼
 * @returns é¡¯ç¤º?¨ç??‘é?ï¼ˆå? 123.45ï¼?
 */
export function toDisplayUnit(cents: number, currency: CurrencyCode = "TWD"): number {
    const config = CURRENCY_CONFIG[currency];
    const factor = Math.pow(10, config.exponent);
    return cents / factor;
}

/**
 * å»ºç? Dinero ?‘é??©ä»¶ï¼ˆç”¨?¼ç²¾ç¢ºé?ç®—ï?
 * @param cents è³‡æ?åº«å??²ç??´æ•¸??
 * @param currency è²¨å¹£ä»?¢¼
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
 * ?¼å??–é?é¡ç‚º?¬åœ°?–å?ä¸?
 * @param cents è³‡æ?åº«å??²ç??´æ•¸??
 * @param currency è²¨å¹£ä»?¢¼
 * @param locale èªç³»
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
 * å®‰å…¨? æ?ï¼ˆé¿?æµ®é»æ•¸?é?ï¼?
 * @param a ç¬¬ä??‹é?é¡ï??´æ•¸ï¼?
 * @param b ç¬¬ä??‹é?é¡ï??´æ•¸ï¼?
 */
export function addMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);
    return moneyA.add(moneyB).getAmount();
}

/**
 * å®‰å…¨æ¸›æ?
 */
export function subtractMoney(a: number, b: number, currency: CurrencyCode = "TWD"): number {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);
    return moneyA.subtract(moneyB).getAmount();
}

/**
 * å®‰å…¨ä¹˜æ?ï¼ˆç”¨?¼è?ç®—ç??‡ç?ï¼?
 */
export function multiplyMoney(amount: number, multiplier: number, currency: CurrencyCode = "TWD"): number {
    const money = createMoney(amount, currency);
    return money.multiply(multiplier).getAmount();
}

/**
 * æ¯”è??‘é?
 */
export function compareMoney(a: number, b: number, currency: CurrencyCode = "TWD"): -1 | 0 | 1 {
    const moneyA = createMoney(a, currency);
    const moneyB = createMoney(b, currency);

    if (moneyA.lessThan(moneyB)) return -1;
    if (moneyA.greaterThan(moneyB)) return 1;
    return 0;
}

/**
 * æª¢æŸ¥?‘é??¯å¦?ºæ­£??
 */
export function isPositive(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isPositive();
}

/**
 * æª¢æŸ¥?‘é??¯å¦?ºé›¶
 */
export function isZero(cents: number, currency: CurrencyCode = "TWD"): boolean {
    return createMoney(cents, currency).isZero();
}

