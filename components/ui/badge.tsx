import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const BADGE_BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
  success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
}

function Badge({ className, variant = "default", ...props }: BadgeProps): React.ReactElement {
  return (
    <div
      className={cn(BADGE_BASE, BADGE_VARIANTS[variant], className)}
      {...props}
    />
  )
}

export { Badge }