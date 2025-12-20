"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhTW, enUS } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

import "react-day-picker/dist/style.css"

interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({
    value,
    onChange,
    placeholder,
    className,
    disabled = false,
}: DatePickerProps) {
    const { language } = useLanguage()
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const locale = language === "zh" ? zhTW : enUS
    const defaultPlaceholder = language === "zh" ? "選擇日期" : "Pick a date"

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (date: Date | undefined) => {
        onChange?.(date)
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-background text-left",
                    "hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    !value && "text-muted-foreground"
                )}
            >
                <span>
                    {value ? format(value, "PPP", { locale }) : (placeholder || defaultPlaceholder)}
                </span>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 p-2 bg-card border rounded-lg shadow-lg">
                    <DayPicker
                        mode="single"
                        selected={value}
                        onSelect={handleSelect}
                        locale={locale}
                        showOutsideDays
                        className="rdp-custom"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: cn(
                                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-muted"
                            ),
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: cn(
                                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                "[&:has([aria-selected])]:bg-primary/10 rounded-md"
                            ),
                            day: cn(
                                "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md",
                                "hover:bg-muted transition-colors"
                            ),
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_hidden: "invisible",
                        }}
                    />
                </div>
            )}
        </div>
    )
}
