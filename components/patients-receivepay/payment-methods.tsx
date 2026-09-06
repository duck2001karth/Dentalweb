"use client"

import React, { useRef } from "react"
import { 
  Banknote, Building2, CreditCard, Upload, 
  X, CheckCircle, FileText, Edit3 
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
    <div className="space-y-5 font-sans antialiased w-full">
      
      {/* SECCIÓN ABONO / MONTO PERSONALIZADO */}
      <div 
        onClick={() => setUseCustomAmount(!useCustomAmount)}
        className={cn(
          "p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group",
          useCustomAmount 
            ? "border-[#008bcd]/50 bg-[#008bcd]/10 shadow-sm" 
            : "border-border/80 bg-card hover:border-foreground/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-colors border",
            useCustomAmount ? "bg-[#008bcd] border-[#008bcd]" : "bg-muted border-border/80 group-hover:border-foreground/30"
          )}>
            {useCustomAmount && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
          <div>
            <span className={cn("text-xs font-bold block", useCustomAmount ? "text-[#008bcd] dark:text-[#38bdf8]" : "text-foreground")}>
              Abono Parcial / Libre
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5 block">
              Modificar el monto a cobrar hoy
            </span>
          </div>
        </div>

        {useCustomAmount ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-bold text-muted-foreground">$</span>
            <Input 
              type="number"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-28 h-10 text-right font-mono font-black text-lg text-[#008bcd] dark:text-[#38bdf8] rounded-xl border-border focus:border-[#008bcd] focus:ring-[#008bcd]/20 bg-background shadow-sm"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-[11px] font-semibold">Editar</span>
            <Edit3 className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* SELECTOR HORIZONTAL DE MEDIOS DE PAGO */}
      <div className="space-y-3">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
          Medio de Pago <span className="text-red-500">*</span>
        </Label>
        
        <div className="grid grid-cols-3 gap-3">
          {METHODS.map((m) => {
            const Icon = m.icon
            const isSelected = paymentMethod === m.id

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={cn(
                  "py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer relative",
                  isSelected 
                    ? "border-[#008bcd] bg-[#008bcd]/10 text-[#008bcd] dark:text-[#38bdf8] shadow-sm ring-1 ring-[#008bcd]/20" 
                    : "border-border/80 bg-card hover:bg-muted/50 hover:border-foreground/20 text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isSelected ? "stroke-[2.5]" : "stroke-[2]")} />
                <span className={cn("text-[11px] tracking-wide", isSelected ? "font-bold" : "font-semibold")}>
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CAMPOS OBLIGATORIOS PARA MÉTODOS DIGITALES */}
      {requiresReference && (
        <div className="space-y-4 pt-5 border-t border-border/80 animate-in fade-in duration-300">
          
          {/* INPUT DE REFERENCIA */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
              <span>Nº Comprobante / Lote <span className="text-red-500">*</span></span>
            </Label>
            <div className="relative">
              <FileText className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 stroke-[2]" />
              <Input 
                placeholder="Ej: 9876543210"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border bg-muted/20 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-[#008bcd] focus:ring-[#008bcd]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* UPLOAD DE IMAGEN */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Capture Digital (Opcional)
            </Label>

            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageChange} 
              className="hidden" 
            />

            {receiptImage ? (
              <div className="relative rounded-xl border border-border bg-card p-2.5 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <img src={receiptImage} alt="Comprobante" className="w-10 h-10 rounded-lg object-cover border border-border/50" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-foreground">Comprobante.jpg</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3 h-3" /> Adjuntado con éxito
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-[#008bcd]/50 rounded-xl p-4 text-center bg-muted/20 hover:bg-[#008bcd]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-background shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform border border-border/50">
                  <Upload className="w-4 h-4 text-muted-foreground group-hover:text-[#008bcd] dark:group-hover:text-[#38bdf8]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-[#008bcd] dark:group-hover:text-[#38bdf8]">
                    Clic para subir comprobante
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                    Formatos JPG, PNG
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}