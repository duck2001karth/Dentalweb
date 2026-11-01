"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { InventoryItem, InventoryFormData } from "@/types/inventory"

export function useInventory() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading, refetch } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Error al cargar el inventario")
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const payload = {
        ...data,
        stock: Number(data.stock) || 0,
        minStock: Number(data.minStock) || 0,
        unitCost: Number(data.unitCost) || 0,
        fechaExpiracion: data.fechaExpiracion ? new Date(data.fechaExpiracion).toISOString() : null,
      }
      const res = await fetch("/api/inventory", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Insumo registrado", variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
    onError: () => toast({ title: "Error al registrar", variant: "destructive" })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryFormData> }) => {
      const payload = { ...data }
      if (payload.stock !== undefined) payload.stock = Number(payload.stock)
      if (payload.minStock !== undefined) payload.minStock = Number(payload.minStock)
      if (payload.fechaExpiracion !== undefined) {
        payload.fechaExpiracion = payload.fechaExpiracion ? new Date(payload.fechaExpiracion).toISOString() : undefined
      }
      const res = await fetch("/api/inventory", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...payload })
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Insumo actualizado", variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" })
  })

  return {
    items,
    isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    fetchItems: refetch, // Mantenemos el nombre original para no romper tu UI
    createItem: async (data: InventoryFormData) => {
      try { await createMutation.mutateAsync(data); return true } catch { return false }
    },
    updateItem: async (id: string, data: Partial<InventoryFormData>) => {
      try { await updateMutation.mutateAsync({ id, data }); return true } catch { return false }
    }
  }
}