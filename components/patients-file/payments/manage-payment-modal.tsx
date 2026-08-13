"use client"

import React, { useState, useEffect } from "react"
import { Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react"

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
  const { toast } = useToast()
  const [method, setMethod] = useState("CASH")
  const [reference, setReference] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (payment) {
      setMethod(payment.method || payment.paymentMethod || "CASH")
      setReference(payment.reference || "")
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
        body: JSON.stringify({ method, reference })
      })

      if (res.ok) {
        toast({
          title: "Pago actualizado",
          description: "Los datos del pago se modificaron correctamente.",
          variant: "success"
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos del pago.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Pago Eliminado",
          description: "El registro de pago ha sido anulado correctamente.",
          variant: "success"
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro de pago.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border rounded-2xl p-6 font-sans">
        
        {mode === "edit" ? (
          /* MODO EDICIÓN */
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Pencil className="w-5 h-5 text-[#008bcd]" /> Modificar Datos del Pago
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Edita el medio de pago o la referencia registrada del pago <strong className="text-foreground">{paymentNum}</strong>.
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Número de Referencia / Vouched</Label>
                <Input 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: #TR-998231"
                  className="rounded-xl h-10 text-xs"
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
          /* MODO ELIMINACIÓN */
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-500">
                <AlertTriangle className="w-5 h-5" /> Eliminar Pago {paymentNum}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                ¿Estás seguro de que deseas eliminar este cobro de <strong className="text-foreground">${rawAmount.toFixed(2)}</strong>? Esta acción recalculará los saldos del tratamiento del paciente.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 border-t border-border/60 gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs h-10 font-medium">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isLoading}
                className="rounded-xl text-xs font-bold h-10 px-5 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, Eliminar Pago
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  )
}