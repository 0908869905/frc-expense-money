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
    categorical: ["#e26d12", "#4788d1", "#36a16b", "#b8850f", "#d15147"],
    status: {
        ok: "hsl(150, 40%, 48%)",
        warn: "hsl(40, 85%, 55%)",
        info: "hsl(212, 55%, 60%)",
        danger: "hsl(4, 70%, 55%)",
    },
    grid: "hsl(220, 6%, 20%)",
    axis: "hsl(220, 6%, 62%)",
    tooltipBg: "hsl(220, 7%, 11%)",
    tooltipBorder: "hsl(220, 6%, 24%)",
    tooltipText: "hsl(40, 12%, 92%)",
}

const LIGHT: ChartColorSet = {
    categorical: ["#df600c", "#3468b2", "#268257", "#c18815", "#c43b31"],
    status: {
        ok: "hsl(152, 45%, 32%)",
        warn: "hsl(40, 85%, 38%)",
        info: "hsl(215, 55%, 42%)",
        danger: "hsl(4, 72%, 44%)",
    },
    grid: "hsl(220, 14%, 88%)",
    axis: "hsl(220, 10%, 42%)",
    tooltipBg: "#ffffff",
    tooltipBorder: "hsl(220, 14%, 86%)",
    tooltipText: "hsl(220, 25%, 13%)",
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
