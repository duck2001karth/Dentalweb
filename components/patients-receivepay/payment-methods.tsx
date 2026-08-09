"use client"

import React, { useRef } from "react"
import { 
  Banknote, Building2, CreditCard, Upload, 
  X, CheckCircle, FileText 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PaymentMethodsEcuadorProps {
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  reference: string
  setReference: (ref: string) => void
  useCustomAmount: boolean
  setUseCustomAmount: (val: boolean) => void
  customAmount: string
  setCustomAmount: (val: string) => void
  selectedTotal: number
  receiptImage: string | null
  setReceiptImage: (img: string | null) => void
}

const METHODS = [
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { id: "TRANSFERENCIA", label: "Transferencia", icon: Building2 },
  { id: "TARJETA", label: "Tarjeta", icon: CreditCard },
]

export function PaymentMethodsEcuador({
  paymentMethod,
  setPaymentMethod,
  reference,
  setReference,
  useCustomAmount,
  setUseCustomAmount,
  customAmount,
  setCustomAmount,
  selectedTotal,
  receiptImage,
  setReceiptImage
}: PaymentMethodsEcuadorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setReceiptImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const requiresReference = paymentMethod === "TRANSFERENCIA" || paymentMethod === "TARJETA"

  return (
    <div className="space-y-4 font-sans antialiased">
      
      {/* ABONO PARCIAL / LIBRE */}
      <div 
        onClick={() => setUseCustomAmount(!useCustomAmount)}
        className={cn(
          "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
          useCustomAmount 
            ? "border-[#008bcd] bg-[#008bcd]/5" 
            : "border-border/80 bg-card hover:border-border"
        )}
      >
        <div className="flex items-center gap-2.5">
          <input 
            type="checkbox" 
            checked={useCustomAmount} 
            onChange={() => {}}
            className="w-4 h-4 rounded text-[#008bcd] focus:ring-[#008bcd] cursor-pointer"
          />
          <span className="text-xs font-bold text-foreground">Abono parcial / libre</span>
        </div>

        {useCustomAmount ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-bold text-muted-foreground">$</span>
            <Input 
              type="number"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-24 h-8 text-right font-extrabold text-xs rounded-lg border-[#008bcd] focus:ring-[#008bcd] bg-background"
            />
          </div>
        ) : (
          <span className="text-xs font-extrabold text-[#008bcd]">
            ${selectedTotal.toFixed(2)}
          </span>
        )}
      </div>

      {/* SELECTOR HORIZONTAL DE MEDIOS DE PAGO */}
      <div>
        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Medio de Pago *
        </Label>
        
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon
            const isSelected = paymentMethod === m.id

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={cn(
                  "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer relative",
                  isSelected 
                    ? "border-[#008bcd] bg-[#008bcd]/10 text-[#008bcd] font-extrabold ring-1 ring-[#008bcd]" 
                    : "border-border/80 bg-card hover:border-[#008bcd]/40 text-muted-foreground font-bold"
                )}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span className="text-[11px] leading-tight">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CAMPOS OBLIGATORIOS PARA MÉTODOS DIGITALES */}
      {requiresReference && (
        <div className="space-y-3 pt-2 border-t border-dashed border-border/80 animate-in fade-in duration-300">
          
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
              <span>Nº Comprobante / Referencia <span className="text-red-500">*</span></span>
            </Label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3 stroke-[2]" />
              <Input 
                placeholder="Ej: 987654321"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="pl-9 h-9 rounded-xl border-border/80 text-xs font-semibold focus:border-[#008bcd] focus:ring-[#008bcd]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-foreground">
              Comprobante o Capture Digital (Opcional)
            </Label>

            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageChange} 
              className="hidden" 
            />

            {receiptImage ? (
              <div className="relative rounded-xl border border-border bg-muted/20 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={receiptImage} alt="Comprobante" className="w-8 h-8 rounded-lg object-cover border" />
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Imagen adjunta
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="p-1 text-muted-foreground hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border/80 hover:border-[#008bcd] rounded-xl p-2.5 text-center bg-muted/10 hover:bg-[#008bcd]/5 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Upload className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#008bcd]" />
                <span className="text-[11px] font-bold text-muted-foreground group-hover:text-[#008bcd]">
                  Adjuntar foto del comprobante
                </span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}