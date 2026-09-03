"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Loader2, FileText, CheckCircle2, Zap, AlertTriangle, User, Calendar, Stethoscope } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PREDEFINED_TEMPLATES } from "@/config/default-clinical-templates"
import { DocumentTemplate } from "@/types/clinical-templates"

interface ClinicalDocEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, content: string, templateMeta?: { requiresPatientSig?: boolean; requiresDoctorSig?: boolean }) => Promise<void>
  initialTitle?: string
  initialContent?: string
  isSaving?: boolean
  patientData?: any
  doctorName?: string
  clinicData?: {
    name?: string
    city?: string
    phone?: string
    ruc?: string
  }
}

export function ClinicalDocEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTitle = "",
  initialContent = "",
  isSaving = false,
  patientData,
  doctorName = "Dr(a). Tratante",
  clinicData,
}: ClinicalDocEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<DocumentTemplate[]>(PREDEFINED_TEMPLATES as unknown as DocumentTemplate[])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<DocumentTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const patientName = patientData
    ? `${patientData.firstName || ""} ${patientData.lastName || ""}`.trim() || patientData.name || "Paciente Registrado"
    : "Paciente Registrado"

  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const timeStr = format(new Date(), "HH:mm")

  const loadTemplatesFromApi = useCallback(async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch("/api/configuration/templates")
      if (res.ok) {
        const data = await res.json()
        const fetched = Array.isArray(data) ? data : data.templates
        if (Array.isArray(fetched) && fetched.length > 0) {
          setTemplates(fetched)
          return
        }
      }
      setTemplates(PREDEFINED_TEMPLATES as unknown as DocumentTemplate[])
    } catch {
      setTemplates(PREDEFINED_TEMPLATES as unknown as DocumentTemplate[])
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle)
      setContent(initialContent)
      setActiveTemplateId(null)
      setPendingTemplate(null)
      loadTemplatesFromApi()
    }
  }, [isOpen, initialTitle, initialContent, loadTemplatesFromApi])

  const parseTemplateContent = (rawContent: string): string => {
    return rawContent
      .replace(/{{paciente_nombre}}/gi, patientName)
      .replace(/{{paciente_ci}}/gi, patientData?.ci || patientData?.documentId || "S/N")
      .replace(/{{paciente_edad}}/gi, String(patientData?.age || patientData?.edad || ""))
      .replace(/{{paciente_telefono}}/gi, patientData?.phone || patientData?.telefono || "")
      .replace(/{{paciente_direccion}}/gi, patientData?.address || patientData?.direccion || "")
      .replace(/{{doctor_nombre}}/gi, doctorName)
      .replace(/{{doctor_especialidad}}/gi, "Odontología General / Especializada")
      .replace(/{{clinica_nombre}}/gi, clinicData?.name || "CARMODENTAL")
      .replace(/{{clinica_ciudad}}/gi, clinicData?.city || "Quito")
      .replace(/{{clinica_telefono}}/gi, clinicData?.phone || "0992550241")
      .replace(/{{clinica_ruc}}/gi, clinicData?.ruc || "1790000000001")
      .replace(/{{fecha_actual}}/gi, dateStr)
      .replace(/{{hora_actual}}/gi, timeStr)
      .replace(/{{paciente}}/gi, patientName)
      .replace(/{{fecha}}/gi, dateStr)
      .replace(/{{doctor}}/gi, doctorName)
      .replace(/{{ci}}/gi, patientData?.ci || "S/N")
      .replace(/{{edad}}/gi, String(patientData?.age || ""))
  }

  const applyTemplateNow = (tpl: DocumentTemplate) => {
    setTitle(tpl.title)
    setContent(parseTemplateContent(tpl.content))
    setActiveTemplateId(tpl.id)
    setPendingTemplate(null)
  }

  const handleTemplateClick = (tpl: DocumentTemplate) => {
    if (content.trim().length > 25 && content !== initialContent) {
      setPendingTemplate(tpl)
    } else {
      applyTemplateNow(tpl)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const active = templates.find((t) => t.id === activeTemplateId)
    onSave(title, content, {
      requiresPatientSig: active?.requiresPatientSignature ?? true,
      requiresDoctorSig: active?.requiresDoctorSignature ?? true,
    })
  }

  // Filtrado por categoría
  const filteredTemplates = templates.filter(
    (t) => selectedCategory === "ALL" || (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase())
  )

  const categories = ["ALL", ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))] as string[]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1020px] w-[95vw] bg-card text-foreground border border-border/80 shadow-2xl rounded-[28px] p-0 overflow-hidden font-sans antialiased">
          
          {/* CABECERA */}
          <DialogHeader className="px-7 py-4.5 border-b border-border/70 bg-muted/20 flex flex-row items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8] rounded-2xl shrink-0 border border-[#008bcd]/20">
                <FileText className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                  {initialTitle ? "Editar Documento Clínico" : "Emitir Nuevo Documento Clínico"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paciente: <strong className="text-foreground">{patientName}</strong> • {dateStr}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* CUERPO EN 2 COLUMNAS */}
          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch min-h-[460px]">
              <div className="md:col-span-5 bg-muted/15 border border-border/80 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-[#008bcd] uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-[#008bcd]" />
                    Plantillas Institucionales
                  </div>
                  {loadingTemplates && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Filtro rápido por especialidad */}
                <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap border transition-all ${
                        selectedCategory === cat
                          ? "bg-[#008bcd] text-white border-[#008bcd]"
                          : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                      }`}
                    >
                      {cat === "ALL" ? "Todas" : cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mt-1 flex-1 overflow-y-auto max-h-[340px] pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = activeTemplateId === tpl.id
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleTemplateClick(tpl)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer block leading-snug ${
                          isSelected
                            ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-xs"
                            : "bg-background border-border hover:border-[#008bcd]/40 hover:bg-muted/30 text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase text-muted-foreground px-1.5 py-0.2 rounded bg-muted">
                            {tpl.category || tpl.type}
                          </span>
                        </div>
                        <div className="line-clamp-2">{tpl.title}</div>
                      </button>
                    )
                  })}
                </div>

                <div className="p-2.5 bg-muted/30 rounded-xl border border-border/60 text-[10px] text-muted-foreground leading-relaxed">
                  Las etiquetas <code className="text-[#008bcd] font-mono">{"{{...}}"}</code> se sustituyen con los datos clínicos automáticamente al pulsar la plantilla.
                </div>
              </div>

              {/* COLUMNA DERECHA: EDICIÓN DEL DOCUMENTO (7 COLS) */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Título del Documento *
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Consentimiento Informado para Endodoncia..."
                    className="rounded-xl text-xs h-10 font-bold bg-background text-foreground border-border focus-visible:ring-[#008bcd]"
                    required
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Cuerpo Oficial del Documento *
                  </Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Selecciona una plantilla de la izquierda para autocompletar el documento o redacta libremente..."
                    className="rounded-xl text-xs bg-background leading-relaxed flex-1 min-h-[330px] resize-none font-sans border-border focus-visible:ring-[#008bcd] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
                    required
                  />
                </div>
              </div>

            </div>

            {/* BOTONES DE PIE */}
            <div className="pt-4 border-t border-border/80 flex flex-row items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs font-bold h-10 px-5 hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !title.trim() || !content.trim()}
                className="bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-xl text-xs font-bold h-10 px-6 shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                )}
                {initialTitle ? "Actualizar Documento" : "Emitir Documento"}
              </Button>
            </div>

          </form>

        </DialogContent>
      </Dialog>

      {/* CONFIRMACIÓN DE SOBRESCRITURA */}
      <AlertDialog open={!!pendingTemplate} onOpenChange={() => setPendingTemplate(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground text-sm font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              ¿Reemplazar el texto redactado?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Ya tienes contenido en el editor. Al aplicar <b>"{pendingTemplate?.title}"</b>, el texto actual será sustituido por el formato legal seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-bold">Mantener mi texto</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingTemplate && applyTemplateNow(pendingTemplate)}
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl text-xs font-bold"
            >
              Sí, reemplazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}