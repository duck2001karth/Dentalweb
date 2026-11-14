"use client"

import React, { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface AdminPlanDeleteDialogProps {
  open: boolean
  plan: any | null
  permanent: boolean
  loading: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<boolean>
}

export function AdminPlanDeleteDialog({
  open, plan, permanent, loading, onClose, onConfirm,
}: AdminPlanDeleteDialogProps) {
  const [reason, setReason] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setReason("")
    setAcknowledged(false)
    setError("")
  }, [open, plan?.id, permanent])

  const paid = Number(plan?.totalPaid ?? 0)
  const hasItemPayments = Array.isArray(plan?.items) && plan.items.some((item: any) =>
    Number(item.paidAmount ?? 0) > 0 || item.isPaid === true
  )
  const hasFinancialHistory = paid !== 0 || hasItemPayments ||
    (Array.isArray(plan?.payments) && plan.payments.length > 0)
  const status = String(plan?.status || "")
  const nonDraft = status !== "DRAFT"
  const blocked = hasFinancialHistory || (permanent && nonDraft && status !== "CANCELLED") ||
    (!permanent && status !== "DRAFT" && status !== "ACTIVE")
  const canSubmit = !blocked && reason.trim().length >= 10 && reason.trim().length <= 500 && acknowledged && !loading

  async function confirm() {
    if (!canSubmit) return
    setError("")
    try {
      const ok = await onConfirm(reason.trim())
      if (!ok) setError("No se completó la operación. Revisa el mensaje de error y el estado del plan.")
    } catch {
      setError("No se pudo procesar la solicitud. Comprueba la conexión.")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next && !loading) onClose() }}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {permanent ? "Eliminar definitivamente el plan" : "Mover plan a la papelera"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {permanent
              ? "Esta operación es irreversible. Solo pueden borrarse planes sin aprobaciones, cobros ni registros clínicos vinculados."
              : "El plan quedará anulado y se conservarán su documentación, firmas y registros. No es una eliminación definitiva."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-semibold">{String(plan?.name || "Plan de tratamiento")}</p>
            <p className="text-muted-foreground">Estado: {status || "No disponible"}</p>
          </div>
          {blocked ? (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {hasFinancialHistory
                ? "Este plan tiene abonos o movimientos financieros. No puede eliminarse ni moverse a la papelera desde aquí. Solicita una revisión administrativa y financiera."
                : "La operación no está permitida para el estado actual del plan."}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="admin-plan-delete-reason">Motivo obligatorio (10 a 500 caracteres)</Label>
                <Textarea
                  id="admin-plan-delete-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={loading}
                  placeholder="Explica por qué se anula o elimina este plan"
                />
                <p className="text-xs text-muted-foreground">{reason.trim().length}/500 caracteres</p>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="admin-plan-delete-confirm"
                  checked={acknowledged}
                  onCheckedChange={(value) => setAcknowledged(value === true)}
                  disabled={loading}
                />
                <Label htmlFor="admin-plan-delete-confirm" className="text-sm font-normal leading-5">
                  Comprendo las consecuencias y confirmo que estoy autorizado a realizar esta operación.
                </Label>
              </div>
            </>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          {!blocked && (
            <AlertDialogAction
              disabled={!canSubmit}
              onClick={(e) => { e.preventDefault(); void confirm() }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {permanent ? "Eliminar definitivamente" : "Mover a la papelera"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
