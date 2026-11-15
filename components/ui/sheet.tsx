"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[3px]",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "motion-reduce:animate-none",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const sheetVariants = cva(
  cn(
    "fixed z-[51] flex min-w-0 flex-col gap-0 border-border bg-card text-card-foreground shadow-xl outline-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "motion-reduce:animate-none"
  ),
  {
    variants: {
      position: {
        top: "inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        left: "inset-y-0 left-0 h-dvh border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        right: "inset-y-0 right-0 h-dvh border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
      },
      size: {
        content: "",
        default: "",
        sm: "",
        lg: "",
        xl: "",
        full: "",
      },
    },
    compoundVariants: [
      { position: ["top", "bottom"], size: "content", class: "max-h-[90dvh]" },
      { position: ["top", "bottom"], size: "default", class: "h-1/3" },
      { position: ["top", "bottom"], size: "sm", class: "h-1/4" },
      { position: ["top", "bottom"], size: "lg", class: "h-1/2" },
      { position: ["top", "bottom"], size: "xl", class: "h-5/6" },
      { position: ["top", "bottom"], size: "full", class: "h-dvh" },
      { position: ["left", "right"], size: "content", class: "w-auto max-w-[95vw]" },
      { position: ["left", "right"], size: "default", class: "w-[min(360px,90vw)]" },
      { position: ["left", "right"], size: "sm", class: "w-[min(280px,90vw)]" },
      { position: ["left", "right"], size: "lg", class: "w-[min(480px,95vw)]" },
      { position: ["left", "right"], size: "xl", class: "w-[min(680px,95vw)]" },
      { position: ["left", "right"], size: "full", class: "w-screen" },
    ],
    defaultVariants: { position: "right", size: "default" },
  }
)

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Desactivar la X automática si se proporciona un cierre propio. */
  showCloseButton?: boolean
}

/** Alias para compatibilidad con imports antiguos. */
export type DialogContentProps = SheetContentProps

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ position = "right", size = "default", className, children, showCloseButton = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ position, size }), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetPrimitive.Close
          aria-label="Cerrar panel"
          className={cn(
            "absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg",
            "text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 text-left", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
