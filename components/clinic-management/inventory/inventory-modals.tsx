"use client"

import React, { useState } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Building2, User, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem } from "./inventory-tab"
import { cn } from "@/lib/utils"

export function MovementModal({ 
  isOpen, onClose, type, items, preselectedItem, onSuccess 
}: { 
  isOpen: boolean, onClose: () => void, type: "INCOMING" | "OUTGOING", items: InventoryItem[], preselectedItem: InventoryItem | null, onSuccess: () => void 
}) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedItem?.id || "")

  const selectedProduct = items.find(i => i.id === selectedItemId)
  const maxAllowed = type === "OUTGOING" && selectedProduct ? selectedProduct.stock : undefined

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    
    const quantity = parseInt(formData.get("quantity") as string)

    if (type === "OUTGOING" && selectedProduct && quantity > selectedProduct.stock) {
      toast({ title: "Stock insuficiente", description: `Solo hay ${selectedProduct.stock} unidades disponibles.`, variant: "destructive" })
      setIsSaving(false)
      return
    }

    const data = {
      itemId: formData.get("itemId"),
      quantity,
      type,
      reason: formData.get("reason")
    }

    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error()
      toast({ title: "Movimiento Registrado", description: "El stock ha sido actualizado correctamente." })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error", description: "Verifica que el stock no sea negativo.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/80 rounded-[24px] p-0 shadow-2xl">
        <DialogHeader className={cn("px-6 py-5 border-b border-border/60", type === "INCOMING" ? "bg-emerald-500/5" : "bg-rose-500/5")}>
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", type === "INCOMING" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
              {type === "INCOMING" ? <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" /> : <ArrowUpFromLine className="w-4 h-4 stroke-[2.5]" />}
            </div>
            {type === "INCOMING" ? "Ingresar Productos a Bodega" : "Retirar Productos de Bodega"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Producto Afectado *</Label>
              <Select name="itemId" value={selectedItemId} onValueChange={setSelectedItemId} required>
                <SelectTrigger className="w-full h-10 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#008bcd]/20">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {items.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} <span className="text-muted-foreground ml-1">(Stock: {i.stock})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Cantidad a {type === "INCOMING" ? "ingresar" : "retirar"} *</Label>
              <Input 
                name="quantity" 
                type="number" 
                min="1" 
                max={maxAllowed} 
                required 
                placeholder="0" 
                className="h-11 rounded-lg font-mono text-lg font-black focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                autoFocus 
              />
              {type === "OUTGOING" && selectedProduct && (
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Máximo disponible: {selectedProduct.stock}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                {type === "INCOMING" ? <><Building2 className="w-3 h-3"/> Proveedor / Ref / Factura</> : <><User className="w-3 h-3"/> Solicitante / Motivo</>}
              </Label>
              <Input 
                name="reason" 
                placeholder={type === "INCOMING" ? "Ej: DentalCorp - Factura F-001" : "Ej: Dr.  - Uso en Box 1"} 
                className="h-10 rounded-lg text-sm focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                required 
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg h-9 px-5 text-xs font-bold border-border/80">Cancelar</Button>
            <Button type="submit" disabled={isSaving || (type === "OUTGOING" && (!selectedProduct || selectedProduct.stock === 0))} className={cn("rounded-lg h-9 px-6 text-xs font-bold text-white transition-all", type === "INCOMING" ? "bg-[#00d084] hover:bg-[#00b573]" : "bg-[#f00f48] hover:bg-[#d00c3e]")}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirmar Movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}