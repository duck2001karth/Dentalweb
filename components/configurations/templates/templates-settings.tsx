"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  FileText, Loader2, Tag, Check, ShieldCheck, 
  UserCheck, Stethoscope, Sparkles, User, Building, Calendar
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { 
  ClinicalDocType, 
  DocumentTemplate, 
  DocumentTemplateFormData, 
  TEMPLATE_PLACEHOLDERS 
} from "@/types/clinical-templates"
import { cn } from "@/lib/utils"

interface DocumentTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  editingTemplate?: DocumentTemplate | null
  isSaving: boolean
  onSave: (data: DocumentTemplateFormData) => Promise<boolean>
}

const DOC_TYPES: { id: ClinicalDocType; label: string }[] = [
  { id: "CONSENT", label: "Consentimiento Informado" },
  { id: "CERTIFICATE", label: "Certificado Médico" },
  { id: "PRESCRIPTION", label: "Receta / Prescripción" },
  { id: "REPORT", label: "Informe Clínico" },
  { id: "AUTHORIZATION", label: "Autorización de Tratamiento" },
  { id: "INSTRUCTIONS", label: "Cuidados Postoperatorios" },
]

export function DocumentTemplateModal({
  isOpen,
  onClose,
  editingTemplate,
  isSaving,
  onSave,
}: DocumentTemplateModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [formData, setFormData] = useState<DocumentTemplateFormData>({
    title: "",
    type: "CONSENT",
    category: "Cirugía Oral",
    content: "",
    requiresPatientSignature: true,
    requiresDoctorSignature: true,
    isActive: true,
    isDefault: false,
  })

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        title: editingTemplate.title,
        type: editingTemplate.type,
        category: editingTemplate.category || "General",
        content: editingTemplate.content,
        requiresPatientSignature: editingTemplate.requiresPatientSignature,
        requiresDoctorSignature: editingTemplate.requiresDoctorSignature,
        isActive: editingTemplate.isActive,
        isDefault: editingTemplate.isDefault,
      })
    } else {
      setFormData({
        title: "",
        type: "CONSENT",
        category: "Cirugía Oral",
        content: `Por medio de la presente, yo, {{paciente_nombre}}, identificado con C.I. {{paciente_ci}}, autorizo de forma libre y voluntaria al Dr(a). {{doctor_nombre}} de {{clinica_nombre}} a realizar el procedimiento diagnóstico y terapéutico correspondiente...`,
        requiresPatientSignature: true,
        requiresDoctorSignature: true,
        isActive: true,
        isDefault: false,
      })
    }
  }, [editingTemplate, isOpen])

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setFormData(prev => ({ ...prev, content: prev.content + tag }))
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const previousText = formData.content
    const nextText = previousText.substring(0, start) + tag + previousText.substring(end)

    setFormData(prev => ({ ...prev, content: nextText }))

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 15)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return
    const ok = await onSave(formData)
    if (ok) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1060px] w-[95vw] bg-card text-foreground border border-border/80 rounded-[24px] p-0 shadow-2xl overflow-hidden">
        
        {/* CABECERA */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/15 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/25 shadow-xs">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
                {editingTemplate ? "Modificar Formato Clínico" : "Nueva Plantilla de Documento Clínico"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Define el clausulado legal e inserta variables inteligentes con un clic.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* CUERPO HORIZONTAL */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* COLUMNA IZQUIERDA (4 COLS): PARÁMETROS GENERALES */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3.5">
              {/* NOMBRE */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre de la Plantilla <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Consentimiento Exodoncia Simple"
                  className="h-10 text-xs font-semibold bg-background border-border focus-visible:ring-[#008bcd]"
                />
              </div>

              {/* TIPO */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Formato <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ClinicalDocType })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-[#008bcd]/20"
                >
                  {DOC_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* ÁREA / ESPECIALIDAD */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Área / Especialidad
                </Label>
                <Input
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ej: Cirugía Oral, Ortodoncia, General"
                  className="h-10 text-xs bg-background border-border"
                />
              </div>
            </div>

            {/* REGLAS LEGALES */}
            <div className="bg-muted/20 border border-border/70 rounded-xl p-3.5 space-y-2.5">
              <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Exigencias Legales
              </span>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Firma del Paciente</span>
                </div>
                <Switch
                  checked={formData.requiresPatientSignature}
                  onCheckedChange={(c) => setFormData({ ...formData, requiresPatientSignature: c })}
                  className="data-[state=checked]:bg-[#008bcd]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Firma del Odontólogo</span>
                </div>
                <Switch
                  checked={formData.requiresDoctorSignature}
                  onCheckedChange={(c) => setFormData({ ...formData, requiresDoctorSignature: c })}
                  className="data-[state=checked]:bg-[#008bcd]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs font-semibold">Plantilla por Defecto</span>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })}
                  className="data-[state=checked]:bg-[#008bcd]"
                />
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA (8 COLS): VARIABLES Y EDITOR */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            
            {/* CAMPOS INTELIGENTES (SCROLL SUAVE SIN BARRA CLÁSICA) */}
            <div className="bg-muted/15 border border-border/70 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Campos Inteligentes
                </span>
                <span className="text-[9px] text-muted-foreground">Clic para insertar en el cursor</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                {TEMPLATE_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => handleInsertTag(p.tag)}
                    title={p.description}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background hover:bg-[#008bcd]/15 hover:text-[#008bcd] hover:border-[#008bcd]/40 text-muted-foreground border border-border text-[10px] font-mono transition-all active:scale-95"
                  >
                    <Tag className="w-2.5 h-2.5 text-[#008bcd]" />
                    {p.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* EDITOR */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Cuerpo del Documento Oficial <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Redacte aquí el documento o use las etiquetas superiores..."
                className="w-full flex-1 min-h-[260px] text-xs leading-relaxed font-sans bg-background border-border rounded-xl p-3.5 focus-visible:ring-[#008bcd] resize-none"
              />
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex gap-3 sm:justify-between items-center">
          <p className="text-[10px] text-muted-foreground hidden sm:block font-medium">
            Las etiquetas entre <code className="text-[#008bcd] font-mono">{"{{...}}"}</code> se reemplazarán con los datos reales al emitir el documento.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="rounded-lg text-xs font-bold h-9 px-4 border-border hover:bg-muted w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.title.trim() || !formData.content.trim()}
              className="bg-[#008bcd] hover:bg-[#0073ab] text-white rounded-lg text-xs font-bold h-9 px-5 shadow-xs transition-all active:scale-95 w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              )}
              {editingTemplate ? "Guardar Cambios" : "Guardar Plantilla"}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}