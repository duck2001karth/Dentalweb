"use client"

import React from "react"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ConfirmDestructiveDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  iconType?: "trash" | "warning"
}

export function ConfirmDestructiveDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Estás completamente seguro?",
  description = "Esta acción no se puede deshacer y eliminará permanentemente la información de la base de datos.",
  confirmText = "Sí, eliminar definitivamente",
  cancelText = "Cancelar",
  isLoading = false,
  iconType = "trash",
}: ConfirmDestructiveDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent className="sm:max-w-[420px] bg-background border-border p-6 rounded-[24px] shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Círculo de advertencia con icono centrado */}
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
            {iconType === "trash" ? (
              <Trash2 className="w-7 h-7 stroke-[2]" />
            ) : (
              <AlertTriangle className="w-7 h-7 stroke-[2]" />
            )}
          </div>

          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-xl font-black text-foreground tracking-tight text-center">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed text-center px-2">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t border-border/60">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold border-border bg-background text-foreground hover:bg-muted cursor-pointer transition-all"
          >
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}