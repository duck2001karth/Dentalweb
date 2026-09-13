"use client"

import React, { useState } from "react"
import { Package, ShieldCheck, Loader2, DollarSign, Layers } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem } from "./inventory-tab"
import { cn } from "@/lib/utils"

export function ProductModal({ 
  isOpen, 
  onClose, 
  item, 
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  onSuccess: () => void 
}) {
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
      minStock: parseInt(formData.get("minStock") as string, 10) || 5,
      unitCost: parseFloat(formData.get("unitCost") as string) || 0,
      stock: item ? undefined : parseInt(formData.get("stock") as string, 10) || 0,
    }

    try {
      const res = await fetch("/api/inventory", {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item ? { id: item.id, ...data } : data)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || "Error al procesar el insumo")
      }

      toast({ 
        title: "Éxito", 
        description: `Producto ${item ? "actualizado" : "registrado"} correctamente.` 
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast({ 
        title: "Error al guardar", 
        description: error?.message || "Verifica que el código SKU no esté duplicado.", 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border/80 rounded-[24px] p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20 shadow-xs">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </div>
            {item ? "Editar Producto" : "Registrar Nuevo Insumo"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre del Producto */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                Nombre del Producto *
              </Label>
              <Input 
                name="name" 
                defaultValue={item?.name} 
                required 
                className="h-10 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                placeholder="Ej: Resina Z350 Filtek" 
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                Código Interno (SKU)
              </Label>
              <Input 
                name="sku" 
                defaultValue={item?.sku || ""} 
                className="h-10 rounded-xl font-mono text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                placeholder="Ej: RES-3M-A2" 
              />
            </div>

            {/* Marca */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                Marca
              </Label>
              <Input 
                name="marca" 
                defaultValue={item?.marca || ""} 
                className="h-10 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                placeholder="Ej: 3M ESPE" 
              />
            </div>

            {/* Presentación */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#008bcd]" /> Presentación
              </Label>
              <Input 
                name="presentacion" 
                defaultValue={item?.presentacion || ""} 
                className="h-10 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                placeholder="Ej: Jeringa 4g / Caja x 100" 
              />
            </div>

            {/* Costo Unitario */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#008bcd]" /> Precio Promedio ($)
              </Label>
              <Input 
                name="unitCost" 
                type="number" 
                step="0.01" 
                min="0"
                defaultValue={item?.unitCost || 0} 
                className="h-10 rounded-xl font-mono font-bold border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
              />
            </div>
            
            {/* Stock Inicial (Solo en creación) */}
            {!item && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
                  Stock Inicial *
                </Label>
                <Input 
                  name="stock" 
                  type="number" 
                  min="0"
                  defaultValue={0} 
                  required 
                  className="h-10 rounded-xl bg-emerald-500/5 border-emerald-500/30 text-emerald-600 font-mono font-bold focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500" 
                />
              </div>
            )}
            
            {/* Stock Mínimo */}
            <div className={cn("space-y-1.5", item ? "sm:col-span-2" : "")}>
              <Label className="text-[11px] font-bold uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Stock de Seguridad *
              </Label>
              <Input 
                name="minStock" 
                type="number" 
                min="0"
                defaultValue={item?.minStock || 5} 
                required 
                className="h-10 rounded-xl bg-amber-500/5 border-amber-500/30 text-amber-600 font-mono font-bold focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500" 
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="rounded-xl h-10 px-5 text-xs font-bold border-border/80 hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving} 
              className="rounded-xl h-10 px-6 text-xs font-bold bg-[#008bcd] hover:bg-[#007bb6] text-white shadow-md shadow-[#008bcd]/20 transition-all active:scale-95"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Guardar Insumo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}