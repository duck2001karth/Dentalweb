"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, AlertTriangle, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ManagePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  mode: "edit" | "delete"
  onSuccess?: () => void
}

export function ManagePaymentModal({
  isOpen,
  onClose,
  payment,
  mode,
  onSuccess
}: ManagePaymentModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [method, setMethod] = useState("CASH")
  const [reference, setReference] = useState("")
  const [receiptNumber, setReceiptNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [deletionReason, setDeletionReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (payment) {
      setMethod(payment.method || payment.paymentMethod || "CASH")
      setReference(payment.reference || "")
      setReceiptNumber(payment.receiptNumber || payment.paymentNumber || `#REC-${payment.id?.slice(-6)}`)
      setNotes(typeof payment.notes === "string" && !payment.notes.startsWith("[") ? payment.notes : "")
      setDeletionReason("")
    }
  }, [payment])

  if (!payment) return null

  const paymentNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const rawAmount = Number(payment.amount || 0)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, reference, receiptNumber, notes })
      })

      if (res.ok) {
        toast({ title: "Pago actualizado", description: "Los datos se guardaron correctamente.", variant: "success" })
        if (onSuccess) onSuccess()
        router.refresh()
        onClose()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron actualizar los datos del pago.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar Pago con Comentario (DELETE)
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletionReason.trim()) {
      toast({ title: "Campo requerido", description: "Por favor ingresa un comentario justificando la eliminación.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deletionReason.trim() })
      })

      if (res.ok) {
        toast({ title: "Pago Eliminado", description: "El pago fue anulado y el saldo recalculado.", variant: "success" })
        if (onSuccess) onSuccess()
        router.refresh()
        onClose()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el cobro.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] bg-card text-card-foreground border-border rounded-2xl p-6 font-sans">
        
        {mode === "edit" ? (
          /* FORMULARIO DE MODIFICACIÓN */
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Pencil className="w-5 h-5 text-[#008bcd]" /> Modificar Datos del Pago
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Ajusta la información administrativa del cobro <strong className="text-foreground">{paymentNum}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Medio de Pago</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-sans text-xs">
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="CREDIT_CARD">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD">Tarjeta de Débito</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia Bancaria / QR</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nº Secuencial / Recibo</Label>
                  <Input 
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Ej: REC-00123"
                    className="rounded-xl h-10 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nº Referencia / Voucher</Label>
                  <Input 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: #TR-9982"
                    className="rounded-xl h-10 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Notas / Justificación</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalla el motivo del cambio..."
                  className="rounded-xl text-xs min-h-[70px]"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs h-10">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl text-xs font-bold h-10 px-5 cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* FORMULARIO DE ELIMINACIÓN CON JUSTIFICACIÓN OBLIGATORIA */
          <form onSubmit={handleDelete}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-500">
                <AlertTriangle className="w-5 h-5" /> Eliminando pago {paymentNum}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                ¿Está seguro de eliminar este cobro de <strong className="text-foreground">${rawAmount.toFixed(2)}</strong>? Si es así, ingrese a continuación un comentario como referencia de esta eliminación.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Comentario para eliminación <span className="text-red-500">*</span>
              </Label>
              <Textarea 
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Escriba el motivo (ej. Error en digitación de monto por caja, pago duplicado...)"
                className="rounded-xl text-xs min-h-[90px] border-border"
                required
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs h-10 font-medium">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !deletionReason.trim()}
                className="rounded-xl text-xs font-bold h-10 px-5 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar pago
              </Button>
            </DialogFooter>
          </form>
        )}

      </DialogContent>
    </Dialog>
  )
}