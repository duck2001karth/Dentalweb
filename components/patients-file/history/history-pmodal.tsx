"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pill, Loader2, CheckCircle2 } from "lucide-react"

interface QuickPrescriptionModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  authorId?: string
  editingNote?: any
  onSuccess: () => void | Promise<any>
}

export function QuickPrescriptionModal({
  isOpen,
  onOpenChange,
  patientId,
  authorId,
  onSuccess,
}: QuickPrescriptionModalProps) {
  const [medications, setMedications] = useState("")
  const [indications, setIndications] = useState("")
  const [observations, setObservations] = useState("")
  const [isSaving, setIsSaving] = useState(false)

 const handleSave = async () => {
    if (!medications.trim() && !indications.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          authorId,
          medications,
          indications,
          observations,
        }),
      })

      if (!res.ok) throw new Error("Error al guardar la receta")
      await fetch("/api/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            type: "PRESCRIPTION",
            patientId,
            authorId,
            content: JSON.stringify({ medications, indications, observations }),
            status: "COMPLETED",
          },
        }),
      }).catch(() => null)

      setMedications("")
      setIndications("")
      setObservations("")
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border rounded-[24px] shadow-2xl p-0 overflow-hidden font-sans">
        <DialogHeader className="px-6 py-4 border-b border-border/70 bg-muted/15">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Emitir Receta Médica
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra los fármacos e indicaciones para sincronizarlos con la ficha del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#008bcd] uppercase tracking-wider">
              1. Medicamentos (R.P.) *
            </Label>
            <Textarea
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="Ej: Amoxicilina 500mg (21 cápsulas)"
              className="min-h-[75px] rounded-xl text-xs bg-background resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#008bcd] uppercase tracking-wider">
              2. Indicaciones de Consumo *
            </Label>
            <Textarea
              value={indications}
              onChange={(e) => setIndications(e.target.value)}
              placeholder="Ej: Tomar 1 cápsula cada 8 horas durante 7 días después de comer."
              className="min-h-[75px] rounded-xl text-xs bg-background resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              3. Observaciones / Cuidados (Opcional)
            </Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ej: No suspender el tratamiento antes del tiempo indicado."
              className="min-h-[55px] rounded-xl text-xs bg-background resize-none"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/70 bg-muted/10 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-5"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!medications.trim() && !indications.trim())}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold h-10 px-6 shadow-xs flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
            Guardar y Emitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}