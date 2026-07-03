"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Shared base styles for form controls
const CONTROL_BASE = "w-full px-3 py-2 border border-input rounded-md bg-card transition-colors"
const CONTROL_FOCUS = "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
const CONTROL_DISABLED = "disabled:opacity-50 disabled:cursor-not-allowed"
const CONTROL_ERROR = "border-danger focus:ring-danger/20 focus:border-danger"

function getControlClasses(error?: boolean, extra?: string): string {
    return cn(
        CONTROL_BASE,
        CONTROL_FOCUS,
        CONTROL_DISABLED,
        error && CONTROL_ERROR,
        extra
    )
}

interface FormFieldProps {
    label: string
    error?: string
    required?: boolean
    description?: string
    children: React.ReactNode
    className?: string
}

export function FormField({
    label,
    error,
    required,
    description,
    children,
    className,
}: FormFieldProps): React.ReactElement {
    return (
        <div className={cn("space-y-1.5", className)}>
            <label className="block text-sm font-medium text-foreground">
                {label}
                {required && <span className="text-danger ml-1">*</span>}
            </label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {children}
            {error && (
                <p className="text-xs text-danger flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(getControlClasses(error, "placeholder:text-muted-foreground"), className)}
            {...props}
        />
    )
)
Input.displayName = "Input"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(getControlClasses(error, "min-h-[80px] placeholder:text-muted-foreground resize-y"), className)}
            {...props}
        />
    )
)
Textarea.displayName = "Textarea"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean
    options: { value: string; label: string }[]
    placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, error, options, placeholder, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(getControlClasses(error), className)}
            {...props}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    )
)
Select.displayName = "Select"
