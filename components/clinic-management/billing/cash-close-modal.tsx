"use client"

import React, { useState } from "react"
import { Lock, Calculator, Loader2, AlertTriangle, CheckCircle2, WalletCards } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"

export function CashCloseModal({ isOpen, onClose, expectedCash }: { isOpen: boolean, onClose: () => void, expectedCash: number }) {
  const [countedCash, setCountedCash] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const difference = Number(countedCash || 0) - expectedCash
  const isBalanced = countedCash !== "" && difference === 0

  const handleCloseRegister = async () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      onClose()
      setCountedCash("") 
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-border bg-slate-900 dark:bg-slate-950 text-white">
          <DialogTitle className="text-xl font-black flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            Cierre y Arqueo de Caja
          </DialogTitle>
        </DialogHeader>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col justify-center bg-muted/30 p-6 rounded-[20px] border border-border relative overflow-hidden">
              <Calculator className="w-24 h-24 absolute -right-4 -bottom-4 text-foreground opacity-[0.03]" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <WalletCards className="w-4 h-4 text-[#008bcd]" />
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Efectivo Teórico (Sistema)</Label>
                </div>
                <p className="text-3xl font-black text-foreground tracking-tight">${expectedCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground font-medium mt-2">Monto calculado según las transacciones en efectivo del día.</p>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Efectivo Físico Contado ($) *</Label>
                <Input 
                  type="number" step="0.01" 
                  value={countedCash} 
                  onChange={e => setCountedCash(e.target.value)} 
                  placeholder="0.00" 
                  className="h-14 bg-background border-2 border-border focus-visible:border-[#008bcd] focus-visible:ring-[#008bcd]/20 font-mono text-2xl font-black text-center rounded-xl transition-all"
                />
              </div>
              {countedCash !== "" && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  isBalanced 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {isBalanced ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold text-sm tracking-tight">{isBalanced ? "Caja Cuadrada Perfectamente" : "Descuadre Detectado"}</p>
                    <p className="text-xs font-medium opacity-80 mt-1 leading-relaxed">
                      {isBalanced 
                        ? "El efectivo coincide exactamente." 
                        : `Diferencia de $${Math.abs(difference).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${difference > 0 ? '(Sobrante)' : '(Faltante)'}.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-border bg-muted/10 flex gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-11 px-6 border-border hover:bg-accent">
            Cancelar
          </Button>
          <Button 
            onClick={handleCloseRegister} 
            disabled={isSaving || countedCash === ""} 
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white rounded-xl text-xs font-bold h-11 px-8 transition-all"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} 
            Confirmar Arqueo Definitivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}