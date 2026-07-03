import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const BADGE_BASE = "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: "border-primary/30 bg-primary/10 text-primary",
  secondary: "border-border bg-muted text-muted-foreground",
  destructive: "border-danger/30 bg-danger/10 text-danger",
  outline: "text-foreground",
  success: "border-ok/30 bg-ok/10 text-ok",
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