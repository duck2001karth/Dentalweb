import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const Badge = ({
  variant = "primary",
  children,
  className,
}: {

  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline"
  children: ReactNode
  className?: string
}) => {
  

  const variantStyles = {
    primary: "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20 dark:text-blue-400 dark:border-blue-500/20",
    secondary: "bg-muted/50 text-muted-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    outline: "bg-transparent text-foreground border-border",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md border w-fit transition-colors",
        variantStyles[variant],
        className 
      )}
    >
      {children}
    </div>
  )
}