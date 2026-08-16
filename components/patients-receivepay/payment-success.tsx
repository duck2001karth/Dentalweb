"use client"

import React, { useState } from "react"
import { CheckCircle2, Printer, FileText, ArrowRight, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { generateReceiptHTML } from "./receipt-print-sheet"

interface PaymentSuccessStepProps {
  invoiceId: string | null
  totalPaid: number
  paymentMethod: string
  patient?: any
  items?: any[]
  onReset: () => void
}

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase().trim()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": case "TARJETA": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "DEUNA": return "Transferencia Bancaria"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

const formatReceiptCode = (rawId: string | null) => {
  if (!rawId) return "#REC-0001"
  if (rawId.startsWith("#REC-") || rawId.startsWith("REC-")) {
    return rawId.startsWith("#") ? rawId : `#${rawId}`
  }
  const clean = rawId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
  return `#REC-${clean}`
}

export function PaymentSuccessStep({
  invoiceId,
  totalPaid,
  paymentMethod,
  patient,
  items = [],
  onReset
}: PaymentSuccessStepProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const displayCode = formatReceiptCode(invoiceId)
  const displayMethod = formatPaymentMethod(paymentMethod)
  const patientName = patient 
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() 
    : "Paciente Registrado"

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayCode)
    setCopied(true)
    toast({ title: "Copiado", description: "Código de comprobante copiado." })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewInvoicePDF = () => {
    if (!invoiceId) return
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank")
  }

  const handlePrintReceipt = () => {
    setIsPrinting(true)

    const receiptHtml = generateReceiptHTML({
      receiptNumber: displayCode,
      patientName,
      patientDocumentId: patient?.ci || patient?.identification || patient?.documentId || "No registrado",
      totalPaid,
      paymentMethod: displayMethod,
      items
    })

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(receiptHtml)
      doc.close()

      setTimeout(() => {
        setIsPrinting(false)
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 300)
    } else {
      setIsPrinting(false)
    }
  }

  return (
    <div className="p-8 sm:p-10 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-300 font-sans antialiased">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full" />
        <div className="relative w-24 h-24 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-background">
          <CheckCircle2 className="w-12 h-12 text-white stroke-[3]" />
        </div>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-3xl font-black tracking-tight text-foreground">
          ¡Cobro Registrado con Éxito!
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <span>Comprobante generado:</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008bcd]/10 text-[#008bcd] hover:bg-[#008bcd]/20 dark:bg-[#008bcd]/20 dark:text-[#38bdf8] transition-all border border-[#008bcd]/20 cursor-pointer"
            title="Copiar código"
          >
            <span className="font-extrabold tracking-wide">{displayCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
          </button>
        </div>
      </div>

      {/*TARJETA DE RESUMEN (USANDO COLORES SEMÁNTICOS) */}
      <div className="w-full bg-muted/40 border border-border rounded-[24px] p-6 space-y-4 shadow-sm relative overflow-hidden">
        
        {/* MONTO COBRADO */}
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Monto Cobrado
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ${Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
          </span>
        </div>

        {/* MÉTODO DE PAGO */}
        <div className="flex justify-between items-center pt-4 border-t border-border/80 relative z-10">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Método de Pago
          </span>
          <span className="text-xs font-bold text-foreground bg-background border border-border shadow-sm px-3.5 py-1.5 rounded-xl uppercase tracking-wider">
            {displayMethod}
          </span>
        </div>
      </div>

      {/*BOTONES DE ACCIÓN */}
      <div className="w-full space-y-3 pt-2">
        <Button
          type="button"
          onClick={handleViewInvoicePDF}
          className="w-full bg-[#008bcd] hover:bg-[#0074a6] text-white font-bold h-12 rounded-2xl shadow-md shadow-[#008bcd]/20 flex items-center justify-center gap-2 text-sm cursor-pointer transition-all active:scale-[0.98]"
        >
          <FileText className="w-4 h-4" />
          Ver Factura Electrónica (PDF)
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {/* BOTÓN SECUNDARIO (IMPRIMIR) */}
          <Button
            type="button"
            variant="outline"
            disabled={isPrinting}
            onClick={handlePrintReceipt}
            className="border-border bg-background hover:bg-muted text-foreground font-bold h-12 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 text-[#008bcd] animate-spin" />
            ) : (
              <Printer className="w-4 h-4 text-[#008bcd]" />
            )}
            <span>{isPrinting ? "Generando..." : "Imprimir Recibo"}</span>
          </Button>

          {/* BOTÓN FINALIZAR */}
          <Button
            type="button"
            onClick={onReset}
            className="bg-foreground hover:bg-foreground/90 text-background font-bold h-12 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-[0.98]"
          >
            <span>Finalizar</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  )
}