import * as React from "react"
import { cn } from "@/lib/utils"

export const Badge = ({
  variant = "primary",
  children,
  className,
}: {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline"
  children: React.ReactNode
  className?: string
}) => {
  const variantStyles = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-muted text-muted-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    outline: "bg-transparent text-foreground border-border",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-lg border w-fit transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}