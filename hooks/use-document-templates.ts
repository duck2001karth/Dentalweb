"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { 
  DocumentTemplate, 
  DocumentTemplateFormData, 
  ClinicalDocType 
} from "@/types/clinical-templates"

interface UseDocumentTemplatesOptions {
  type?: ClinicalDocType;
  onlyActive?: boolean;
}

export function useDocumentTemplates(options?: UseDocumentTemplatesOptions) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (options?.type) queryParams.append("type", options.type)
      if (options?.onlyActive !== undefined) queryParams.append("onlyActive", String(options.onlyActive))

      const res = await fetch(`/api/configuration/templates?${queryParams.toString()}`)
      if (!res.ok) throw new Error("Error al obtener las plantillas")
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "No se pudieron cargar las plantillas clínicas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [options?.type, options?.onlyActive, toast])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const createTemplate = async (payload: DocumentTemplateFormData): Promise<boolean> => {
    setIsSaving(true)
    try {
        const res = await fetch("/api/configuration/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result?.error || "Error al crear la plantilla")

      toast({
        title: "Plantilla creada",
        description: "El formato clínico se registró correctamente.",
      })
      await fetchTemplates()
      return true
    } catch (err: any) {
      toast({
        title: "Error al guardar",
        description: err?.message || "No se pudo registrar la plantilla",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const updateTemplate = async (id: string, payload: Partial<DocumentTemplateFormData>): Promise<boolean> => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/configuration/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result?.error || "Error al actualizar la plantilla")

      toast({
        title: "Plantilla actualizada",
        description: "Los cambios se guardaron con éxito.",
        variant: "success",
      })
      await fetchTemplates()
      return true
    } catch (err: any) {
      toast({
        title: "Error al actualizar",
        description: err?.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/configuration/templates/${id}`, {
        method: "DELETE",
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result?.error || "Error al eliminar")

      toast({
        title: "Plantilla eliminada",
        description: "El formato clínico ha sido retirado.",
        variant: "success",
      })
      setTemplates(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err: any) {
      toast({
        title: "Error", 
        description: err?.message || "No se pudo eliminar la plantilla",
        variant: "destructive",
      })
      return false
    }
  }
  const interpolateTemplate = (
    rawText: string,
    data: {
      patient?: { name?: string; ci?: string; age?: string | number; address?: string; phone?: string };
      doctor?: { name?: string; specialty?: string };
      clinic?: { name?: string; ruc?: string; city?: string; phone?: string };
    }
  ): string => {
    if (!rawText) return ""

    let text = rawText
    const now = new Date()

    const replacements: Record<string, string> = {
      "{{paciente_nombre}}": data.patient?.name || "[Nombre del Paciente]",
      "{{paciente_ci}}": data.patient?.ci || "[CI del Paciente]",
      "{{paciente_edad}}": data.patient?.age ? `${data.patient.age} años` : "[Edad]",
      "{{paciente_direccion}}": data.patient?.address || "[Dirección]",
      "{{paciente_telefono}}": data.patient?.phone || "[Teléfono]",

      "{{doctor_nombre}}": data.doctor?.name || "[Nombre del Profesional]",
      "{{doctor_especialidad}}": data.doctor?.specialty || "Odontología General",

      "{{clinica_nombre}}": data.clinic?.name || "Clínica Dental",
      "{{clinica_ruc}}": data.clinic?.ruc || "",
      "{{clinica_ciudad}}": data.clinic?.city || "",
      "{{clinica_telefono}}": data.clinic?.phone || "",

      "{{fecha_actual}}": now.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
      "{{hora_actual}}": now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }

    Object.entries(replacements).forEach(([tag, value]) => {
      text = text.replaceAll(tag, value)
    })

    return text
  }

  return {
    templates,
    isLoading,
    isSaving,
    refreshTemplates: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    interpolateTemplate,
  }
}