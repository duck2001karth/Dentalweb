"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Receipt, CheckCircle2, ExternalLink, Tag, AlertCircle, RotateCcw } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH":
    case "EFECTIVO":
      return "Efectivo"
    case "CREDIT_CARD":
    case "TARJETA_CREDITO":
      return "Tarjeta de Crédito"
    case "DEBIT_CARD":
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito"
    case "TRANSFER":
    case "TRANSFERENCIA":
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
  }
}

export function PaymentBreakdownModal({ isOpen, onClose, payment, patient }: any) {
  const router = useRouter()
  if (!payment) return null

  const paymentNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const rawAmount = Number(payment.amount || payment.paidAmount || 0)
  const isCreditNote = rawAmount < 0 || payment.notes?.includes("NOTA DE CRÉDITO")
  const methodSpanish = formatPaymentMethod(payment.method || payment.paymentMethod)
  const dateStr = payment.createdAt || payment.receiptDate || new Date()
  
  const treatmentName = payment.treatmentPlan?.name || payment.treatmentName
  const planId = payment.treatmentPlanId || payment.treatmentPlan?.id || payment.planId
  const isPlanDeleted = !treatmentName && !planId

  let realItems: any[] = []
  let textNotes = ""

  if (payment.notes) {
    try {
      const parsedNotes = JSON.parse(payment.notes)
      if (Array.isArray(parsedNotes)) realItems = parsedNotes
      else textNotes = payment.notes
    } catch (e) {
      textNotes = payment.notes
    }
  }

  if (realItems.length === 0 && !isCreditNote) {
    realItems = payment.itemsPaid || payment.treatmentPlan?.items || []
  }

  const handleGoToPlan = () => {
    onClose()
    const activePatientId = patient?.id || payment?.patientId
    if (activePatientId && planId) {
      router.push(`/paciente/${activePatientId}?tab=planes&planId=${planId}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] bg-card text-card-foreground border-border rounded-2xl p-6 font-sans antialiased">
        
        {/* ENCABEZADO */}
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <div className={`p-2 rounded-xl ${isCreditNote ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-[#008bcd]/15 text-[#008bcd]'}`}>
              {isCreditNote ? <RotateCcw className="w-5 h-5 stroke-[2.2]" /> : <Receipt className="w-5 h-5 stroke-[2.2]" />}
            </div>
            {isCreditNote ? `Nota de Crédito ${paymentNum}` : `Desglose del Pago ${paymentNum}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {isCreditNote ? "Detalle de devolución o ajuste financiero." : "Imputación del dinero a las prestaciones clínicas registradas."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          
          {/* RESUMEN FINANCIERO */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Medio de Pago</p>
              <p className="font-bold text-foreground mt-0.5 text-sm">{methodSpanish}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha de Emisión</p>
              <p className="font-bold text-foreground mt-0.5 text-sm">
                {format(new Date(dateStr), "dd MMM yyyy", { locale: es })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isCreditNote ? "Monto Devuelto" : "Total Cobrado"}
              </p>
              <p className={`font-extrabold text-base mt-0.5 ${isCreditNote ? 'text-amber-600 dark:text-amber-400' : 'text-[#008bcd]'}`}>
                ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {textNotes && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <RotateCcw className="w-3.5 h-3.5" /> Observaciones / Justificación:
              </p>
              <p className="font-medium leading-relaxed pl-5 text-slate-800 dark:text-slate-200">
                {textNotes}
              </p>
            </div>
          )}

          {/* ESTADO DEL PLAN ASOCIADO (SOLO PARA COBROS REGULARES) */}
          {!isCreditNote && (
            <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
              isPlanDeleted 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" 
                : "bg-[#008bcd]/10 border-[#008bcd]/20 text-foreground"
            }`}>
              <div className="flex items-center gap-2">
                {isPlanDeleted ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <Tag className="w-4 h-4 text-[#008bcd] shrink-0" />
                )}
                <span className="font-medium">Tratamiento Vinculado:</span>
                <b className="font-bold">
                  {isPlanDeleted ? "Plan eliminado de la base de datos" : treatmentName}
                </b>
              </div>

              {!isPlanDeleted && planId && (
                <button 
                  onClick={handleGoToPlan}
                  className="text-[11px] font-bold text-[#008bcd] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  Ver Plan <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* TABLA DE PRESTACIONES (SI APLICA) */}
          {!isCreditNote && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                Detalle de procedimientos cubiertos:
              </p>

              <div className="rounded-xl border border-border/80 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Pieza / Región</th>
                      <th className="py-2.5 px-3">Procedimiento / Prestación</th>
                      <th className="py-2.5 px-3 text-right">Abono Aplicado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-normal">
                    {realItems.length > 0 ? (
                      realItems.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold bg-muted px-2 py-0.5 rounded-md text-[11px] text-foreground">
                              {item.tooth || item.toothNumber || "General"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {item.procedureName || item.name || "Prestación odontológica"}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-foreground">
                            ${Number(item.appliedAmount || item.paidAmount || rawAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-muted-foreground font-semibold">
                          Abono general registrado a la cuenta del paciente (${rawAmount.toFixed(2)})
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE DIÁLOGO */}
        <DialogFooter className="pt-3 border-t border-border/60 flex flex-row items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-muted-foreground italic">
            {isCreditNote ? "Registro oficial de ajuste contable." : "Registro inmutable preservado."}
          </span>

          <Button 
            onClick={onClose} 
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold rounded-xl text-xs h-10 px-6 cursor-pointer"
          >
            Cerrar
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}