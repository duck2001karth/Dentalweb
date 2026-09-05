"use client"

import React, { useState, useEffect } from "react"
import { 
  ArrowUpRight, Loader2, Receipt, AlertCircle, 
  Tag, Upload, Image as ImageIcon, X, DollarSign 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    amount: string
    concept: string
    category: string
    receiptNumber?: string
    receiptImage?: string | null
  }) => Promise<boolean>
  currentCashBalance?: number
}

const EXPENSE_CATEGORIES = [
  "Insumos y Materiales Dentales",
  "Limpieza y Cafetería",
  "Servicios Básicos y Envíos",
  "Mantenimiento y Reparaciones",
  "Honorarios o Laboratorio Dental",
  "Otros Gastos Menores",
]

export function ExpenseModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentCashBalance 
}: ExpenseModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [receiptImage, setReceiptImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    amount: "",
    concept: "",
    category: "Insumos y Materiales Dentales",
    receiptNumber: "",
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: "",
        concept: "",
        category: "Insumos y Materiales Dentales",
        receiptNumber: "",
      })
      setReceiptImage(null)
      setShowErrors(false)
    }
  }, [isOpen])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setReceiptImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const isAmountInvalid = !formData.amount || Number(formData.amount) <= 0
  const isConceptInvalid = !formData.concept.trim()
  const exceedsBalance = typeof currentCashBalance === "number" && Number(formData.amount) > currentCashBalance

  const handleSubmit = async () => {
    setShowErrors(true)
    if (isAmountInvalid || isConceptInvalid) return

    setIsSaving(true)
    const success = await onSave({
      ...formData,
      receiptNumber: formData.receiptNumber.trim() || undefined,
      receiptImage: receiptImage || undefined,
    })
    setIsSaving(false)

    if (success) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] w-[95vw] bg-card text-foreground border border-border/80 rounded-[24px] p-0 overflow-hidden shadow-2xl">
        
        {/* ENCABEZADO */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-rose-500/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-xs">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                Registrar Salida de Caja Chica
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Descuento directo del efectivo físico de la gaveta.
              </p>
            </div>
          </div>
          
          {typeof currentCashBalance === "number" && (
            <div className="hidden sm:block text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Efectivo en Caja</span>
              <p className="text-xs font-mono font-bold text-foreground">
                ${currentCashBalance.toFixed(2)}
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="p-6 space-y-4">
          
          {/* CATEGORÍA Y MONTO */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-7 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-rose-500" /> Categoría de Gasto <span className="text-rose-500">*</span>
              </Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-rose-500/20"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-rose-500" /> Monto ($) <span className="text-rose-500">*</span>
                </Label>
                {showErrors && isAmountInvalid && (
                  <span className="text-[10px] font-bold text-rose-500">Obligatorio</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-rose-500">$</span>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                  placeholder="0.00" 
                  className={cn(
                    "h-10 pl-7 bg-background font-mono text-base font-black text-rose-500 rounded-xl",
                    showErrors && isAmountInvalid 
                      ? "border-rose-500 focus-visible:ring-rose-500" 
                      : "border-border focus-visible:ring-rose-500/30"
                  )}
                />
              </div>
            </div>
          </div>

          {/* CONCEPTO DEL GASTO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Descripción / Concepto detallado <span className="text-rose-500">*</span>
              </Label>
              {showErrors && isConceptInvalid && (
                <span className="text-[10px] font-bold text-rose-500">Ingrese el motivo</span>
              )}
            </div>
            <Input 
              value={formData.concept} 
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })} 
              placeholder="Ej: Pago de mensajería para entrega de coronas de zirconio" 
              className={cn(
                "h-10 bg-background text-xs font-semibold rounded-xl",
                showErrors && isConceptInvalid 
                  ? "border-rose-500 focus-visible:ring-rose-500" 
                  : "border-border focus-visible:ring-rose-500/30"
              )}
            />
          </div>

          {/* COMPROBANTE Y ADJUNTAR FOTO */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          
          {/* N° Factura */}
          <div className="sm:col-span-6 space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              N° Factura o Nota de Venta
            </Label>
            <Input 
              value={formData.receiptNumber} 
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })} 
              placeholder="Ej: 001-002-0000456" 
              className="h-11 bg-background font-mono text-xs uppercase rounded-xl border-border focus-visible:ring-rose-500/30"
            />
          </div>

          {/* Adjuntar Foto Comprobante */}
          <div className="sm:col-span-6 space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Comprobante Físico
            </Label>
            <div className="h-11 border border-border rounded-xl px-3 bg-muted/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {receiptImage ? "Foto adjunta" : "Subir foto / recibo"}
                </span>
              </div>

              <div className="shrink-0">
                {receiptImage ? (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setReceiptImage(null)}
                    className="h-7 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs font-bold"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Quitar
                  </Button>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-rose-500" /> Adjuntar
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

        </div>

          {/* ALERTA DE SALDO INSUFICIENTE */}
          {exceedsBalance && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>El monto a retirar supera el efectivo físico registrado en caja (${currentCashBalance.toFixed(2)}).</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 bg-muted/20 p-3 rounded-xl border border-border/60 text-xs text-muted-foreground">
            <Receipt className="w-4 h-4 text-[#008bcd] shrink-0" />
            <p className="text-[11px] leading-tight">
              Este egreso quedará registrado en el reporte de auditoría y arqueo de caja con la firma del cajero de turno.
            </p>
          </div>

        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="rounded-xl text-xs font-bold h-9 px-4 border-border hover:bg-muted w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-9 px-5 shadow-xs transition-all active:scale-95 w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            Registrar Salida
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}