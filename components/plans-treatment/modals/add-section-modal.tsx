"use client"

import React, { useState } from "react"
import { Layers, Loader2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSection: (sectionName: string) => Promise<boolean | void> | void
}

export function AddSectionModal({
  isOpen,
  onClose,
  onAddSection,
}: AddSectionModalProps) {
  const { toast } = useToast()
  const [sectionName, setSectionName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = sectionName.trim()

    if (!trimmed) {
      toast({
        title: "Campo requerido",
        description: "Ingresa un nombre para la fase o sección.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onAddSection(trimmed)
      setSectionName("")
      onClose()
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar la sección.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-card border border-border/80 rounded-[24px] p-6 shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#008bcd]/15 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/25">
              <Layers className="w-4 h-4" />
            </div>
            Agregar Nueva Sección
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-normal">
            Agrupa tus prestaciones clínicas por fases o etapas de tratamiento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Nombre de la Fase / Sección <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Ej: Fase 1: Higiene y Operatoria"
              className="h-11 rounded-xl text-xs font-semibold bg-background border-border focus-visible:ring-[#008bcd]"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 flex flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-4 border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !sectionName.trim()}
              className="bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-xl text-xs font-bold h-10 px-5 shadow-sm transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              )}
              Crear Sección
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}