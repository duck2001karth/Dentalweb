"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentMethodsEcuadorProps {
  paymentMethod: string
  setPaymentMethod: (val: string) => void
  reference: string
  setReference: (val: string) => void
  useCustomAmount: boolean
  setUseCustomAmount: (val: boolean) => void
  customAmount: string
  setCustomAmount: (val: string) => void
  selectedTotal: number
}

export function PaymentMethodsEcuador({
  paymentMethod,
  setPaymentMethod,
  reference,
  setReference,
  useCustomAmount,
  setUseCustomAmount,
  customAmount,
  setCustomAmount,
  selectedTotal
}: PaymentMethodsEcuadorProps) {
  return (
    <div className="space-y-4">
      {/* ABONO PARCIAL LIBRE */}
      <div className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 font-bold text-foreground cursor-pointer">
            <input 
              type="checkbox" 
              checked={useCustomAmount}
              onChange={(e) => setUseCustomAmount(e.target.checked)}
              className="rounded border-border text-[#008bcd] focus:ring-[#008bcd]"
            />
            Ingresar un abono parcial / libre
          </label>
          <span className="font-extrabold text-[#008bcd] text-sm">${selectedTotal.toFixed(2)} USD</span>
        </div>

        {useCustomAmount && (
          <div className="pt-2 animate-in fade-in duration-200">
            <Label className="text-xs font-bold text-foreground mb-1 block">
              Monto a pagar ($ USD)
            </Label>
            <Input 
              type="number"
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`Máximo $${selectedTotal.toFixed(2)}`}
              className="bg-background border-border/80 h-10 text-xs font-bold rounded-xl focus-visible:ring-[#008bcd]"
            />
          </div>
        )}
      </div>

      {/* SELECCIÓN DE MÉTODO DE PAGO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">Medio de Pago</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="bg-background border-border/80 h-10 text-xs font-bold rounded-xl focus:ring-[#008bcd]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/80 text-xs font-semibold rounded-xl">
              <SelectItem value="EFECTIVO">💵 Efectivo ($ USD)</SelectItem>
              <SelectItem value="TRANSFERENCIA">🏦 Transferencia / Deuna (Pichincha)</SelectItem>
              <SelectItem value="TARJETA_DEBITO">💳 Tarjeta Débito</SelectItem>
              <SelectItem value="TARJETA_CREDITO">💳 Tarjeta Crédito</SelectItem>
              <SelectItem value="CHEQUE">📑 Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod !== "EFECTIVO" && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <Label className="text-xs font-bold text-foreground">Nº Comprobante / Referencia *</Label>
            <Input 
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: 987654321"
              className="bg-background border-border/80 h-10 text-xs font-semibold rounded-xl focus-visible:ring-[#008bcd]"
            />
          </div>
        )}
      </div>
    </div>
  )
}