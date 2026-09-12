"use client"

import React from "react"
import { 
  ShieldAlert, Calendar, User, FileText, 
  DollarSign, CheckCircle2, History
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeletedPaymentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
}

export function DeletedPaymentDetailModal({
  isOpen,
  onClose,
  payment
}: DeletedPaymentDetailModalProps) {
  if (!payment) return null

  const rawNotes: string = typeof payment.notes === "string" ? payment.notes : ""

  const [headerAndReason, originalHistory] = rawNotes.split(" | Registro original: ")
  const reasonText = headerAndReason.replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "").trim()
  const deletedDate = payment.updatedAt ? new Date(payment.updatedAt) : new Date(payment.createdAt)

  let deletedBy = "Administrador"
  const matchUser = rawNotes.match(/por ([^\]]+) el/)
  if (matchUser && matchUser[1]) {
    deletedBy = matchUser[1].trim()
  } else if (payment.processedBy?.name) {
    deletedBy = payment.processedBy.name
  }

  const paymentNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const rawAmount = Math.abs(Number(payment.amount || payment.paidAmount || 0))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-0 overflow-hidden font-sans antialiased">
        {/* Cabecera */}
        <DialogHeader className="px-6 py-4 border-b border-border/70 bg-rose-500/5 flex flex-row items-center gap-3 text-left">
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              Detalle de Auditoría de Pago
              <span className="text-[11px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20">
                ANULADO
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
              Comprobante {paymentNum} • Monto: ${rawAmount.toFixed(2)} USD
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Contenido */}
        <div className="p-6 space-y-4 text-xs">
          {/* Metadatos de la anulación */}
          <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3.5 rounded-2xl border border-border/70">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Anulado Por
              </span>
              <p className="font-bold text-foreground text-xs">{deletedBy}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Fecha y Hora
              </span>
              <p className="font-semibold text-foreground text-xs">
                {format(deletedDate, "dd MMM yyyy • HH:mm:ss", { locale: es })}
              </p>
            </div>
          </div>

          {/* Motivo ingresado en caja */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Motivo / Justificación de Caja
            </label>
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-foreground font-medium leading-relaxed">
              {reasonText || "Sin justificación registrada."}
            </div>
          </div>

          {/* Registro original previo */}
          {originalHistory && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Registro Original Previo
              </label>
              <div className="p-3 bg-muted/40 border border-border/80 rounded-xl font-mono text-[11px] text-muted-foreground leading-relaxed break-all">
                {originalHistory}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border/70 bg-muted/10 flex justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl text-xs font-bold h-9 px-4 bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
          >
            Cerrar Detalle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}