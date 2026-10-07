"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Agreement, AgreementFormData } from "@/types/agreements"
import { useToast } from "@/hooks/use-toast"

const AGREEMENTS_QUERY_KEY = ["agreements"]

export function useAgreements() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 1. READ con Estrategia de Caché Agresiva (24 Horas)
  const {
    data: agreements = [],
    isLoading,
    refetch: fetchAgreements,
  } = useQuery<Agreement[]>({
    queryKey: AGREEMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/agreements")
      if (!res.ok) throw new Error("Error al obtener los convenios")
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    staleTime: 1000 * 60 * 60 * 24, 
    gcTime: 1000 * 60 * 60 * 24 * 2, 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  // 2. CREATE (Mutación)
  const createMutation = useMutation({
    mutationFn: async (data: AgreementFormData) => {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al crear el convenio")
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: "Convenio Creado",
        description: "El convenio y sus tarifas se registraron correctamente.",
      })
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY })
    },
    onError: (error) => {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar el convenio.",
        variant: "destructive",
      })
    },
  })

  // 3. UPDATE (Mutación)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AgreementFormData }) => {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar el convenio")
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: "Convenio Actualizado",
        description: "Los cambios se guardaron con éxito.",
      })
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY })
    },
    onError: (error) => {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el convenio.",
        variant: "destructive",
      })
    },
  })

  // 4. DELETE (Mutación)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar el convenio")
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: "Convenio Eliminado",
        description: "El convenio fue removido de la base de datos.",
      })
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY })
    },
    onError: (error) => {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el convenio.",
        variant: "destructive",
      })
    },
  })

  // 5. TOGGLE STATUS (Mutación)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!res.ok) throw new Error("Error al cambiar estado")
      return { currentStatus }
    },
    onSuccess: ({ currentStatus }) => {
      toast({
        title: !currentStatus ? "Convenio Activado" : "Convenio Desactivado",
        description: `El convenio ahora está ${!currentStatus ? "disponible" : "inactivo"}.`,
      })
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del convenio.",
        variant: "destructive",
      })
    },
  })

  // Adaptadores asíncronos para compatibilidad 100% con tu UI existente
  const createAgreement = async (data: AgreementFormData): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }

  const updateAgreement = async (id: string, data: AgreementFormData): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, data })
      return true
    } catch {
      return false
    }
  }

  const deleteAgreement = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
    try {
      await toggleStatusMutation.mutateAsync({ id, currentStatus })
      return true
    } catch {
      return false
    }
  }

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleStatusMutation.isPending

  return {
    agreements,
    isLoading,
    isSaving,
    fetchAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    toggleStatus,
  }
}