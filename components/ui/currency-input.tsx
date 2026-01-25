"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: number
    onChange?: (value: number) => void
    currency?: string
}

function formatNumber(num: number): string {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function parseNumber(str: string): number {
    const cleaned = str.replace(/[^0-9.]/g, "")
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
}

export function CurrencyInput({
    value = 0,
    onChange,
    currency = "NT$",
    className,
    ...props
}: CurrencyInputProps): React.ReactElement {
    const [displayValue, setDisplayValue] = React.useState(() => formatNumber(value))

    React.useEffect(() => {
        setDisplayValue(formatNumber(value))
    }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const cleaned = e.target.value.replace(/[^0-9.,]/g, "")
        const numValue = parseNumber(cleaned)
        setDisplayValue(formatNumber(numValue))
        onChange?.(numValue)
    }

    function handleBlur(): void {
        setDisplayValue(formatNumber(parseNumber(displayValue)))
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>): void {
        e.target.select()
    }

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currency}
            </span>
            <input
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className={cn(
                    "w-full pl-12 pr-3 py-2 border rounded-lg bg-background text-right",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    className
                )}
                {...props}
            />
        </div>
    )
}
