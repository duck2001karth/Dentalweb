"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { LaboratoryRecord, LaboratoryFormData, UpdateLaboratoryData } from "@/types/laboratory"

export function useLaboratories() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: laboratories = [], isLoading, refetch } = useQuery<LaboratoryRecord[]>({
    queryKey: ["laboratories"],
    queryFn: async () => {
      const res = await fetch("/api/laboratories")
      if (!res.ok) throw new Error("Error al obtener los laboratorios")
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (input: LaboratoryFormData) => {
      const res = await fetch("/api/laboratories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, balance: Number(input.balance) || 0 })
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: (newLab) => {
      toast({ title: "Laboratorio creado", description: `Se registró correctamente el laboratorio ${newLab.name}.`, variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["laboratories"] })
    },
    onError: () => toast({ title: "Error", description: "No se pudo registrar el laboratorio.", variant: "destructive" })
  })

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateLaboratoryData) => {
      const res = await fetch("/api/laboratories", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, ...(input.balance !== undefined && { balance: Number(input.balance) || 0 }) })
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: (updatedLab) => {
      toast({ title: "Laboratorio actualizado", description: `Se guardaron los cambios de ${updatedLab.name}.`, variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["laboratories"] })
    },
    onError: () => toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" })
  })

  return {
    laboratories,
    isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    fetchLaboratories: refetch,
    createLaboratory: async (input: LaboratoryFormData) => {
      try { return await createMutation.mutateAsync(input) } catch { return null }
    },
    updateLaboratory: async (input: UpdateLaboratoryData) => {
      try { return await updateMutation.mutateAsync(input) } catch { return null }
    }
  }
}