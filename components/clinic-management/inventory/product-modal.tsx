"use client"

import React, { useState } from "react"
import { Package, ShieldCheck, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem } from "./inventory-tab"

export function ProductModal({ isOpen, onClose, item, onSuccess }: { isOpen: boolean, onClose: () => void, item: InventoryItem | null, onSuccess: () => void }) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      marca: formData.get("marca"),
      presentacion: formData.get("presentacion"),
      minStock: parseInt(formData.get("minStock") as string) || 5,
      unitCost: parseFloat(formData.get("unitCost") as string) || 0,
      stock: item ? undefined : parseInt(formData.get("stock") as string) || 0,
    }

    try {
      const res = await fetch("/api/inventory", {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item ? { id: item.id, ...data } : data)
      })

      if (!res.ok) throw new Error()
      toast({ title: "Éxito", description: `Producto ${item ? "actualizado" : "creado"} correctamente.` })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el producto. Verifica que el código SKU no esté duplicado.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border/80 rounded-[24px] p-0 shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </div>
            {item ? "Editar Producto" : "Registrar Nuevo Insumo"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Producto *</Label>
              <Input name="name" defaultValue={item?.name} required className="h-10 rounded-lg" placeholder="Ej: Resina Z350" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Código Interno (SKU)</Label>
              <Input name="sku" defaultValue={item?.sku || ""} className="h-10 rounded-lg font-mono" placeholder="Ej: RES-3M-A2" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Marca</Label>
              <Input name="marca" defaultValue={item?.marca || ""} className="h-10 rounded-lg" placeholder="Ej: 3M ESPE" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Presentación</Label>
              <Input name="presentacion" defaultValue={item?.presentacion || ""} className="h-10 rounded-lg" placeholder="Ej: Caja x 100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Precio Promedio ($)</Label>
              <Input name="unitCost" type="number" step="0.01" defaultValue={item?.unitCost || 0} className="h-10 rounded-lg font-mono font-bold" />
            </div>
            
            {!item && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-emerald-600">Stock Inicial *</Label>
                <Input name="stock" type="number" defaultValue={0} required className="h-10 rounded-lg bg-emerald-500/5 border-emerald-500/30 text-emerald-600 font-mono font-bold" />
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Stock de Seguridad *</Label>
              <Input name="minStock" type="number" defaultValue={item?.minStock || 5} required className="h-10 rounded-lg bg-amber-500/5 border-amber-500/30 text-amber-600 font-mono font-bold" />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg h-9 px-5 text-xs font-bold">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className="rounded-lg h-9 px-6 text-xs font-bold bg-[#008bcd] hover:bg-[#007bb6] text-white">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Guardar Insumo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}