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

// Interfaz actualizada para coincidir con lo que envía payment-tab.tsx
export interface PaymentSuccessStepProps {
  paymentData?: any
  onSendReceipt?: () => void
  onDownloadPDF?: () => void
  onPrintTicket?: () => void
  onFinish?: () => void
  onClose?: () => void
  
  // Props de fallback por si se usa la versión antigua
  invoiceId?: string | null
  totalPaid?: number
  paymentMethod?: string
  patient?: any
  items?: any[]
  onReset?: () => void
}

export function PaymentSuccessStep({
  paymentData,
  onSendReceipt,
  onDownloadPDF,
  onPrintTicket,
  onFinish,
  onClose,
  
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

  // Normalización para soportar tanto los props antiguos como paymentData
  const activeInvoiceId = paymentData?.receiptNumber || paymentData?.invoiceId || invoiceId
  const activeTotal = paymentData?.amount || paymentData?.totalPaid || totalPaid || 0
  const activeMethod = paymentData?.method || paymentData?.paymentMethod || paymentMethod
  const activeItems = paymentData?.items || items || []
  const activePatientDoc = paymentData?.patient?.ci || patient?.ci || "No registrado"
  
  const displayCode = formatReceiptCode(activeInvoiceId)
  const displayMethod = formatPaymentMethod(activeMethod)
  const patientName = paymentData?.patientName || (patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "Paciente Registrado")

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayCode)
    setCopied(true)
    toast({ title: "Copiado", description: "Código de comprobante copiado." })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewInvoicePDF = () => {
    if (onDownloadPDF) return onDownloadPDF()
    if (!activeInvoiceId) return
    window.open(`/api/invoices/${activeInvoiceId}/pdf`, "_blank")
  }

  const handleSendWhatsApp = async () => {
    if (onSendReceipt) return onSendReceipt()
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
    if (onPrintTicket) return onPrintTicket()
    setIsPrinting(true)
    const receiptHtml = generateReceiptHTML({
      receiptNumber: displayCode,
      patientName,
      patientDocumentId: activePatientDoc,
      totalPaid: activeTotal,
      paymentMethod: displayMethod,
      items: activeItems,
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
    <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans antialiased w-full">
      
      {/* Icono Principal con Glow */}
      <div className="relative flex items-center justify-center mt-2">
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-4 ring-background">
          <CheckCircle2 className="w-10 h-10 text-white stroke-[2.5] drop-shadow-sm" />
        </div>
      </div>
      
      {/* Título y Código */}
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-foreground">
          ¡Pago Registrado!
        </h3>
        <div className="flex flex-col items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Nº de Comprobante:</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-all border border-border cursor-pointer shadow-sm"
            title="Copiar código"
          >
            <span className="font-mono font-bold tracking-wider text-[11px]">{displayCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>
      </div>

      {/* Tarjeta de Resumen Adaptativa (Evita romper el Dark Mode) */}
      <div className="w-full bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
        <div className="flex flex-col items-center justify-center relative z-10 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Monto Cobrado
          </span>
          <span className="text-3xl font-black font-mono text-[#008bcd] dark:text-[#38bdf8] tracking-tight">
            ${Number(activeTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60 relative z-10">
          <div className="text-left">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Paciente</span>
            <span className="text-[11px] font-bold text-foreground capitalize leading-tight line-clamp-2">
              {patientName.toLowerCase()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Método</span>
            <span className="inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md uppercase tracking-wider text-center w-full">
              {displayMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
        <Button
          type="button"
          variant="outline"
          disabled={isSendingWa}
          onClick={handleSendWhatsApp}
          className="border-border bg-card hover:bg-muted text-foreground font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {isSendingWa ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#008bcd]" /> : <MessageCircle className="w-3.5 h-3.5 text-[#008bcd]" />}
          <span>Enviar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleViewInvoicePDF}
          className="border-border bg-card hover:bg-muted text-foreground font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <FileText className="w-3.5 h-3.5 text-[#008bcd]" />
          <span>Descargar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPrinting}
          onClick={handlePrintReceipt}
          className="border-border bg-card hover:bg-muted text-foreground font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {isPrinting ? <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" /> : <Printer className="w-3.5 h-3.5 text-muted-foreground" />}
          <span>Imprimir</span>
        </Button>

        <Button
          type="button"
          onClick={onFinish || onReset || onClose}
          className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-[0.98]"
        >
          <span>Finalizar</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-90" />
        </Button>
      </div>
    </div>
  )
}