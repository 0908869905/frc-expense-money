"use client"

import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface BalanceCardProps {
    totalIncome: number
    totalExpense: number
    currentBalance: number
}

export function BalanceCard({ totalIncome, totalExpense, currentBalance }: BalanceCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("zh-TW", {
            style: "currency",
            currency: "TWD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const isPositive = currentBalance >= 0

    return (
        <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    財務摘要
                </h3>
            </div>

            {/* 目前餘額 - 大標題 */}
            <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">目前餘額</p>
                <p
                    className={`text-3xl font-bold ${isPositive ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {formatCurrency(currentBalance)}
                </p>
            </div>

            {/* 收入/支出 明細 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">總收入</p>
                        <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(totalIncome)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">總支出</p>
                        <p className="text-sm font-semibold text-red-600">
                            {formatCurrency(totalExpense)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
