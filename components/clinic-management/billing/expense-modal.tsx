"use client"

import React, { useState } from "react"
import { ArrowUpRight, Loader2, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"

export function ExpenseModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => Promise<boolean> }) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    concept: "",
    receiptNumber: ""
  })

  const handleSubmit = async () => {
    if (!formData.amount || !formData.concept) return
    setIsSaving(true)
    const success = await onSave(formData)
    setIsSaving(false)
    if (success) {
      setFormData({ amount: "", concept: "", receiptNumber: "" })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border bg-rose-500/5">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            Registrar Egreso (Caja Chica)
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Concepto del Gasto *</Label>
            <Input 
              value={formData.concept} 
              onChange={e => setFormData({...formData, concept: e.target.value})} 
              placeholder="Ej: Compra de botellones de agua" 
              className="h-11 bg-background border-border rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Monto a retirar ($) *</Label>
              <Input 
                type="number" step="0.01" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                placeholder="0.00" 
                className="h-11 bg-background border-border font-mono text-base font-black text-rose-600 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">N° Comprobante</Label>
              <Input 
                value={formData.receiptNumber} 
                onChange={e => setFormData({...formData, receiptNumber: e.target.value})} 
                placeholder="Ej: FAC-998" 
                className="h-11 bg-background border-border rounded-xl text-xs font-mono"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 bg-muted/50 p-3 rounded-xl border border-border">
            <Receipt className="w-4 h-4 text-[#008bcd]" />
            Este monto se descontará automáticamente del efectivo físico en caja.
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-10 border-border">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !formData.amount || !formData.concept} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-10 px-6">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Registrar Salida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}