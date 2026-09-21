import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)] disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer select-none [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-xs hover:opacity-95 border-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-border/80 bg-card text-foreground shadow-2xs hover:bg-[var(--doctor-accent,#008bcd)]/10 hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)]",
        secondary:
          "bg-muted text-foreground border border-border/80 hover:bg-muted/80 hover:border-[var(--doctor-accent,#008bcd)]",
        ghost:
          "text-foreground/80 hover:text-[var(--doctor-accent,#008bcd)] hover:bg-[var(--doctor-accent,#008bcd)]/10",
        link:
          "text-[var(--doctor-accent,#008bcd)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl",
        sm: "h-8 px-3 rounded-lg text-xs",
        lg: "h-11 px-6 rounded-2xl text-sm",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Si es variante default, aplicamos el color del doctor como fondo
    const dynamicStyle =
      variant === "default" || !variant
        ? {
            backgroundColor: "var(--doctor-accent, #008bcd)",
            color: "#ffffff",
            ...style,
          }
        : style

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={dynamicStyle}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }