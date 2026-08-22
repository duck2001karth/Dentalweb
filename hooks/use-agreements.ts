"use client"

import { useState, useCallback, useEffect } from "react"
import type { Agreement, AgreementFormData } from "@/types/agreements"
import { useToast } from "@/hooks/use-toast"

export function useAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const { toast } = useToast()

  // 1. READ (Leer / Listar)
  const fetchAgreements = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/agreements")
      if (!res.ok) throw new Error("Error al obtener los convenios")
      const data = await res.json()
      setAgreements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar los convenios institucionales.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAgreements()
  }, [fetchAgreements])

  // 2. CREATE (Crear)
  const createAgreement = async (data: AgreementFormData): Promise<boolean> => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Error al crear el convenio")

      toast({
        title: "Convenio Creado",
        description: "El convenio y sus tarifas se registraron correctamente."
      })
      await fetchAgreements()
      return true
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar el convenio.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }
  const updateAgreement = async (id: string, data: AgreementFormData): Promise<boolean> => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Error al actualizar el convenio")

      toast({
        title: "Convenio Actualizado",
        description: "Los cambios se guardaron con éxito."
      })
      await fetchAgreements()
      return true
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el convenio.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAgreement = async (id: string): Promise<boolean> => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Error al eliminar el convenio")

      toast({
        title: "Convenio Eliminado",
        description: "El convenio fue removido de la base de datos."
      })
      await fetchAgreements()
      return true
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el convenio.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!res.ok) throw new Error()

      toast({
        title: !currentStatus ? "Convenio Activado" : "Convenio Desactivado",
        description: `El convenio ahora está ${!currentStatus ? "disponible" : "inactivo"}.`
      })
      await fetchAgreements()
      return true
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del convenio.",
        variant: "destructive"
      })
      return false
    }
  }

  return {
    agreements,
    isLoading,
    isSaving,
    fetchAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    toggleStatus
  }
}