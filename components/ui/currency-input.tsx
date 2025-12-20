"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: number
    onChange?: (value: number) => void
    currency?: string
}

export function CurrencyInput({
    value = 0,
    onChange,
    currency = "NT$",
    className,
    ...props
}: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = React.useState("")

    // Format number with thousand separators
    const formatNumber = (num: number) => {
        return num.toLocaleString("en-US", { maximumFractionDigits: 2 })
    }

    // Parse formatted string back to number
    const parseNumber = (str: string) => {
        const cleaned = str.replace(/[^0-9.]/g, "")
        const parsed = parseFloat(cleaned)
        return isNaN(parsed) ? 0 : parsed
    }

    // Initialize display value
    React.useEffect(() => {
        if (value !== undefined) {
            setDisplayValue(formatNumber(value))
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value

        // Allow only digits, dots, and commas
        const cleaned = rawValue.replace(/[^0-9.,]/g, "")

        // Parse and format
        const numValue = parseNumber(cleaned)
        setDisplayValue(formatNumber(numValue))
        onChange?.(numValue)
    }

    const handleBlur = () => {
        // Re-format on blur
        const numValue = parseNumber(displayValue)
        setDisplayValue(formatNumber(numValue))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Select all on focus for easy replacement
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
