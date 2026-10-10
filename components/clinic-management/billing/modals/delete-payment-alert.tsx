"use client"

import React, { useState, useEffect } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { 
  AlertDialog, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DeletePaymentAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function DeletePaymentAlert({ isOpen, onClose, onConfirm }: DeletePaymentAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [reason, setReason] = useState("")
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setReason("")
      setShowError(false)
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setShowError(true)
      return
    }

    setIsDeleting(true)
    await onConfirm(reason.trim())
    setIsDeleting(false)
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[440px] p-6">
        <AlertDialogHeader className="items-center text-center space-y-3">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 stroke-[2]" />
          </div>
          <AlertDialogTitle className="text-xl font-black text-foreground">
            ¿Anular Cobro?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-muted-foreground font-medium">
            Esta acción anulará el cobro, retirando el dinero del arqueo de caja y reabriendo el saldo deudor del tratamiento asociado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-2 space-y-1.5 text-left">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Motivo de la Anulación <span className="text-rose-500">*</span>
          </Label>
          <Input 
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (showError) setShowError(false)
            }}
            placeholder="Ej: Error en método de cobro / Paciente canceló cita..."
            className={`h-10 text-xs bg-background rounded-xl ${
              showError ? "border-rose-500 focus-visible:ring-rose-500" : "border-border"
            }`}
          />
          {showError && (
            <p className="text-[10px] text-rose-500 font-bold">
              Debe especificar el motivo para registrarlo en auditoría.
            </p>
          )}
        </div>

        <AlertDialogFooter className="mt-4 flex gap-2 sm:justify-center w-full">
          <AlertDialogCancel 
            disabled={isDeleting} 
            className="rounded-xl font-bold text-[13px] h-10 px-5 border-border hover:bg-muted"
          >
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[13px] h-10 px-5 border-none cursor-pointer"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sí, Anular Cobro
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}