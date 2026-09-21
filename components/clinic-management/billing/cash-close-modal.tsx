"use client"

import React, { useState, useEffect } from "react"
import { 
  Lock, Calculator, Loader2, AlertTriangle, 
  CheckCircle2, WalletCards, DollarSign, FileText, ChevronDown, ChevronUp 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CashCloseModalProps {
  isOpen: boolean
  onClose: () => void
  expectedCash: number
  onConfirmClose: (data: {
    expectedCash: number
    countedCash: number
    difference: number
    notes?: string
    breakdown?: Record<string, number>
  }) => Promise<boolean>
}

const CASH_DENOMINATIONS = [
  { label: "$100", value: 100 },
  { label: "$50", value: 50 },
  { label: "$20", value: 20 },
  { label: "$10", value: 10 },
  { label: "$5", value: 5 },
  { label: "$1", value: 1 },
  { label: "Monedas", value: 0.5 }, 
]

export function CashCloseModal({ 
  isOpen, 
  onClose, 
  expectedCash = 0,
  onConfirmClose 
}: CashCloseModalProps) {
  const [countedCash, setCountedCash] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [showDenominations, setShowDenominations] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [showErrorNote, setShowErrorNote] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCountedCash("")
      setNotes("")
      setIsSaving(false)
      setShowDenominations(false)
      setCounts({})
      setShowErrorNote(false)
    }
  }, [isOpen])
  const numericCounted = Number(countedCash || 0)
  const difference = Number((numericCounted - expectedCash).toFixed(2))
  const isBalanced = countedCash !== "" && Math.abs(difference) < 0.01
  const hasDiscrepancy = countedCash !== "" && !isBalanced
  const handleCountChange = (val: number, quantity: number) => {
    const updated = { ...counts, [val]: Math.max(0, quantity) }
    setCounts(updated)

    const total = Object.entries(updated).reduce((acc, [denom, qty]) => {
  return acc + Number(denom) * (qty as number)
}, 0)

    setCountedCash(total > 0 ? total.toFixed(2) : "")
  }

  const handleCloseRegister = async () => {
    if (countedCash === "") return
    if (hasDiscrepancy && !notes.trim()) {
      setShowErrorNote(true)
      return
    }

    setIsSaving(true)
    const success = await onConfirmClose({
      expectedCash,
      countedCash: numericCounted,
      difference,
      notes: notes.trim() || undefined,
      breakdown: Object.keys(counts).length > 0 ? counts : undefined,
    })
    setIsSaving(false)

    if (success) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] w-[95vw] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        
        {/* HEADER */}
        <DialogHeader className="px-7 py-4.5 border-b border-border/70 bg-[#0b0f19] dark:bg-slate-950 text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <Lock className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight">
                Cierre de Caja y Arqueo Definitivo
              </DialogTitle>
              <p className="text-xs text-slate-400 font-medium">
                Bloqueo de turno y conciliación del efectivo físico.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-7 space-y-6 max-h-[75vh] overflow-y-auto [scrollbar-width:none]">
          
          {/* COMPARATIVA TEÓRICO VS FÍSICO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* EFECTIVO TEÓRICO */}
            <div className="bg-muted/15 p-4 rounded-2xl border border-border/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                  <WalletCards className="w-3.5 h-3.5 text-[#008bcd]" />
                  <Label className="text-[10px] font-bold uppercase tracking-wider">
                    Efectivo Teórico en Sistema
                  </Label>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tight font-mono">
                  ${expectedCash.toFixed(2)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-tight">
                Total acumulado en gaveta según cobros en efectivo menos egresos aprobados.
              </p>
            </div>

            {/* EFECTIVO FÍSICO INGRESADO */}
            <div className="bg-muted/15 p-4 rounded-2xl border border-border/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    Efectivo Físico Contado ($) *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowDenominations(!showDenominations)}
                    className="text-[10px] font-bold text-[#008bcd] hover:underline flex items-center gap-0.5"
                  >
                    {showDenominations ? "Ocultar Desglose" : "Contador Rápido"}
                    {showDenominations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground">$</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={countedCash} 
                    onChange={(e) => setCountedCash(e.target.value)} 
                    placeholder="0.00" 
                    className="h-11 pl-7 bg-background border-2 border-border focus-visible:border-[#008bcd] font-mono text-xl font-black rounded-xl"
                  />
                </div>
              </div>

              {countedCash !== "" && (
                <div className={cn(
                  "mt-2 px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs font-bold",
                  isBalanced 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                )}>
                  <div className="flex items-center gap-1.5">
                    {isBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{isBalanced ? "Caja Cuadrada" : difference > 0 ? "Sobrante" : "Faltante"}</span>
                  </div>
                  <span className="font-mono">
                    {difference > 0 ? `+$${difference.toFixed(2)}` : `-$${Math.abs(difference).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* DESGLOSE OPCIONAL DE BILLETES */}
          {showDenominations && (
            <div className="p-3.5 bg-muted/20 border border-border/70 rounded-2xl space-y-2.5">
              <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider block">
                Calculadora de Billetes y Monedas
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {CASH_DENOMINATIONS.map((d) => (
                  <div key={d.value} className="text-center space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground">{d.label}</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={counts[d.value] || ""}
                      onChange={(e) => handleCountChange(d.value, parseInt(e.target.value) || 0)}
                      className="h-8 text-center text-xs font-mono font-bold bg-background p-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JUSTIFICACIÓN O NOTA DE CIERRE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#008bcd]" /> Observaciones / Justificación de Cierre
                {hasDiscrepancy && <span className="text-rose-500 font-bold">* (Obligatorio por descuadre)</span>}
              </Label>
              {showErrorNote && hasDiscrepancy && !notes.trim() && (
                <span className="text-[10px] text-rose-500 font-bold">Debe justificar la diferencia</span>
              )}
            </div>

            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (showErrorNote) setShowErrorNote(false)
              }}
              placeholder={
                hasDiscrepancy 
                  ? "Explique detalladamente el motivo del faltante o sobrante detectado..."
                  : "Observaciones generales del turno (opcional)..."
              }
              className={cn(
                "min-h-[70px] text-xs bg-background rounded-xl p-3 resize-none",
                showErrorNote && hasDiscrepancy && !notes.trim()
                  ? "border-rose-500 focus-visible:ring-rose-500"
                  : "border-border"
              )}
            />
          </div>

        </div>

        {/* PIE DE PÁGINA */}
        <DialogFooter className="px-7 py-4 border-t border-border/60 bg-muted/15 flex flex-col sm:flex-row gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="rounded-xl text-xs font-bold h-9.5 px-4"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCloseRegister} 
            disabled={isSaving || countedCash === ""} 
            className="bg-[#0b0f19] dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white rounded-xl text-xs font-bold h-9.5 px-6 shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            Confirmar Cierre Definitivo
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}