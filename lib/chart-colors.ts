/**
 * 圖表色彩系統（工程帳冊 v2）
 *
 * recharts 以 SVG 屬性設定 fill/stroke，無法解析 CSS var()，
 * 因此提供主題感知的 hex 色盤。數值與 globals.css 的 --chart-* 同步，
 * 並已通過 dataviz 六項檢查（亮度帶域 / 彩度下限 / CVD 分離 / 表面對比）。
 *
 * 規則：
 * - 分類色依固定順序指派（identity），不可依數值大小重排
 * - 一張圖一個軸；狀態語意色（ok/warn/danger）不可挪用為「第 N 個系列」
 */

export type ChartTheme = "light" | "dark"

interface ChartColorSet {
    /** 分類色盤：固定順序 琥珀→鋼藍→苔綠→土黃→磚紅 */
    categorical: string[]
    /** 狀態語意色（與 globals.css token 同步）— 僅用於「系列本身即狀態」的圖 */
    status: {
        ok: string
        warn: string
        info: string
        danger: string
    }
    /** 網格線 */
    grid: string
    /** 軸線與刻度文字 */
    axis: string
    /** tooltip 背景/邊框/文字 */
    tooltipBg: string
    tooltipBorder: string
    tooltipText: string
}

const DARK: ChartColorSet = {
    // 墨主題：朱 / 藍 / 苔 / 山吹 / 江戶紫（dataviz 驗證通過）
    categorical: [
        "hsl(8, 68%, 52%)",
        "hsl(215, 48%, 56%)",
        "hsl(125, 32%, 45%)",
        "hsl(38, 64%, 44%)",
        "hsl(285, 32%, 58%)",
    ],
    status: {
        ok: "hsl(125, 22%, 48%)",
        warn: "hsl(38, 65%, 52%)",
        info: "hsl(215, 30%, 58%)",
        danger: "hsl(355, 60%, 55%)",
    },
    grid: "hsl(30, 5%, 20%)",
    axis: "hsl(35, 8%, 60%)",
    tooltipBg: "hsl(30, 5%, 12%)",
    tooltipBorder: "hsl(30, 5%, 24%)",
    tooltipText: "hsl(40, 18%, 90%)",
}

const LIGHT: ChartColorSet = {
    // 和紙主題：朱 / 藍 / 苔 / 山吹 / 江戶紫（dataviz 驗證通過）
    categorical: [
        "hsl(7, 70%, 45%)",
        "hsl(216, 50%, 42%)",
        "hsl(125, 40%, 33%)",
        "hsl(36, 68%, 38%)",
        "hsl(287, 36%, 44%)",
    ],
    status: {
        ok: "hsl(125, 25%, 36%)",
        warn: "hsl(36, 70%, 40%)",
        info: "hsl(216, 32%, 42%)",
        danger: "hsl(355, 62%, 42%)",
    },
    grid: "hsl(38, 16%, 87%)",
    axis: "hsl(32, 8%, 45%)",
    tooltipBg: "hsl(43, 24%, 97%)",
    tooltipBorder: "hsl(38, 16%, 85%)",
    tooltipText: "hsl(30, 10%, 22%)",
}

export function getChartColors(theme: ChartTheme): ChartColorSet {
    return theme === "light" ? LIGHT : DARK
}

/** recharts Tooltip 的 contentStyle（工程帳冊：實面 + hairline + mono 數字） */
export function getTooltipStyle(theme: ChartTheme): React.CSSProperties {
    const c = getChartColors(theme)
    return {
        backgroundColor: c.tooltipBg,
        border: `1px solid ${c.tooltipBorder}`,
        borderRadius: 6,
        color: c.tooltipText,
        fontSize: 12,
        fontFamily: "var(--font-plex-mono), ui-monospace, monospace",
        boxShadow: "0 8px 24px rgb(0 0 0 / 0.18)",
    }
}
