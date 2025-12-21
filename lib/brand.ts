/**
 * 品牌配置
 * 透過環境變數 NEXT_PUBLIC_BRAND 切換不同品牌
 * 
 * 使用方式：
 * - FRC 版本：NEXT_PUBLIC_BRAND=frc (預設)
 * - 家庭版本：NEXT_PUBLIC_BRAND=family
 */

export type BrandType = "frc" | "family";

interface BrandConfig {
    name: string;
    shortName: string;
    tagline: string;
    logo: string;
    primaryColor: string;
}

const brands: Record<BrandType, BrandConfig> = {
    frc: {
        name: "FRC 6998 報帳系統",
        shortName: "FRC 6998 報帳",
        tagline: "UNIPARDS",
        logo: "/logo.png",
        primaryColor: "#d4a017", // 金色
    },
    family: {
        name: "家庭記帳本",
        shortName: "家庭記帳",
        tagline: "聰明理財",
        logo: "/logo-family.png",
        primaryColor: "#14b8a6", // 青色
    },
};

export function getBrand(): BrandType {
    const brand = process.env.NEXT_PUBLIC_BRAND as BrandType;
    return brand && brands[brand] ? brand : "frc";
}

export function getBrandConfig(): BrandConfig {
    return brands[getBrand()];
}

// 匯出便捷函數
export const brand = {
    get name() { return getBrandConfig().name; },
    get shortName() { return getBrandConfig().shortName; },
    get tagline() { return getBrandConfig().tagline; },
    get logo() { return getBrandConfig().logo; },
    get primaryColor() { return getBrandConfig().primaryColor; },
    get isFRC() { return getBrand() === "frc"; },
    get isFamily() { return getBrand() === "family"; },
};
