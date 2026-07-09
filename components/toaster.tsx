"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
type ToastItemType = ReturnType<typeof useToast>['toasts'][number];


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      
      {toasts.map(function ({
        id,
        title,
        variant,
        description,
        action,
        ...props
      }: ToastItemType) { 
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}