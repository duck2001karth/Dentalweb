"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { PaymentRecord, PaymentFormData } from "@/types/billing"

export function usePayments() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [localLastClose, setLocalLastClose] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments")
      if (!res.ok) throw new Error("Error al cargar los pagos")
      return res.json()
    }
  })

  const payments: PaymentRecord[] = Array.isArray(data) ? data : data?.payments || []
  const lastClose = data?.lastClose || localLastClose

  const createMutation = useMutation({
    mutationFn: async ({ payload, processedById }: { payload: any; processedById?: string }) => {
      const res = await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, processedById })
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["treatments"] }) // Actualiza saldos de planes automáticamente
    },
    onError: () => toast({ title: "Error de Registro", variant: "destructive" })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch("/api/payments", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...payload })
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["treatments"] })
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" })
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason, permanent }: { id: string; reason?: string; permanent: boolean }) => {
      const res = await fetch(`/api/payments/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Anulación registrada desde módulo de caja", permanent })
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["treatments"] })
    },
    onError: () => toast({ title: "Error al anular cobro", variant: "destructive" })
  })

  return {
    payments,
    lastClose,
    setLastClose: setLocalLastClose,
    isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    fetchPayments: refetch,
    createPayment: async (payload: PaymentFormData & { treatmentPlanId?: string; reference?: string; receiptImage?: string | null }, processedById?: string) => {
      try { await createMutation.mutateAsync({ payload, processedById }); return true } catch { return false }
    },
    updatePayment: async (id: string, payload: Partial<PaymentFormData & { reference?: string }>) => {
      try { await updateMutation.mutateAsync({ id, payload }); return true } catch { return false }
    },
    deletePayment: async (id: string, reason?: string, permanent: boolean = false) => {
      try { await deleteMutation.mutateAsync({ id, reason, permanent }); return true } catch { return false }
    }
  }
}