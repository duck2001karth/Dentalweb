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
    case "CASH":
    case "EFECTIVO":
      return "Efectivo"
    case "CREDIT_CARD":
    case "TARJETA_CREDITO":
    case "TARJETA":
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
    : "Patricio Capa"

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

  // 📍 IMPRESIÓN LIMPIA DE 1 SOLA HOJA CON DOCUMENTO OFICIAL
  const handlePrintReceipt = () => {
    setIsPrinting(true)

    const receiptHtml = generateReceiptHTML({
      receiptNumber: displayCode,
      patientName,
      patientDocumentId: patient?.documentId || "1719231696001",
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
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 300)
    } else {
      setIsPrinting(false)
    }
  }

  return (
    <div className="p-7 sm:p-9 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200 font-sans antialiased text-foreground">
      
      {/* ICONO CON GLOW */}
      <div className="relative">
        <div className="w-20 h-20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-xs ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
      </div>

      {/* CABECERA Y BADGE COPIABLE */}
      <div className="space-y-1.5">
        <h3 className="text-2xl font-black tracking-tight text-foreground">
          ¡Cobro Registrado con Éxito!
        </h3>
        <p className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
          Comprobante generado:
          <button
            type="button"
            onClick={handleCopyCode}
            className="group inline-flex items-center gap-1.5 font-extrabold text-[#008bcd] dark:text-[#38bdf8] bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800 text-xs transition-colors cursor-pointer"
            title="Copiar código"
          >
            <span>{displayCode}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />}
          </button>
        </p>
      </div>

      {/* RESUMEN FINANCIERO */}
      <div className="w-full bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xs text-left">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Monto Cobrado:
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ${Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
          </span>
        </div>

        <div className="flex justify-between items-center border-t border-slate-200/80 dark:border-slate-800 pt-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Método de Pago:
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
            {displayMethod}
          </span>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="w-full space-y-3 pt-1">
        <Button
          type="button"
          onClick={handleViewInvoicePDF}
          className="w-full bg-[#008bcd] hover:bg-[#0074a6] text-white font-extrabold h-11 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-[0.98] transition-all"
        >
          <FileText className="w-4 h-4" />
          Ver Factura Electrónica (PDF)
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPrinting}
            onClick={handlePrintReceipt}
            className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 text-[#008bcd] animate-spin" />
            ) : (
              <Printer className="w-4 h-4 text-[#008bcd] dark:text-[#38bdf8]" />
            )}
            {isPrinting ? "Generando..." : "Imprimir Recibo"}
          </Button>

          <Button
            type="button"
            onClick={onReset}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
          >
            Finalizar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  )
}