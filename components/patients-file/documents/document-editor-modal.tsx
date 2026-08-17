"use client"

import React, { useState, useEffect } from "react"
import { Loader2, FileText, CheckCircle2, Zap, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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

const TEMPLATES = [
  {
    id: "cert_medico",
    title: "Certificado Médico Odontológico",
    content: (patientName: string, dateStr: string, doctorName: string) => 
`CERTIFICADO MÉDICO ODONTOLÓGICO

A QUIEN CORRESPONDA:

Certifico que el/la paciente ${patientName}, ha sido atendido/a en esta clínica odontológica el día ${dateStr}.

DIAGNÓSTICO:
[Describir aquí el diagnóstico clínico]

TRATAMIENTO REALIZADO:
[Describir procedimiento realizado]

RECOMENDACIONES / REPOSO:
Se recomienda reposo por [X] días a partir de la fecha de atención, debiendo reincorporarse a sus actividades habituales el día [Fecha].

Se expide el presente certificado a petición de la parte interesada para los fines pertinentes.

Atentamente,
${doctorName}`
  },
  {
    id: "consentimiento_ext",
    title: "Consentimiento - Exodoncia",
    content: (patientName: string, dateStr: string, doctorName: string) => 
`CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTO QUIRÚRGICO

Fecha: ${dateStr}
Paciente: ${patientName}
Profesional Tratante: ${doctorName}

1. Naturaleza del Procedimiento:
He sido informado/a de la necesidad clínica de realizar la extracción de la(s) pieza(s) dental(es) N° [Piezas].

2. Riesgos Informados:
Comprendo que el procedimiento puede conllevar dolor leve o moderado, inflamación, equimosis o hematoma, sangrado postoperatorio y riesgo de infección local, los cuales serán tratados con la medicación prescrita.

3. Declaración de Consentimiento:
Habiendo resuelto mis inquietudes de forma clara y satisfactoria, autorizo libremente al profesional a cargo para la realización del procedimiento.

Firma adjunta electrónicamente en la ficha clínica.`
  },
  {
    id: "receta_blanca",
    title: "Receta e Indicaciones Clínicas",
    content: (patientName: string, dateStr: string, doctorName: string) => 
`INDICACIONES MÉDICAS Y RECETA ODONTOLÓGICA

Fecha: ${dateStr}
Paciente: ${patientName}

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

${doctorName}`
  }
]

export function ClinicalDocEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTitle = "",
  initialContent = "",
  isSaving = false,
  patientData,
  doctorName = "Dr(a). Tratante"
}: ClinicalDocEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle)
      setContent(initialContent)
      setActiveTemplateId(null)
    }
  }, [isOpen, initialTitle, initialContent])

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    const patientName = patientData 
      ? `${patientData.firstName || ""} ${patientData.lastName || ""}`.trim() 
      : "Paciente Registrado"
    const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
    
    setTitle(template.title)
    setContent(template.content(patientName, dateStr, doctorName))
    setActiveTemplateId(template.id)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSave(title, content)
  }

  return (
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

        {/* CONTENEDOR HORIZONTAL DE 2 COLUMNAS */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch min-h-[420px]">
            
            {/* COLUMNA IZQUIERDA: PLANTILLAS RÁPIDAS (4 COLS) */}
            <div className="md:col-span-4 bg-muted/15 border border-border/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Plantillas Rápidas
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selecciona una plantilla para auto-completar los datos del paciente y fecha:
              </p>

              <div className="space-y-2 mt-1 flex-1 overflow-y-auto">
                {TEMPLATES.map((tpl) => {
                  const isSelected = activeTemplateId === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
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
                💡 <b>Tip:</b> Puedes modificar libremente cualquier párrafo tras cargar la plantilla.
              </div>
            </div>

            {/* COLUMNA DERECHA: CAMPOS DE REDACCIÓN (8 COLS) */}
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
                  placeholder="Redacta el contenido del documento clínico o selecciona una plantilla rápida de la izquierda..."
                  className="rounded-xl text-xs bg-background leading-relaxed flex-1 min-h-[300px] resize-none font-sans"
                  required
                />
              </div>

            </div>

          </div>

          {/* FOOTER */}
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
  )
}