"use client"

import React from "react"
import { 
  CreditCard, AlertCircle, Check, ImageIcon, 
  Upload, X, Lock, Loader2 
} from "lucide-react"
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
    <div className="space-y-4">
      {/* DATOS DE TARJETA / TRANSFERENCIA O EFECTIVO */}
      {isCard ? (
        <div
          className={cn(
            "border rounded-xl p-4 space-y-3 transition-colors",
            showErrors && isReferenceMissing
              ? "bg-rose-500/5 border-rose-500/80"
              : "bg-muted/15 border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Datos del POS / Datáfono
            </span>
            {showErrors && isReferenceMissing ? (
              <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Ingrese autorización
              </span>
            ) : (
              <span className="text-[9px] text-muted-foreground">Requerido para arqueo</span>
            )}
          </div>

          {formData.method === "CREDIT_CARD" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Modalidad</Label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as any)}
                  className="w-full mt-1 h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none"
                >
                  <option value="CORRIENTE">Corriente (1 pago)</option>
                  <option value="DIFERIDO">Diferido a meses</option>
                </select>
              </div>

              {cardType === "DIFERIDO" && (
                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Plazo en Meses</Label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full mt-1 h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none"
                  >
                    <option value="3">3 Meses</option>
                    <option value="6">6 Meses</option>
                    <option value="9">9 Meses</option>
                    <option value="12">12 Meses</option>
                    <option value="18">18 Meses</option>
                    <option value="24">24 Meses</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-[9px] font-bold text-muted-foreground uppercase">
              N° de Autorización / Lote del Voucher <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: AUT-049821 / LOTE 012"
              className={cn(
                "mt-1 h-9 bg-background font-mono text-xs font-bold uppercase",
                showErrors && isReferenceMissing
                  ? "border-rose-500 focus-visible:ring-rose-500"
                  : "border-border focus-visible:ring-[#008bcd]"
              )}
              required
            />
            {showErrors && isReferenceMissing && (
              <p className="text-[10px] text-rose-500 mt-1 font-medium">
                El número de lote o código de autorización del voucher es obligatorio para tarjetas.
              </p>
            )}
          </div>
        </div>
      ) : isTransfer ? (
        <div
          className={cn(
            "border rounded-xl p-4 space-y-2 transition-colors",
            showErrors && isReferenceMissing
              ? "bg-rose-500/5 border-rose-500/80"
              : "bg-muted/15 border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              N° de Comprobante / Transferencia <span className="text-rose-500">*</span>
            </Label>
            {showErrors && isReferenceMissing && (
              <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Requerido
              </span>
            )}
          </div>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ej: TRANSF-902148 Banco Pichincha"
            className={cn(
              "h-9 bg-background font-mono text-xs font-bold uppercase",
              showErrors && isReferenceMissing
                ? "border-rose-500 focus-visible:ring-rose-500"
                : "border-border focus-visible:ring-[#008bcd]"
            )}
            required
          />
          {showErrors && isReferenceMissing && (
            <p className="text-[10px] text-rose-500 mt-1 font-medium">
              Debe ingresar el número de referencia o comprobante de la transferencia.
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 border border-dashed border-border/80 rounded-xl bg-muted/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-foreground">Ingreso en Efectivo</p>
            <p className="text-[10px] text-muted-foreground">Suma automáticamente al arqueo de gaveta física.</p>
          </div>
        </div>
      )}

      {/* ADJUNTAR FOTO VOUCHER */}
      {(isCard || isTransfer) && (
        <div className="border border-border/80 rounded-xl p-2.5 bg-muted/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted-foreground shrink-0 border border-border">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <div className="truncate text-xs">
              <p className="font-bold text-foreground truncate">Foto del Voucher / Recibo</p>
              <p className="text-[9px] text-muted-foreground">
                {receiptImage ? "Imagen adjunta correctamente" : "Opcional para auditoría"}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {receiptImage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReceiptImage(null)}
                className="h-7 px-2 text-rose-500 text-[10px]"
              >
                <X className="w-3 h-3 mr-1" /> Quitar
              </Button>
            ) : (
              <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold bg-background border border-border px-2.5 py-1 rounded-lg hover:bg-muted transition-colors">
                <Upload className="w-3 h-3 text-[#008bcd]" /> Subir
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      )}

      {/* N° RECIBO Y ESTADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className={cn(
            "border rounded-xl p-3 relative transition-colors",
            !isManualReceipt ? "bg-[#008bcd]/5 border-[#008bcd]/20" : "bg-muted/10 border-border/60"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">N° Recibo</Label>
            {!isEditing && (
              <div className="flex items-center gap-1.5 bg-background px-1.5 py-0.5 rounded border scale-90">
                <Label htmlFor="manual-mode" className="text-[8px] font-bold text-muted-foreground cursor-pointer uppercase">Man</Label>
                <Switch
                  id="manual-mode"
                  checked={!isManualReceipt}
                  onCheckedChange={(c) => setIsManualReceipt(!c)}
                  className="data-[state=checked]:bg-[#008bcd] scale-50 m-[-6px]"
                />
                <Label htmlFor="manual-mode" className="text-[8px] font-black text-[#008bcd] cursor-pointer uppercase">Aut</Label>
              </div>
            )}
          </div>

          <div className="relative">
            {isLoadingReceipt && !isManualReceipt ? (
              <div className="h-9 bg-background border border-[#008bcd]/30 rounded-lg flex items-center px-2.5 text-[#008bcd]/60 text-xs font-semibold">
                <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Generando...
              </div>
            ) : (
              <div className="relative">
                {!isManualReceipt && !isEditing && (
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#008bcd]/60" />
                )}
                <Input
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder={isManualReceipt ? "TALONARIO-001" : "REC-00000"}
                  readOnly={!isManualReceipt && !isEditing}
                  className={cn(
                    "h-9 text-xs rounded-lg font-mono font-bold shadow-xs",
                    !isManualReceipt && !isEditing
                      ? "bg-[#008bcd]/10 border-[#008bcd]/30 text-[#008bcd] pl-8 cursor-not-allowed"
                      : "bg-background border-border px-2.5"
                  )}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted/10 border border-border/60 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1.5 text-muted-foreground">
            <Check className="w-3 h-3 text-emerald-500" />
            <Label className="text-[9px] font-bold uppercase tracking-wider">Estado del Cobro</Label>
          </div>
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as PaymentState }))}
            className="w-full h-9 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none cursor-pointer"
          >
            <option value="COMPLETED">Completado / Caja</option>
            <option value="PENDING">Pendiente / Chequeo</option>
          </select>
        </div>
      </div>
    </div>
  )
}