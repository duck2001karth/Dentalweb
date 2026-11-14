"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ItemToCorrect { id: string; name: string }
interface CorrectionResult { mode: "NEW_DRAFT" | "REQUEST_REVIEW"; newPlanId?: string; message?: string }
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  selectedItems: ItemToCorrect[]
  onComplete: (result: CorrectionResult) => void | Promise<void>
}

export function TreatmentCorrectionDialog({ open, onOpenChange, planId, selectedItems, onComplete }: Props) {
  const { toast } = useToast()
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestReviewOnly, setRequestReviewOnly] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const cleanReason = reason.trim()
    if (isSubmitting || selectedItems.length === 0 || cleanReason.length < 10 || cleanReason.length > 1000) return
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/treatments/${encodeURIComponent(planId)}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cleanReason,
          removeItemIds: selectedItems.map(item => item.id),
          mode: requestReviewOnly ? "REQUEST_REVIEW" : "AUTO_IF_UNPAID",
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error || `No se pudo registrar la corrección (HTTP ${response.status})`)
      const result: CorrectionResult = { mode: body?.mode, newPlanId: body?.newPlanId, message: body?.message }
      if (result.mode !== "NEW_DRAFT" && result.mode !== "REQUEST_REVIEW") throw new Error("Respuesta inesperada del servidor")
      toast({ title: result.mode === "NEW_DRAFT" ? "Nueva versión creada" : "Solicitud registrada", description: result.message || "Operación registrada", variant: "success" })
      setReason("")
      setRequestReviewOnly(false)
      await onComplete(result)
    } catch (error) {
      toast({ title: "No se pudo corregir", description: error instanceof Error ? error.message : "Error inesperado", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) onOpenChange(next) }}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle>Corregir presupuesto aprobado</DialogTitle>
          <DialogDescription>
            El presupuesto firmado se conserva. Sin pagos podrá generarse un borrador nuevo;
            con pagos solo se registra una solicitud de revisión financiera, sin alterar Caja.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Prestaciones seleccionadas ({selectedItems.length})</p>
            <ul className="list-disc pl-5 text-sm max-h-32 overflow-y-auto">
              {selectedItems.map(item => <li key={item.id}>{item.name}</li>)}
            </ul>
          </div>
          <div className="space-y-2">
            <label htmlFor="correction-reason" className="text-sm font-semibold">Motivo obligatorio (10 a 1000 caracteres)</label>
            <textarea id="correction-reason" className="w-full min-h-28 rounded-lg border border-border bg-background p-3 text-sm" value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} disabled={isSubmitting} placeholder="Ej.: Se incluyó una prestación por error de digitación..." required />
            <p className="text-xs text-muted-foreground">{reason.trim().length}/1000 caracteres</p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={requestReviewOnly} onChange={e => setRequestReviewOnly(e.target.checked)} disabled={isSubmitting} className="mt-1" />
            Solo solicitar revisión, incluso si no existen pagos.
          </label>
          <p className="text-xs text-muted-foreground">No se borrarán los recibos ni la aprobación original. Una nueva versión requiere una nueva firma del paciente.</p>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || selectedItems.length === 0 || reason.trim().length < 10 || reason.trim().length > 1000}>{isSubmitting ? "Registrando..." : "Confirmar corrección"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
