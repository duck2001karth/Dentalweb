"use client"

import React from "react"
import { CheckCircle, Printer, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentSuccessStepProps {
  invoiceId: string | null
  totalPaid: number
  paymentMethod: string
  patient?: any
  onReset: () => void
}

export function PaymentSuccessStep({
  invoiceId,
  totalPaid,
  paymentMethod,
  patient,
  onReset
}: PaymentSuccessStepProps) {
  const handleViewInvoicePDF = () => {
    if (!invoiceId) return
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank")
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans antialiased">
      <div className="w-20 h-20 bg-emerald-500/15 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-xs">
        <CheckCircle className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-2xl font-black text-foreground tracking-tight">
          ¡Cobro Registrado!
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Se ha generado el comprobante <b className="text-foreground">#{invoiceId || "REC-706645"}</b>
        </p>
      </div>
      <div className="w-full bg-muted/20 border border-border/80 rounded-2xl p-5 space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase">Monto Cobrado:</span>
          <span className="text-base font-black text-emerald-600">${totalPaid.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between items-center border-t border-border/60 pt-3">
          <span className="text-xs font-bold text-muted-foreground uppercase">Método:</span>
          <span className="text-xs font-extrabold text-foreground uppercase">{paymentMethod}</span>
        </div>
      </div>

      <div className="w-full space-y-3 pt-2">
        <Button
          onClick={handleViewInvoicePDF}
          className="w-full bg-[#008bcd] hover:bg-[#0077b3] text-white font-extrabold h-11 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95 transition-all"
        >
          <FileText className="w-4 h-4" /> Ver Factura en Línea (PDF)
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handlePrintReceipt}
            className="border-border/80 hover:bg-muted font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#008bcd]" /> Imprimir Recibo
          </Button>

          <Button
            onClick={onReset}
            className="bg-foreground hover:bg-foreground/90 text-background font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            Finalizar <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  )
}