"use client"

import React, { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"

interface DeletePaymentAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeletePaymentAlert({ isOpen, onClose, onConfirm }: DeletePaymentAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    await onConfirm()
    setIsDeleting(false)
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[420px]">
        <AlertDialogHeader className="items-center text-center space-y-3">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 stroke-[2]" />
          </div>
          <AlertDialogTitle className="text-xl font-black">¿Anular Registro?</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-muted-foreground font-medium">
            Esta acción anulará el cobro, retirando el dinero del arqueo de caja y reabriendo el saldo deudor del tratamiento asociado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex gap-2 sm:justify-center w-full">
          <AlertDialogCancel 
            disabled={isDeleting} 
            className="rounded-xl font-bold text-[13px] h-11 px-6 border-border hover:bg-muted"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[13px] h-11 px-6 border-none"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sí, Anular Cobro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}