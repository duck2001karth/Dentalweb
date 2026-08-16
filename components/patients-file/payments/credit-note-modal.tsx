"use client"

import React, { useState } from "react"
import { RotateCcw, Loader2 } from "lucide-react"

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

export function CreditNoteModal({ isOpen, onClose, payment, onSuccess }: any) {
  const { toast } = useToast()
  const [reason, setReason] = useState("ANULACION")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (!payment) return null

  const paymentNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const maxAmount = Number(payment.amount || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/payments/${payment.id}/credit-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason, 
          amount: parseFloat(amount || maxAmount.toString()), 
          notes 
        })
      })

      if (res.ok) {
        toast({ title: "Nota de Crédito Emitida", description: "Se ha registrado la nota de crédito y ajustado los saldos.", variant: "success" })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo emitir la nota de crédito.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground border-border rounded-2xl p-6 font-sans">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <RotateCcw className="w-5 h-5" /> Emitir Nota de Crédito
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Aplica una devolución o anulación formal sobre el pago <strong className="text-foreground">{paymentNum}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Motivo de la Anulación / Devolución</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-xl h-10 text-xs">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs font-sans">
                <SelectItem value="ANULACION">Anulación de cobro por error</SelectItem>
                <SelectItem value="DUPLICADO">Cobro registrado por duplicado</SelectItem>
                <SelectItem value="DEVOLUCION_PACIENTE">Devolución a solicitud del paciente</SelectItem>
                <SelectItem value="TRATAMIENTO_CANCELADO">Procedimiento no realizado</SelectItem>
                <SelectItem value="OTRO">Otro motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Monto a Acreditar (Máximo: ${maxAmount.toFixed(2)})</Label>
            <Input 
              type="number"
              step="0.01"
              max={maxAmount}
              defaultValue={maxAmount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl h-10 text-xs font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Observaciones / Justificación</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe detalles adicionales para auditoría contable..."
              className="rounded-xl text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs h-10">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold h-10 px-5 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Emitir Nota de Crédito
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}