"use client"

import React from "react"
import { CheckCircle2, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentSuccessStepProps {
  invoiceId: string | null
  totalPaid: number
  paymentMethod: string
  onReset: () => void
}

export function PaymentSuccessStep({
  invoiceId,
  totalPaid,
  paymentMethod,
  onReset
}: PaymentSuccessStepProps) {
  return (
    <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
      </div>

      <div>
        <h3 className="text-2xl font-black text-foreground">¡Cobro Registrado!</h3>
        <p className="text-xs font-semibold text-muted-foreground mt-1">
          Se ha generado el comprobante <b className="text-foreground">#{invoiceId}</b>
        </p>
      </div>

      <div className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-2 text-xs">
        <div className="flex justify-between font-medium text-muted-foreground">
          <span>Monto Cobrado:</span>
          <span className="font-black text-foreground">${totalPaid.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between font-medium text-muted-foreground">
          <span>Método:</span>
          <span className="font-bold text-foreground">{paymentMethod}</span>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <Button 
          onClick={() => window.open(`/factura/${invoiceId}`, "_blank")}
          className="w-full bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Ver Factura en Línea (PDF)
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          <Button 
            variant="outline"
            onClick={() => window.print()}
            className="w-full font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#008bcd]" /> Imprimir Recibo
          </Button>

          <Button 
            variant="outline"
            onClick={onReset}
            className="w-full font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  )
}