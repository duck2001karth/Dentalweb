"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { DocumentTemplate, DocumentTemplateFormData, ClinicalDocType } from "@/types/clinical-templates"

interface UseDocumentTemplatesOptions {
  type?: ClinicalDocType;
  onlyActive?: boolean;
}

export function useDocumentTemplates(options?: UseDocumentTemplatesOptions) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading, refetch } = useQuery<DocumentTemplate[]>({
    queryKey: ["document-templates", options],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (options?.type) queryParams.append("type", options.type)
      if (options?.onlyActive !== undefined) queryParams.append("onlyActive", String(options.onlyActive))
      
      const res = await fetch(`/api/configuration/templates?${queryParams.toString()}`)
      if (!res.ok) throw new Error("Error al obtener las plantillas")
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (payload: DocumentTemplateFormData) => {
      const res = await fetch("/api/configuration/templates", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error((await res.json())?.error || "Error al crear la plantilla")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Plantilla creada", description: "El formato clínico se registró correctamente." })
      queryClient.invalidateQueries({ queryKey: ["document-templates"] })
    },
    onError: (err: any) => toast({ title: "Error al guardar", description: err.message, variant: "destructive" })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<DocumentTemplateFormData> }) => {
      const res = await fetch(`/api/configuration/templates/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error((await res.json())?.error || "Error al actualizar la plantilla")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Plantilla actualizada", description: "Los cambios se guardaron con éxito.", variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["document-templates"] })
    },
    onError: (err: any) => toast({ title: "Error al actualizar", description: err.message, variant: "destructive" })
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/configuration/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json())?.error || "Error al eliminar")
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Plantilla eliminada", description: "El formato clínico ha sido retirado.", variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["document-templates"] })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  })

  const interpolateTemplate = (rawText: string, data: any): string => {
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
    Object.entries(replacements).forEach(([tag, value]) => { text = text.replaceAll(tag, value) })
    return text
  }

  return {
    templates, isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    refreshTemplates: refetch,
    createTemplate: async (payload: DocumentTemplateFormData) => { try { await createMutation.mutateAsync(payload); return true } catch { return false } },
    updateTemplate: async (id: string, payload: Partial<DocumentTemplateFormData>) => { try { await updateMutation.mutateAsync({ id, payload }); return true } catch { return false } },
    deleteTemplate: async (id: string) => { try { await deleteMutation.mutateAsync(id); return true } catch { return false } },
    interpolateTemplate,
  }
}