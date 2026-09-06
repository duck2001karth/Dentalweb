"use client"

import React, { useRef } from "react"
import { 
  Banknote, Building2, CreditCard, Upload, 
  X, CheckCircle, FileText, Edit3, ChevronRight 
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

const STANDARD_MONTHS = ["3", "6", "9", "12"]

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

  const isCard = paymentMethod.startsWith("TARJETA")
  const isCredit = paymentMethod.startsWith("TARJETA_CREDITO")
  const isDeferred = paymentMethod.includes("DIFERIDO")
  const requiresReference = paymentMethod === "TRANSFERENCIA" || isCard

  const currentMonth = isDeferred ? paymentMethod.replace("TARJETA_CREDITO_DIFERIDO_", "") : ""
  const isCustomMonth = isDeferred && currentMonth !== "" && !STANDARD_MONTHS.includes(currentMonth)

  return (
    <div className="space-y-4 font-sans antialiased w-full pb-2">
      {/* SECCIÓN ABONO / MONTO PERSONALIZADO */}
      <div 
        onClick={() => setUseCustomAmount(!useCustomAmount)}
        className={cn(
          "p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group",
          useCustomAmount 
            ? "border-[#008bcd]/50 bg-[#008bcd]/10 shadow-sm" 
            : "border-border/80 bg-card hover:border-foreground/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-4 h-4 rounded flex items-center justify-center transition-colors border",
            useCustomAmount ? "bg-[#008bcd] border-[#008bcd]" : "bg-muted border-border/80 group-hover:border-foreground/30"
          )}>
            {useCustomAmount && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
          <div>
            <span className={cn("text-[11px] font-bold block", useCustomAmount ? "text-[#008bcd] dark:text-[#38bdf8]" : "text-foreground")}>
              Abono Parcial / Libre
            </span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5 block">
              Modificar el monto a cobrar hoy
            </span>
          </div>
        </div>

        {useCustomAmount ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-bold text-muted-foreground">$</span>
            <Input 
              type="number"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-24 h-8 text-right font-mono font-bold text-sm text-[#008bcd] dark:text-[#38bdf8] rounded-lg border-border focus:border-[#008bcd] focus:ring-[#008bcd]/20 bg-background shadow-sm"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-[10px] font-semibold">Editar</span>
            <Edit3 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* SELECTOR HORIZONTAL DE MEDIOS DE PAGO */}
      <div className="space-y-2.5">
        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
          Medio de Pago <span className="text-red-500">*</span>
        </Label>
        
        <div className="grid grid-cols-3 gap-2.5">
          {METHODS.map((m) => {
            const Icon = m.icon
            const isSelected = m.id === "TARJETA" ? isCard : paymentMethod === m.id

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (m.id === "TARJETA") setPaymentMethod("TARJETA_DEBITO")
                  else setPaymentMethod(m.id)
                }}
                className={cn(
                  "py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer relative",
                  isSelected 
                    ? "border-[#008bcd] bg-[#008bcd]/10 text-[#008bcd] dark:text-[#38bdf8] shadow-sm ring-1 ring-[#008bcd]/20" 
                    : "border-border/80 bg-card hover:bg-muted/50 hover:border-foreground/20 text-muted-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "stroke-[2.5]" : "stroke-[2]")} />
                <span className={cn("text-[10px] tracking-wide", isSelected ? "font-bold" : "font-semibold")}>
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* SUB-MENÚ DINÁMICO PARA TARJETAS */}
        {isCard && (
          <div className="p-3 mt-2 bg-card border border-border/80 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("TARJETA_DEBITO")}
                className={cn("py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border", !isCredit ? "bg-[#008bcd] border-[#008bcd] text-white shadow-sm" : "bg-muted border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/80")}
              >
                Débito
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("TARJETA_CREDITO_CORRIENTE")}
                className={cn("py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border", isCredit ? "bg-[#008bcd] border-[#008bcd] text-white shadow-sm" : "bg-muted border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/80")}
              >
                Crédito
              </button>
            </div>

            {isCredit && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TARJETA_CREDITO_CORRIENTE")}
                  className={cn("py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border", !isDeferred ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-muted border-border/50 text-muted-foreground hover:text-foreground")}
                >
                  Corriente
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TARJETA_CREDITO_DIFERIDO_3")}
                  className={cn("py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border flex justify-center items-center gap-1", isDeferred ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-muted border-border/50 text-muted-foreground hover:text-foreground")}
                >
                  Diferido {isDeferred && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {isDeferred && (
              <div className="flex gap-2 pt-2 border-t border-border/50 animate-in fade-in duration-200">
                {STANDARD_MONTHS.map((months) => {
                  const isActive = paymentMethod === `TARJETA_CREDITO_DIFERIDO_${months}`
                  return (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setPaymentMethod(`TARJETA_CREDITO_DIFERIDO_${months}`)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                        isActive ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-muted border-border/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {months}
                    </button>
                  )
                })}
                
                {/* CAMPO EDITABLE OTROS MESES */}
                <div className="relative flex-1 min-w-[65px]">
                  <Input 
                    type="number"
                    min="2"
                    placeholder="Otro"
                    value={isCustomMonth ? currentMonth : ""}
                    onChange={(e) => {
                      const val = e.target.value.trim()
                      if (val) setPaymentMethod(`TARJETA_CREDITO_DIFERIDO_${val}`)
                      else setPaymentMethod("TARJETA_CREDITO_DIFERIDO_12")
                    }}
                    className={cn(
                      "h-7 w-full pl-2 pr-6 text-[10px] font-bold rounded-lg border focus:ring-[#008bcd]/20 transition-all text-center placeholder:font-semibold",
                      isCustomMonth 
                        ? "bg-emerald-600 border-emerald-600 text-white placeholder:text-emerald-100" 
                        : "bg-muted border-border/50 text-muted-foreground hover:bg-muted/80 focus:bg-background focus:text-foreground"
                    )}
                  />
                  <Edit3 className={cn("absolute right-2 top-1.5 w-3 h-3 pointer-events-none", isCustomMonth ? "text-emerald-200" : "text-muted-foreground/70")} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CAMPOS PARA MÉTODOS DIGITALES */}
      {requiresReference && (
        <div className="space-y-3 pt-3 border-t border-border/80 animate-in fade-in duration-300">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
              <span>Nº Comprobante / Lote <span className="text-red-500">*</span></span>
            </Label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5 stroke-[2]" />
              <Input 
                placeholder="Ej: 9876543210"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="pl-8 h-9 rounded-xl border-border bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-[#008bcd] focus:ring-[#008bcd]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Capture Digital <span className="text-muted-foreground font-normal lowercase">(opcional)</span>
            </Label>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />

            {receiptImage ? (
              <div className="relative rounded-xl border border-border bg-card p-2 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5">
                  <img src={receiptImage} alt="Comprobante" className="w-8 h-8 rounded-lg object-cover border border-border/50" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-foreground">Comprobante adjunto</span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> Éxito
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setReceiptImage(null)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border border-dashed border-border/80 hover:border-[#008bcd]/50 rounded-xl p-2.5 bg-muted/20 hover:bg-[#008bcd]/5 transition-all cursor-pointer flex items-center gap-3 group"
              >
                <div className="w-7 h-7 rounded-full bg-background shadow-sm flex items-center justify-center border border-border/50 group-hover:scale-105 transition-transform shrink-0">
                  <Upload className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#008bcd] dark:group-hover:text-[#38bdf8]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-[#008bcd] dark:group-hover:text-[#38bdf8]">
                    Subir foto o voucher
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
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