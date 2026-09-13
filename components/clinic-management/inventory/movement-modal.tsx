"use client"

import React, { useState, useEffect } from "react"
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
  isOpen, 
  onClose, 
  type, 
  items, 
  preselectedItem, 
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  type: "INCOMING" | "OUTGOING"
  items: InventoryItem[]
  preselectedItem: InventoryItem | null
  onSuccess: () => void 
}) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string>("")

  // Sincronizar producto seleccionado cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedItemId(preselectedItem?.id || items[0]?.id || "")
    }
  }, [isOpen, preselectedItem, items])

  const selectedProduct = items.find((i) => i.id === selectedItemId)
  const maxStockAllowed = type === "OUTGOING" && selectedProduct ? selectedProduct.stock : undefined

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    
    const quantity = parseInt(formData.get("quantity") as string, 10)

    if (type === "OUTGOING" && selectedProduct && quantity > selectedProduct.stock) {
      toast({ 
        title: "Stock insuficiente", 
        description: `Solo hay ${selectedProduct.stock} unidades en existencia para retirar.`, 
        variant: "destructive" 
      })
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

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || "Error al procesar movimiento")
      }

      toast({ 
        title: "Movimiento Registrado", 
        description: `Stock de ${selectedProduct?.name || "producto"} actualizado correctamente.` 
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error?.message || "Verifica que el stock no sea negativo.", 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/80 rounded-[24px] p-0 shadow-2xl overflow-hidden">
        <DialogHeader className={cn(
          "px-6 py-5 border-b border-border/60",
          type === "INCOMING" ? "bg-emerald-500/5" : "bg-rose-500/5"
        )}>
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs",
              type === "INCOMING" 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            )}>
              {type === "INCOMING" ? <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" /> : <ArrowUpFromLine className="w-4 h-4 stroke-[2.5]" />}
            </div>
            {type === "INCOMING" ? "Ingresar Productos a Bodega" : "Retirar Productos de Bodega"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Producto Afectado */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                Producto Afectado *
              </Label>
              <Select 
                name="itemId" 
                value={selectedItemId} 
                onValueChange={setSelectedItemId} 
                required
              >
                <SelectTrigger className="w-full h-10 rounded-xl text-sm font-semibold border-border/80 bg-background focus:ring-2 focus:ring-[#008bcd]/20 focus:border-[#008bcd]">
                  <SelectValue placeholder="Seleccionar insumo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-border/80 max-h-60">
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id} className="text-xs font-medium cursor-pointer">
                      <span className="font-bold text-foreground">{i.name}</span>
                      <span className="text-muted-foreground ml-1.5 font-mono">(Stock: {i.stock})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Cantidad */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Cantidad a {type === "INCOMING" ? "ingresar" : "retirar"} *
                </Label>
                {type === "OUTGOING" && selectedProduct && (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Disponible: <strong className="text-foreground">{selectedProduct.stock} unid.</strong>
                  </span>
                )}
              </div>
              <Input 
                name="quantity" 
                type="number" 
                min="1" 
                max={maxStockAllowed}
                required 
                placeholder="0" 
                className="h-11 rounded-xl font-mono text-lg font-black border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                autoFocus 
              />
            </div>

            {/* Referencia o Motivo */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                {type === "INCOMING" ? (
                  <><Building2 className="w-3.5 h-3.5 text-[#008bcd]" /> Proveedor / Documento de Compra</>
                ) : (
                  <><User className="w-3.5 h-3.5 text-[#008bcd]" /> Solicitante / Box / Motivo de Uso</>
                )}
              </Label>
              <Input 
                name="reason" 
                placeholder={type === "INCOMING" ? "Ej: DentalCorp - Factura F-001" : "Ej: Dr. - Cirugía en Box 1"} 
                className="h-10 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                required 
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
              disabled={isSaving || (type === "OUTGOING" && (!selectedProduct || selectedProduct.stock === 0))} 
              className={cn(
                "rounded-xl h-10 px-6 text-xs font-bold text-white shadow-md transition-all active:scale-95",
                type === "INCOMING" 
                  ? "bg-[#00d084] hover:bg-[#00b573] shadow-[#00d084]/20" 
                  : "bg-[#f00f48] hover:bg-[#d00c3e] shadow-[#f00f48]/20"
              )}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar Movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}