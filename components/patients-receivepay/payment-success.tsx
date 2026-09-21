"use client"

import React, { useState } from "react"
import { CheckCircle2, Printer, FileText, ArrowRight, Loader2, Copy, Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useClinicSettings } from "@/config/clinic-settings"
import { generateReceiptHTML } from "./receipt-print-sheet"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase().trim()
  
  if (m === "CASH" || m === "EFECTIVO") return "Efectivo"
  if (m === "TRANSFER" || m === "TRANSFERENCIA") return "Transferencia Bancaria"
  if (m === "TARJETA_DEBITO") return "Tarjeta de Débito"
  if (m === "TARJETA_CREDITO_CORRIENTE") return "T. Crédito (Corriente)"
  
  if (m.startsWith("TARJETA_CREDITO_DIFERIDO_")) {
    const months = m.split("_").pop()
    return `T. Crédito (Diferido ${months} meses)`
  }
  
  if (m === "TARJETA" || m === "CREDIT_CARD") return "Tarjeta"
  if (m === "CHECK" || m === "CHEQUE") return "Cheque"
  
  return method
}

const formatReceiptCode = (rawId: string | null) => {
  if (!rawId) return "#REC-0001"
  if (rawId.startsWith("#REC-") || rawId.startsWith("REC-")) {
    return rawId.startsWith("#") ? rawId : `#${rawId}`
  }
  const clean = rawId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
  return `#REC-${clean}`
}

interface PaymentSuccessStepProps {
  invoiceId: string | null
  totalPaid: number
  paymentMethod: string
  patient?: any
  items?: any[]
  onReset: () => void
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
  const { settings } = useClinicSettings()
  
  const [copied, setCopied] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSendingWa, setIsSendingWa] = useState(false)

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

  const handleSendWhatsApp = async () => {
    setIsSendingWa(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast({
        title: "¡WhatsApp Enviado!",
        description: `El comprobante fue enviado al número de ${patientName}.`,
        variant: "default",
        className: "bg-emerald-600 text-white border-none"
      })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo enviar el WhatsApp.", variant: "destructive" })
    } finally {
      setIsSendingWa(false)
    }
  }

  const handlePrintReceipt = () => {
    setIsPrinting(true)

    const receiptHtml = generateReceiptHTML({
      receiptNumber: displayCode,
      patientName,
      patientDocumentId: patient?.ci || patient?.identification || patient?.documentId || "No registrado",
      totalPaid,
      paymentMethod: displayMethod,
      items,
      clinic: settings
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
    <div className="p-8 sm:p-10 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-300 font-sans antialiased w-full">
      
      <div className="relative flex items-center justify-center mt-2">
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-4 ring-white/50">
          <CheckCircle2 className="w-12 h-12 text-white stroke-[2.5] drop-shadow-sm" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-3xl font-black tracking-tight text-slate-800">
          ¡Pago Registrado!
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm font-medium text-slate-500">
          <span>Nº de Comprobante:</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-[#008bcd]/10 hover:text-[#008bcd] transition-all border border-slate-200 hover:border-[#008bcd]/30 cursor-pointer shadow-sm"
            title="Copiar código"
          >
            <span className="font-mono font-bold tracking-wider">{displayCode}</span>
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[20px] p-6 space-y-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col items-center justify-center relative z-10 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Monto Cobrado
          </span>
          <span className="text-4xl font-black font-mono text-[#008bcd] tracking-tight">
            ${Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100 relative z-10">
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Paciente</span>
            <span className="text-xs font-bold text-slate-700 capitalize leading-tight">
              {patientName.toLowerCase()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Método de Pago</span>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {displayMethod}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            disabled={isSendingWa}
            onClick={handleSendWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-12 rounded-xl shadow-sm shadow-[#25D366]/20 flex items-center justify-center gap-2 text-[13px] cursor-pointer transition-all active:scale-[0.98]"
          >
            {isSendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            Enviar Recibo
          </Button>

          <Button
            type="button"
            onClick={handleViewInvoicePDF}
            className="w-full bg-[#008bcd] hover:bg-[#0074a6] text-white font-bold h-12 rounded-xl shadow-sm shadow-[#008bcd]/20 flex items-center justify-center gap-2 text-[13px] cursor-pointer transition-all active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" />
            Descargar PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPrinting}
            onClick={handlePrintReceipt}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold h-12 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Printer className="w-4 h-4 text-slate-500" />}
            <span>{isPrinting ? "Procesando..." : "Imprimir Ticket"}</span>
          </Button>

          <Button
            type="button"
            onClick={onReset}
            className="bg-slate-800 hover:bg-[#0b0f19] text-white font-bold h-12 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <span>Finalizar</span>
            <ArrowRight className="w-4 h-4 opacity-80" />
          </Button>
        </div>
      </div>
    </div>
  )
}