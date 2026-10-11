"use client"

import React from "react"
import { CreditCard, AlertCircle, Check, ImageIcon, Upload, X, Lock, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { PaymentFormData, PaymentState } from "@/types/billing"
import { cn } from "@/lib/utils"

interface PaymentAuditFormProps {
  formData: PaymentFormData
  setFormData: React.Dispatch<React.SetStateAction<PaymentFormData>>
  reference: string
  setReference: (ref: string) => void
  cardType: "CORRIENTE" | "DIFERIDO"
  setCardType: (type: "CORRIENTE" | "DIFERIDO") => void
  installments: string
  setInstallments: (inst: string) => void
  receiptImage: string | null
  setReceiptImage: (img: string | null) => void
  isManualReceipt: boolean
  setIsManualReceipt: (manual: boolean) => void
  isLoadingReceipt: boolean
  isEditing: boolean
  showErrors: boolean
  isReferenceMissing: boolean
}

export function PaymentAuditForm({
  formData,
  setFormData,
  reference,
  setReference,
  cardType,
  setCardType,
  installments,
  setInstallments,
  receiptImage,
  setReceiptImage,
  isManualReceipt,
  setIsManualReceipt,
  isLoadingReceipt,
  isEditing,
  showErrors,
  isReferenceMissing,
}: PaymentAuditFormProps) {
  const isCard = formData.method === "CREDIT_CARD" || formData.method === "DEBIT_CARD"
  const isTransfer = formData.method === "TRANSFER"

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setReceiptImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-3">
      {/* SECCIÓN DE REFERENCIAS (VOUCHER/TRANSFER) COMPACTA */}
      {isCard ? (
        <div className={cn("border rounded-xl p-3 space-y-2.5 transition-colors", showErrors && isReferenceMissing ? "bg-rose-500/5 border-rose-500/80" : "bg-muted/15 border-border/80")}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Datos del POS
            </span>
            {showErrors && isReferenceMissing && (
              <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Requerido
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {formData.method === "CREDIT_CARD" && (
              <div className="col-span-2 flex gap-2">
                <select value={cardType} onChange={(e) => setCardType(e.target.value as any)} className="w-full h-8 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none">
                  <option value="CORRIENTE">Corriente (1 pago)</option>
                  <option value="DIFERIDO">Diferido</option>
                </select>
                {cardType === "DIFERIDO" && (
                  <select value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-24 h-8 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none">
                    <option value="3">3 Meses</option>
                    <option value="6">6 Meses</option>
                    <option value="12">12 Meses</option>
                  </select>
                )}
              </div>
            )}
            <div className="col-span-2">
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="AUT-049821 / LOTE 012"
                className={cn("h-8 bg-background font-mono text-[11px] font-bold uppercase", showErrors && isReferenceMissing ? "border-rose-500" : "border-border")}
              />
            </div>
          </div>
        </div>
      ) : isTransfer ? (
        <div className={cn("border rounded-xl p-3 space-y-2 transition-colors", showErrors && isReferenceMissing ? "bg-rose-500/5 border-rose-500/80" : "bg-muted/15 border-border/80")}>
          <Label className="text-[10px] font-bold text-muted-foreground uppercase">N° Comprobante / Transferencia <span className="text-rose-500">*</span></Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ej: TRANSF-902148"
            className={cn("h-8 bg-background font-mono text-[11px] font-bold uppercase", showErrors && isReferenceMissing ? "border-rose-500" : "border-border")}
          />
        </div>
      ) : (
        <div className="p-3 border border-dashed border-border/80 rounded-xl bg-emerald-500/5 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500">Ingreso Directo en Efectivo</p>
        </div>
      )}

      {/* SUBIDA DE FOTO COMPACTA Y HORIZONTAL */}
      {(isCard || isTransfer) && (
        <div className="border border-border/80 rounded-xl p-2 bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground ml-1" />
            <div>
              <p className="text-[11px] font-bold text-foreground leading-none">Voucher / Recibo</p>
              <p className="text-[9px] text-muted-foreground">{receiptImage ? "Adjunto listo" : "Opcional"}</p>
            </div>
          </div>
          {receiptImage ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptImage(null)} className="h-6 px-2 text-rose-500 text-[10px] hover:bg-rose-500/10">
              <X className="w-3 h-3 mr-1" /> Quitar
            </Button>
          ) : (
            <label className="cursor-pointer inline-flex items-center text-[10px] font-bold bg-background border border-border px-2 py-1 rounded-md hover:bg-muted transition-colors">
              <Upload className="w-3 h-3 text-[#008bcd] mr-1" /> Subir
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* RECIBO AUTOMÁTICO/MANUAL ULTRA COMPACTO */}
      <div className={cn("border rounded-xl p-2.5 flex items-center justify-between", !isManualReceipt ? "bg-[#008bcd]/5 border-[#008bcd]/20" : "bg-muted/10 border-border/60")}>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">N° Recibo</Label>
          {!isEditing && (
            <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border scale-90">
              <Label htmlFor="manual-mode" className="text-[8px] font-bold text-muted-foreground cursor-pointer uppercase">Man</Label>
              <Switch id="manual-mode" checked={!isManualReceipt} onCheckedChange={(c) => setIsManualReceipt(!c)} className="scale-50 m-[-6px]" />
              <Label htmlFor="manual-mode" className="text-[8px] font-black text-[#008bcd] cursor-pointer uppercase">Aut</Label>
            </div>
          )}
        </div>
        
        {isLoadingReceipt && !isManualReceipt ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#008bcd]" />
        ) : (
          <Input
            value={formData.receiptNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, receiptNumber: e.target.value }))}
            placeholder="REC-000"
            readOnly={!isManualReceipt && !isEditing}
            className={cn("h-7 w-28 text-[10px] rounded-md font-mono font-bold text-right", !isManualReceipt && !isEditing ? "bg-transparent border-none text-[#008bcd] shadow-none" : "bg-background border-border")}
          />
        )}
      </div>

    </div>
  )
}