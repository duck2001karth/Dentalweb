"use client"

import React, { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem } from "./inventory-tab"

export function DeleteModal({ isOpen, onClose, item, onSuccess }: { isOpen: boolean, onClose: () => void, item: InventoryItem | null, onSuccess: () => void }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!item) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory?id=${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Producto eliminado", description: "Se borró del inventario correctamente." })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/80 rounded-[24px] p-6 text-center shadow-2xl">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <Trash2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <DialogTitle className="text-lg font-black text-foreground mb-2">¿Eliminar Insumo?</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground font-medium mb-6 leading-relaxed">
          Estás a punto de eliminar <strong className="text-foreground">{item?.name}</strong>. Esta acción no se puede deshacer y borrará su historial.
        </DialogDescription>
        <div className="flex gap-3 justify-center w-full">
          <Button variant="outline" onClick={onClose} className="rounded-lg h-10 px-5 text-xs font-bold border-border/80 flex-1">Cancelar</Button>
          <Button onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-10 px-5 text-xs font-bold flex-1">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}