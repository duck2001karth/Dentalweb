"use client"

import React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

interface Procedure {
  id: string
  name: string
  code: string | null
}

interface ProcedureDeleteDialogProps {
  itemToDelete: Procedure | null
  onClose: () => void
  onConfirm: () => Promise<void>
  isSaving: boolean
}

export function ProcedureDeleteDialog({
  itemToDelete,
  onClose,
  onConfirm,
  isSaving
}: ProcedureDeleteDialogProps) {
  return (
    <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border rounded-[24px] p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <DialogTitle className="text-center text-lg font-black text-foreground">
            ¿Eliminar Prestación?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
            Estás por remover <strong className="text-foreground">"{itemToDelete?.name}"</strong> del catálogo arancelario. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold h-10 px-5 border-border"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-10 px-6"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
            Sí, Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}