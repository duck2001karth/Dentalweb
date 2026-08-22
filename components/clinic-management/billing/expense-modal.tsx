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
      <DialogContent className="sm:max-w-[600px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-border bg-rose-500/5">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            Registrar Egreso (Caja Chica)
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Concepto del Gasto *</Label>
            <Input 
              value={formData.concept} 
              onChange={e => setFormData({...formData, concept: e.target.value})} 
              placeholder="Ej: Compra de botellones de agua" 
              className="h-12 bg-background border-border rounded-xl text-sm focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Monto a retirar ($) *</Label>
              <Input 
                type="number" step="0.01" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                placeholder="0.00" 
                className="h-12 bg-background border-border font-mono text-lg font-black text-rose-500 rounded-xl focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">N° Comprobante</Label>
              <Input 
                value={formData.receiptNumber} 
                onChange={e => setFormData({...formData, receiptNumber: e.target.value})} 
                placeholder="Ej: FAC-998" 
                className="h-12 bg-background border-border rounded-xl text-sm font-mono focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border mt-2">
            <div className="bg-[#008bcd]/10 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-[#008bcd]" />
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Este monto se descontará automáticamente del <strong className="text-foreground">efectivo físico en caja</strong>. Asegúrate de guardar el comprobante para la auditoría.
            </p>
          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-border bg-muted/10 flex gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-11 px-6 border-border hover:bg-accent">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !formData.amount || !formData.concept} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-11 px-8 transition-all">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Registrar Salida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}