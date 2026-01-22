"use client"

import { useLanguage } from "@/lib/context/language-context"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
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

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00C49F", "#FFBB28"]

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
    FOOD: { zh: "È§êÈ£≤", en: "Food" },
    TRANSPORT: { zh: "‰∫§ÈÄ?, en: "Transport" },
    HOUSING: { zh: "‰ΩèÂÆø", en: "Housing" },
    ENTERTAINMENT: { zh: "Â®õÊ?", en: "Entertainment" },
    UTILITIES: { zh: "Ê∞¥Èõª", en: "Utilities" },
    HEALTH: { zh: "?´Á?", en: "Health" },
    OTHER: { zh: "?∂‰?", en: "Other" },
}

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
    DRAFT: { zh: "?âÁ®ø", en: "Draft" },
    PENDING_MANAGER: { zh: "ÂæÖ‰∏ªÁÆ°ÂØ©??, en: "Pending Manager" },
    PENDING_FINANCE: { zh: "ÂæÖË≤°?ôÂØ©??, en: "Pending Finance" },
    PAID: { zh: "Â∑≤‰?Ê¨?, en: "Paid" },
    REJECTED: { zh: "Â∑≤Ê?Áµ?, en: "Rejected" },
}

export function AnalyticsContent({ monthlyStats, categoryStats, statusStats, overview }: AnalyticsContentProps) {
    const { language } = useLanguage()

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
    const categoryChartData = categoryStats.map((item, index) => ({
        name: getCategoryLabel(item.category),
        value: item.amount,
        fill: COLORS[index % COLORS.length],
    }))

    const statusChartData = statusStats.map((item) => ({
        name: getStatusLabel(item.status),
        count: item.count,
        amount: item.amount,
    }))

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {language === "zh" ? "?∏Ê??ÜÊ?" : "Analytics"}
                </h1>
                <p className="text-muted-foreground">
                    {language === "zh" ? "?•Á??ØÂá∫Áµ±Ë??åË∂®?¢Â??? : "View expense statistics and trends"}
                </p>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {language === "zh" ? "Á∏ΩÂ†±Â∏≥ÂñÆ" : "Total Reports"}
                            </span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{overview.totalReports}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {language === "zh" ? "Á∏ΩÈ??ÆÊï∏" : "Total Items"}
                            </span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{overview.totalItems}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {language === "zh" ? "Á∏ΩÈ?È°? : "Total Amount"}
                            </span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(overview.totalAmount)}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {language === "zh" ? "?¨Ê??ØÂá∫" : "This Month"}
                            </span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(overview.thisMonthAmount)}</p>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Trend Chart */}
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {language === "zh" ? "?àÂ∫¶?ØÂá∫Ë∂®Âã¢" : "Monthly Expense Trend"}
                    </h3>
                    {monthlyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(value) => value.slice(5)} // Show MM only
                                />
                                <YAxis tickFormatter={(value) => `$${value}`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={{ fill: "#8884d8" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            {language === "zh" ? "?´ÁÑ°?∏Ê?" : "No data available"}
                        </div>
                    )}
                </div>

                {/* Category Pie Chart */}
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {language === "zh" ? "È°ûÂà•‰ΩîÊ?" : "Expense by Category"}
                    </h3>
                    {categoryStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    dataKey="value"
                                >
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            {language === "zh" ? "?´ÁÑ°?∏Ê?" : "No data available"}
                        </div>
                    )}
                </div>

                {/* Status Bar Chart */}
                <div className="rounded-xl border bg-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">
                        {language === "zh" ? "?Ä?ãÂ?Â∏? : "Status Distribution"}
                    </h3>
                    {statusStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statusChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="count"
                                    name={language === "zh" ? "?∏È?" : "Count"}
                                    fill="#8884d8"
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="amount"
                                    name={language === "zh" ? "?ëÈ?" : "Amount"}
                                    fill="#82ca9d"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            {language === "zh" ? "?´ÁÑ°?∏Ê?" : "No data available"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

