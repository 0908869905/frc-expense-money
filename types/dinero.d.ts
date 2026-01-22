declare module "dinero.js" {
  interface DineroOptions {
    amount: number;
    currency?: Currency;
    precision?: number;
  }

  interface DineroObject {
    getAmount(): number;
    getCurrency(): Currency;
    getPrecision(): number;
    add(addend: DineroObject): DineroObject;
    subtract(subtrahend: DineroObject): DineroObject;
    multiply(multiplier: number, roundingMode?: string): DineroObject;
    divide(divisor: number, roundingMode?: string): DineroObject;
    percentage(percentage: number): DineroObject;
    allocate(ratios: number[]): DineroObject[];
    equalsTo(comparator: DineroObject): boolean;
    lessThan(comparator: DineroObject): boolean;
    lessThanOrEqual(comparator: DineroObject): boolean;
    greaterThan(comparator: DineroObject): boolean;
    greaterThanOrEqual(comparator: DineroObject): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    hasSubUnits(): boolean;
    hasCents(): boolean;
    hasSameCurrency(comparator: DineroObject): boolean;
    hasSameAmount(comparator: DineroObject): boolean;
    toFormat(format?: string, roundingMode?: string): string;
    toUnit(): number;
    toRoundedUnit(digits: number, roundingMode?: string): number;
    toObject(): DineroOptions;
    toJSON(): DineroOptions;
    convertPrecision(newPrecision: number, roundingMode?: string): DineroObject;
  }

  type Currency =
    | "AED" | "AFN" | "ALL" | "AMD" | "ANG" | "AOA" | "ARS" | "AUD" | "AWG" | "AZN"
    | "BAM" | "BBD" | "BDT" | "BGN" | "BHD" | "BIF" | "BMD" | "BND" | "BOB" | "BRL"
    | "BSD" | "BTN" | "BWP" | "BYN" | "BZD" | "CAD" | "CDF" | "CHF" | "CLP" | "CNY"
    | "COP" | "CRC" | "CUC" | "CUP" | "CVE" | "CZK" | "DJF" | "DKK" | "DOP" | "DZD"
    | "EGP" | "ERN" | "ETB" | "EUR" | "FJD" | "FKP" | "GBP" | "GEL" | "GGP" | "GHS"
    | "GIP" | "GMD" | "GNF" | "GTQ" | "GYD" | "HKD" | "HNL" | "HRK" | "HTG" | "HUF"
    | "IDR" | "ILS" | "IMP" | "INR" | "IQD" | "IRR" | "ISK" | "JEP" | "JMD" | "JOD"
    | "JPY" | "KES" | "KGS" | "KHR" | "KMF" | "KPW" | "KRW" | "KWD" | "KYD" | "KZT"
    | "LAK" | "LBP" | "LKR" | "LRD" | "LSL" | "LYD" | "MAD" | "MDL" | "MGA" | "MKD"
    | "MMK" | "MNT" | "MOP" | "MRU" | "MUR" | "MVR" | "MWK" | "MXN" | "MYR" | "MZN"
    | "NAD" | "NGN" | "NIO" | "NOK" | "NPR" | "NZD" | "OMR" | "PAB" | "PEN" | "PGK"
    | "PHP" | "PKR" | "PLN" | "PYG" | "QAR" | "RON" | "RSD" | "RUB" | "RWF" | "SAR"
    | "SBD" | "SCR" | "SDG" | "SEK" | "SGD" | "SHP" | "SLL" | "SOS" | "SPL" | "SRD"
    | "STN" | "SVC" | "SYP" | "SZL" | "THB" | "TJS" | "TMT" | "TND" | "TOP" | "TRY"
    | "TTD" | "TVD" | "TWD" | "TZS" | "UAH" | "UGX" | "USD" | "UYU" | "UZS" | "VEF"
    | "VND" | "VUV" | "WST" | "XAF" | "XCD" | "XDR" | "XOF" | "XPF" | "YER" | "ZAR"
    | "ZMW" | "ZWD";

  function Dinero(options: DineroOptions): DineroObject;

  namespace Dinero {
    export type Currency = import("dinero.js").Currency;
  }

  export default Dinero;
  export { Currency, DineroObject, DineroOptions };
}
