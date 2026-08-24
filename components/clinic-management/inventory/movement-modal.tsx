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

export function MovementModal({ isOpen, onClose, type, items, preselectedItem, onSuccess }: { isOpen: boolean, onClose: () => void, type: "INCOMING" | "OUTGOING", items: InventoryItem[], preselectedItem: InventoryItem | null, onSuccess: () => void }) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      itemId: formData.get("itemId"),
      quantity: parseInt(formData.get("quantity") as string),
      type: type,
      reason: formData.get("reason")
    }

    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error()
      toast({ title: "Movimiento Registrado", description: "El stock ha sido actualizado." })
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
              <Select name="itemId" defaultValue={preselectedItem?.id} required>
                <SelectTrigger className="w-full h-10 rounded-lg text-sm font-semibold">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (Stock: {i.stock})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Cantidad a {type === "INCOMING" ? "ingresar" : "retirar"} *</Label>
              <Input name="quantity" type="number" min="1" required placeholder="0" className="h-11 rounded-lg font-mono text-lg font-black" autoFocus />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                {type === "INCOMING" ? <><Building2 className="w-3 h-3"/> Proveedor / Ref</> : <><User className="w-3 h-3"/> Solicitante / Motivo</>}
              </Label>
              <Input name="reason" placeholder={type === "INCOMING" ? "Ej: DentalCorp - Factura F-001" : "Ej: Dr. Capa - Uso en Box 1"} className="h-10 rounded-lg text-sm" required />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg h-9 px-5 text-xs font-bold">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className={cn("rounded-lg h-9 px-6 text-xs font-bold text-white", type === "INCOMING" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirmar Movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}