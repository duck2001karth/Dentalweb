"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { PaymentRecord, PaymentFormData } from "@/types/billing"

async function readResponse(res: Response) {
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error || json?.message || `Error HTTP ${res.status}`)
  return json
}

export function usePayments() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [localLastClose, setLocalLastClose] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => readResponse(await fetch("/api/payments")),
  })
  const payments: PaymentRecord[] = Array.isArray(data) ? data : data?.payments || []
  const lastClose = data?.lastClose || localLastClose
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["payments"] })
    queryClient.invalidateQueries({ queryKey: ["treatments"] })
  }
  const createMutation = useMutation({
    mutationFn: async ({ payload }: { payload: PaymentFormData }) =>
      readResponse(await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })),
    onSuccess: invalidate,
    onError: (error: Error) => toast({ title: "Error de registro", description: error.message, variant: "destructive" }),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PaymentFormData> }) =>
      readResponse(await fetch("/api/payments", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, method: payload.method, reference: payload.reference,
          notes: payload.notes, receiptNumber: payload.receiptNumber }),
      })),
    onSuccess: invalidate,
    onError: (error: Error) => toast({ title: "Error al actualizar", description: error.message, variant: "destructive" }),
  })
  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason, permanent }: { id: string; reason?: string; permanent: boolean }) =>
      readResponse(await fetch(`/api/payments/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Anulación registrada desde módulo de caja", permanent }),
      })),
    onSuccess: invalidate,
    onError: (error: Error) => toast({ title: "Error al anular cobro", description: error.message, variant: "destructive" }),
  })
  return {
    payments, lastClose, setLastClose: setLocalLastClose, isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    fetchPayments: refetch,
    createPayment: async (payload: PaymentFormData, _processedById?: string) => {
      try { await createMutation.mutateAsync({ payload }); return true } catch { return false }
    },
    updatePayment: async (id: string, payload: Partial<PaymentFormData>) => {
      try { await updateMutation.mutateAsync({ id, payload }); return true } catch { return false }
    },
    deletePayment: async (id: string, reason?: string, permanent = false) => {
      try { await deleteMutation.mutateAsync({ id, reason, permanent }); return true } catch { return false }
    },
  }
}
