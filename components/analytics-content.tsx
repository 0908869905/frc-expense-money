"use client"

import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { getChartColors, getTooltipStyle } from "@/lib/chart-colors"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    LabelList,
} from "recharts"
import { DollarSign, TrendingUp, FileText, Package } from "lucide-react"

interface AnalyticsContentProps {
    monthlyStats: { month: string; amount: number }[]
    categoryStats: { category: string; amount: number }[]
    statusStats: { status: string; count: number; amount: number }[]
    overview: {
        totalReports: number
        totalItems: number
        totalAmount: number
        thisMonthAmount: number
    } | null
}

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
    FOOD: { zh: "餐飲", en: "Food" },
    TRANSPORT: { zh: "交通", en: "Transport" },
    HOUSING: { zh: "住宿", en: "Housing" },
    ENTERTAINMENT: { zh: "娛樂", en: "Entertainment" },
    UTILITIES: { zh: "水電", en: "Utilities" },
    HEALTH: { zh: "醫療", en: "Health" },
    OTHER: { zh: "其他", en: "Other" },
}

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
    PENDING_MANAGER: { zh: "待主管審核", en: "Pending Manager" },
    PENDING_FINANCE: { zh: "待財務審核", en: "Pending Finance" },
    PAID: { zh: "已付款", en: "Paid" },
    REJECTED: { zh: "已拒絕", en: "Rejected" },
}

// 狀態 → 語意色 key（狀態圖的系列本身即狀態語意）
const STATUS_COLOR_KEY: Record<string, "ok" | "warn" | "info" | "danger"> = {
    PENDING_MANAGER: "warn",
    PENDING_FINANCE: "info",
    PAID: "ok",
    REJECTED: "danger",
}

const MONO_TICK = { fontSize: 11, fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }

export function AnalyticsContent({ monthlyStats, categoryStats, statusStats, overview }: AnalyticsContentProps) {
    const { language } = useLanguage()
    const { theme } = useTheme()
    const colors = getChartColors(theme)
    const tooltipStyle = getTooltipStyle(theme)

    const getCategoryLabel = (category: string) => {
        return CATEGORY_LABELS[category]?.[language] || category
    }

    const getStatusLabel = (status: string) => {
        return STATUS_LABELS[status]?.[language] || status
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(language === "zh" ? "zh-TW" : "en-US", {
            style: "currency",
            currency: "TWD",
            minimumFractionDigits: 0,
        }).format(value)
    }

    // Transform data for charts
    // 類別佔比：名目類別單一系列 → 水平長條、同一主色、金額遞減排序、直接標值
    const categoryChartData = [...categoryStats]
        .sort((a, b) => b.amount - a.amount)
        .map((item) => ({
            name: getCategoryLabel(item.category),
            value: item.amount,
        }))

    const statusChartData = statusStats.map((item) => ({
        name: getStatusLabel(item.status),
        count: item.count,
        amount: item.amount,
        colorKey: STATUS_COLOR_KEY[item.status] ?? "info",
    }))

    const tickStyle = { ...MONO_TICK, fill: colors.axis }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {language === "zh" ? "數據分析" : "Analytics"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {language === "zh" ? "查看支出統計和趨勢分析" : "View expense statistics and trends"}
                </p>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="ledger-label">
                                {language === "zh" ? "總報帳單" : "Total Reports"}
                            </span>
                        </div>
                        <p className="text-2xl font-semibold tech-number mt-2">{overview.totalReports}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="ledger-label">
                                {language === "zh" ? "總項目數" : "Total Items"}
                            </span>
                        </div>
                        <p className="text-2xl font-semibold tech-number mt-2">{overview.totalItems}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="ledger-label">
                                {language === "zh" ? "總金額" : "Total Amount"}
                            </span>
                        </div>
                        <p className="text-2xl font-semibold tech-number mt-2">{formatCurrency(overview.totalAmount)}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="ledger-label">
                                {language === "zh" ? "本月支出" : "This Month"}
                            </span>
                        </div>
                        <p className="text-2xl font-semibold tech-number mt-2">{formatCurrency(overview.thisMonthAmount)}</p>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Trend Chart */}
                <div className="rounded-xl border bg-card p-5">
                    <h3 className="text-base font-semibold mb-4">
                        {language === "zh" ? "月度支出趨勢" : "Monthly Expense Trend"}
                    </h3>
                    {monthlyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyStats} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(value) => value.slice(5)} // Show MM only
                                    tick={tickStyle}
                                    axisLine={{ stroke: colors.grid }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                                    tick={tickStyle}
                                    axisLine={false}
                                    tickLine={false}
                                    width={72}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={tooltipStyle}
                                    cursor={{ stroke: colors.axis, strokeDasharray: "3 3" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke={colors.categorical[0]}
                                    strokeWidth={2}
                                    dot={{ fill: colors.categorical[0], r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                            {language === "zh" ? "暫無數據" : "No data available"}
                        </div>
                    )}
                </div>

                {/* Category Bar Chart（名目類別 = 單一系列水平長條，金額遞減） */}
                <div className="rounded-xl border bg-card p-5">
                    <h3 className="text-base font-semibold mb-4">
                        {language === "zh" ? "類別佔比" : "Expense by Category"}
                    </h3>
                    {categoryStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={categoryChartData}
                                layout="vertical"
                                margin={{ top: 0, right: 88, bottom: 0, left: 8 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: colors.axis }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={72}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={tooltipStyle}
                                    cursor={{ fill: colors.grid, opacity: 0.4 }}
                                />
                                <Bar dataKey="value" fill={colors.categorical[0]} radius={[0, 3, 3, 0]} maxBarSize={22}>
                                    <LabelList
                                        dataKey="value"
                                        position="right"
                                        formatter={(value: number) => formatCurrency(value)}
                                        style={{ ...MONO_TICK, fill: colors.axis } as React.CSSProperties}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                            {language === "zh" ? "暫無數據" : "No data available"}
                        </div>
                    )}
                </div>

                {/* Status Distribution：單軸原則 → 件數與金額拆為兩張並列圖，狀態語意上色 */}
                <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                    <h3 className="text-base font-semibold mb-4">
                        {language === "zh" ? "狀態分布" : "Status Distribution"}
                    </h3>
                    {statusStats.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <p className="ledger-label mb-2">
                                    {language === "zh" ? "數量（筆）" : "Count"}
                                </p>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={statusChartData} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.axis }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={tickStyle} axisLine={false} tickLine={false} width={32} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: colors.grid, opacity: 0.4 }} />
                                        <Bar dataKey="count" name={language === "zh" ? "數量" : "Count"} radius={[3, 3, 0, 0]} maxBarSize={48}>
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`count-${index}`} fill={colors.status[entry.colorKey]} />
                                            ))}
                                            <LabelList dataKey="count" position="top" style={{ ...MONO_TICK, fill: colors.axis } as React.CSSProperties} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <p className="ledger-label mb-2">
                                    {language === "zh" ? "金額（元）" : "Amount"}
                                </p>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={statusChartData} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.axis }} axisLine={{ stroke: colors.grid }} tickLine={false} />
                                        <YAxis tickFormatter={(value) => `$${Number(value).toLocaleString()}`} tick={tickStyle} axisLine={false} tickLine={false} width={72} />
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} cursor={{ fill: colors.grid, opacity: 0.4 }} />
                                        <Bar dataKey="amount" name={language === "zh" ? "金額" : "Amount"} radius={[3, 3, 0, 0]} maxBarSize={48}>
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`amount-${index}`} fill={colors.status[entry.colorKey]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                            {language === "zh" ? "暫無數據" : "No data available"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
