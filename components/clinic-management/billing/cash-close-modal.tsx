"use client"

import React, { useState } from "react"
import { Lock, Calculator, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"

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
  const isBalanced = difference === 0

  const handleCloseRegister = async () => {
    setIsSaving(true)
    // Simulación de guardado de Arqueo. Aquí llamarías a tu API POST /api/cash-registers/close
    setTimeout(() => {
      setIsSaving(false)
      onClose()
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border bg-slate-900 text-white">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#008bcd]" />
            Cierre y Arqueo de Caja
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Efectivo Teórico (Sistema)</p>
              <p className="text-xl font-black text-foreground">${expectedCash.toFixed(2)}</p>
            </div>
            <Calculator className="w-8 h-8 text-muted-foreground/30" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Efectivo Físico Contado ($) *</Label>
            <Input 
              type="number" step="0.01" 
              value={countedCash} 
              onChange={e => setCountedCash(e.target.value)} 
              placeholder="Ingrese el monto exacto en gaveta..." 
              className="h-14 bg-background border-2 border-[#008bcd]/30 focus-visible:border-[#008bcd] font-mono text-xl font-black text-center rounded-xl"
            />
          </div>

          {countedCash !== "" && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
              {isBalanced ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mt-0.5" />}
              <div>
                <p className="font-bold text-sm">{isBalanced ? "Caja Cuadrada Perfectamente" : "Descuadre Detectado"}</p>
                <p className="text-xs font-medium opacity-80">
                  {isBalanced 
                    ? "El efectivo coincide con los registros del sistema." 
                    : `Diferencia de $${Math.abs(difference).toFixed(2)} ${difference > 0 ? '(Sobrante)' : '(Faltante)'}. Se requerirá justificación.`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-10 border-border">Cancelar</Button>
          <Button onClick={handleCloseRegister} disabled={isSaving || countedCash === ""} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-10 px-6">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Confirmar Cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}