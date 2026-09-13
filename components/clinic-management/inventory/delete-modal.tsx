"use client"

import React, { useState } from "react"
import { Trash2, Loader2, Archive, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem } from "./inventory-tab"

export function DeleteModal({ 
  isOpen, 
  onClose, 
  item, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  item: InventoryItem | null; 
  onSuccess: () => void;
}) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPermanent, setIsPermanent] = useState(false)

  const handleClose = () => {
    setIsPermanent(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!item) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory?id=${item.id}&permanent=${isPermanent}`, { 
        method: "DELETE" 
      })
      
      if (!res.ok) throw new Error()
      
      toast({ 
        title: isPermanent ? "Insumo purgado" : "Insumo archivado", 
        description: isPermanent 
          ? "Se eliminó definitivamente de la base de datos." 
          : "El producto se ocultó del inventario correctamente." 
      })
      
      onSuccess()
      handleClose()
    } catch {
      toast({ 
        title: "Error", 
        description: "No se pudo procesar la acción sobre el producto.", 
        variant: "destructive" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border/80 rounded-[24px] p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border transition-colors ${
            isPermanent 
              ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}>
            {isPermanent ? <Trash2 className="w-6 h-6 stroke-[2.5]" /> : <Archive className="w-6 h-6 stroke-[2.5]" />}
          </div>
          
          <DialogTitle className="text-lg font-black text-foreground mb-2">
            {isPermanent ? "¿Purgar Insumo?" : "¿Archivar Insumo?"}
          </DialogTitle>
          
          <DialogDescription className="text-xs text-muted-foreground font-medium mb-5 leading-relaxed">
            Estás a punto de procesar <strong className="text-foreground">{item?.name}</strong>.
            {isPermanent 
              ? " Esta acción es irreversible y destruirá todo su historial de entradas y salidas."
              : " El insumo ya no aparecerá en la lista principal, pero su historial de movimientos se conservará."}
          </DialogDescription>

          <div className="w-full bg-muted/50 rounded-xl p-3 mb-6 flex items-start gap-3 border border-border/50">
            <input 
              type="checkbox" 
              id="permanent-delete" 
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-600 cursor-pointer"
            />
            <label htmlFor="permanent-delete" className="text-xs font-semibold text-foreground text-left cursor-pointer select-none">
              Eliminar definitivamente (Purgado físico)
              <span className="block font-normal text-muted-foreground mt-0.5">
                Marca esta opción solo si el insumo fue creado por error y no tiene movimientos.
              </span>
            </label>
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting} className="rounded-lg h-10 px-5 text-xs font-bold border-border/80 flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={isDeleting} 
              className={`rounded-lg h-10 px-5 text-xs font-bold flex-1 text-white transition-colors ${
                isPermanent ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isPermanent ? "Eliminar" : "Archivar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}