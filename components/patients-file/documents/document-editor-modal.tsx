"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Loader2, FileText, CheckCircle2, Zap, AlertTriangle, RefreshCw } from "lucide-react"
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

interface TemplateItem {
  id: string
  title: string
  content: string | ((patientName: string, dateStr: string, doctorName: string) => string)
  category?: string
}

interface ClinicalDocEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, content: string) => Promise<void>
  initialTitle?: string
  initialContent?: string
  isSaving?: boolean
  patientData?: any
  doctorName?: string
}

// 1. Plantillas base de respaldo (Fallback local)
const DEFAULT_FALLBACK_TEMPLATES: TemplateItem[] = [
  {
    id: "cert_medico",
    title: "Certificado Médico Odontológico",
    content: (patientName: string, dateStr: string, doctorName: string) =>
`CERTIFICADO MÉDICO ODONTOLÓGICO

A QUIEN CORRESPONDA:

Certifico que el/la paciente {{paciente}}, ha sido atendido/a en esta clínica odontológica el día {{fecha}}.

DIAGNÓSTICO:
[Describir aquí el diagnóstico clínico]

TRATAMIENTO REALIZADO:
[Describir procedimiento realizado]

RECOMENDACIONES / REPOSO:
Se recomienda reposo por [X] días a partir de la fecha de atención, debiendo reincorporarse a sus actividades habituales el día [Fecha].

Se expide el presente certificado a petición de la parte interesada para los fines pertinentes.

Atentamente,
{{doctor}}`,
  },
  {
    id: "consentimiento_ext",
    title: "Consentimiento - Exodoncia",
    content: (patientName: string, dateStr: string, doctorName: string) =>
`CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTO QUIRÚRGICO

Fecha: {{fecha}}
Paciente: {{paciente}}
Profesional Tratante: {{doctor}}

1. Naturaleza del Procedimiento:
He sido informado/a de la necesidad clínica de realizar la extracción de la(s) pieza(s) dental(es) N° [Piezas].

2. Riesgos Informados:
Comprendo que el procedimiento puede conllevar dolor leve o moderado, inflamación, equimosis o hematoma, sangrado postoperatorio y riesgo de infección local, los cuales serán tratados con la medicación prescrita.

3. Declaración de Consentimiento:
Habiendo resuelto mis inquietudes de forma clara y satisfactoria, autorizo libremente al profesional a cargo para la realización del procedimiento.

Firma adjunta electrónicamente en la ficha clínica.`,
  },
  {
    id: "receta_blanca",
    title: "Receta e Indicaciones Clínicas",
    content: (patientName: string, dateStr: string, doctorName: string) =>
`INDICACIONES MÉDICAS Y RECETA ODONTOLÓGICA

Fecha: {{fecha}}
Paciente: {{paciente}}

Rp.
1. [Medicamento 1 - Ej: Amoxicilina 500mg]
   Tomar 1 cápsula cada 8 horas por 7 días.

2. [Medicamento 2 - Ej: Ibuprofeno 400mg]
   Tomar 1 tableta cada 8 horas por 3 días (después de las comidas).

CUIDADOS GENERALES:
• Mantener gasa con presión firme por 30 minutos.
• Dieta blanda y fría durante las primeras 24 horas.
• No realizar enjuagues ni escupir durante el primer día.
• Mantener adecuada higiene bucal evitando la zona tratada.

{{doctor}}`,
  },
]

export function ClinicalDocEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTitle = "",
  initialContent = "",
  isSaving = false,
  patientData,
  doctorName = "Dr(a). Tratante",
}: ClinicalDocEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_FALLBACK_TEMPLATES)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<TemplateItem | null>(null)
  const patientName = patientData
    ? `${patientData.firstName || ""} ${patientData.lastName || ""}`.trim() || patientData.name || "Paciente Registrado"
    : "Paciente Registrado"

  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const loadTemplatesFromApi = useCallback(async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch("/api/clinical-templates")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data)
          return
        }
      }
    } catch {
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
  const parseTemplateContent = (rawContent: string | Function): string => {
    let resolved = typeof rawContent === "function" 
      ? rawContent(patientName, dateStr, doctorName) 
      : rawContent

    return resolved
      .replace(/{{paciente}}/gi, patientName)
      .replace(/{{fecha}}/gi, dateStr)
      .replace(/{{doctor}}/gi, doctorName)
      .replace(/{{ci}}/gi, patientData?.ci || "S/N")
      .replace(/{{edad}}/gi, String(patientData?.age || ""))
  }

  const applyTemplateNow = (tpl: TemplateItem) => {
    setTitle(tpl.title)
    setContent(parseTemplateContent(tpl.content))
    setActiveTemplateId(tpl.id)
    setPendingTemplate(null)
  }

  const handleTemplateClick = (tpl: TemplateItem) => {
    if (content.trim().length > 20 && content !== initialContent) {
      setPendingTemplate(tpl)
    } else {
      applyTemplateNow(tpl)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSave(title, content)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[920px] w-[95vw] bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-0 overflow-hidden font-sans antialiased">
          
          {/* CABECERA */}
          <DialogHeader className="px-7 py-4 border-b border-border/70 bg-muted/20 flex flex-row items-center gap-3 text-left">
            <div className="p-2.5 bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8] rounded-2xl shrink-0 border border-[#008bcd]/20">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {initialTitle ? "Editar Documento Clínico" : "Redactar Nuevo Documento Clínico"}
              </DialogTitle>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Genera constancias, consentimientos informados y recetas para la historia clínica.
              </p>
            </div>
          </DialogHeader>

          {/* CONTENEDOR DE 2 COLUMNAS */}
          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch min-h-[420px]">
              
              {/* COLUMNA IZQUIERDA: PLANTILLAS (4 COLS) */}
              <div className="md:col-span-4 bg-muted/15 border border-border/80 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Plantillas Disponibles
                  </div>
                  {loadingTemplates && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Selecciona una plantilla para reemplazar datos del paciente y fecha automáticamente:
                </p>

                <div className="space-y-2 mt-1 flex-1 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
                  {templates.map((tpl) => {
                    const isSelected = activeTemplateId === tpl.id
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleTemplateClick(tpl)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer block leading-snug ${
                          isSelected
                            ? "bg-[#008bcd]/10 border-[#008bcd] text-[#008bcd] dark:text-[#38bdf8] shadow-xs"
                            : "bg-background border-border/80 hover:border-[#008bcd]/40 hover:bg-muted/30 text-foreground"
                        }`}
                      >
                        {tpl.title}
                      </button>
                    )
                  })}
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 text-[10px] text-muted-foreground leading-relaxed">
                  Variables soportadas: <code className="text-foreground font-mono font-bold">{"{{paciente}}"}</code>, <code className="text-foreground font-mono font-bold">{"{{fecha}}"}</code>, <code className="text-foreground font-mono font-bold">{"{{doctor}}"}</code>.
                </div>
              </div>

              {/* COLUMNA DERECHA: CAMPOS DE TEXTO (8 COLS) */}
              <div className="md:col-span-8 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Título del Documento *
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Certificado Médico, Consentimiento Quirúrgico..."
                    className="rounded-xl text-xs h-10 font-bold bg-background text-foreground"
                    required
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Cuerpo del Documento *
                  </Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Redacta el contenido del documento o selecciona una plantilla rápida de la izquierda..."
                    className="rounded-xl text-xs bg-background leading-relaxed flex-1 min-h-[300px] resize-none font-sans"
                    required
                  />
                </div>
              </div>

            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-4 border-t border-border/80 flex flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="rounded-xl text-xs font-bold h-10 px-5 hover:bg-muted cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !title.trim() || !content.trim()}
                className="bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-xl text-xs font-bold h-10 px-6 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                )}
                {initialTitle ? "Guardar Cambios" : "Guardar Documento"}
              </Button>
            </div>

          </form>

        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN DE SOBRESCRITURA */}
      <AlertDialog open={!!pendingTemplate} onOpenChange={() => setPendingTemplate(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              ¿Reemplazar el contenido actual?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ya has escrito texto en este documento. Al aplicar la plantilla <b>"{pendingTemplate?.title}"</b>, el texto actual será reemplazado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Mantener mi texto</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingTemplate && applyTemplateNow(pendingTemplate)}
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl font-bold"
            >
              Sí, aplicar plantilla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}