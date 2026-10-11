"use client"

import React, { useState, useEffect } from "react"
import { FileText, Loader2, Check, ShieldCheck, BookOpen, ArrowRight, Sparkles, UserCheck, Stethoscope, User, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ClinicalDocType, DocumentTemplate, DocumentTemplateFormData } from "@/types/clinical-templates"
import { PREDEFINED_TEMPLATES, PredefinedTemplate } from "@/config/default-clinical-templates"
import { TemplateRichEditor } from "./template-rich-editor"
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

const PATIENT_VARIABLES = [
  { label: "Nombre", tag: "{{paciente_nombre}}", desc: "Nombre completo" },
  { label: "Cédula / C.I.", tag: "{{paciente_ci}}", desc: "Documento de identidad" },
  { label: "Edad", tag: "{{paciente_edad}}", desc: "Edad actual" },
  { label: "Teléfono", tag: "{{paciente_telefono}}", desc: "Teléfono de contacto" },
  { label: "Dirección", tag: "{{paciente_direccion}}", desc: "Domicilio" },
]

const CLINIC_VARIABLES = [
  { label: "Dr(a). Tratante", tag: "{{doctor_nombre}}", desc: "Nombre del profesional" },
  { label: "Especialidad", tag: "{{doctor_especialidad}}", desc: "Especialidad" },
  { label: "Clínica", tag: "{{clinica_nombre}}", desc: "Nombre de la clínica" },
  { label: "RUC", tag: "{{clinica_ruc}}", desc: "RUC" },
  { label: "Fecha Actual", tag: "{{fecha_actual}}", desc: "Fecha de emisión" },
]

export function DocumentTemplateModal({ isOpen, onClose, editingTemplate, isSaving, onSave }: DocumentTemplateModalProps) {
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
  
  const [tagToInsert, setTagToInsert] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

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
        content: `Por medio de la presente, yo, {{paciente_nombre}}, identificado con C.I. {{paciente_ci}}, autorizo de forma libre y voluntaria al Dr(a). {{doctor_nombre}} de {{clinica_nombre}} a realizar el procedimiento...`,
        requiresPatientSignature: true,
        requiresDoctorSignature: true,
        isActive: true,
        isDefault: false,
      })
    }
    setShowErrors(false)
  }, [editingTemplate, isOpen])

  const handleSubmit = async () => {
    setShowErrors(true)
    // OWASP A04: Prevención de guardado de datos vacíos o con solo espacios (Insecure Design)
    if (!formData.title.trim() || !formData.content.trim()) return
    
    // OWASP A03: Sanitización básica de título antes de enviar al backend
    const sanitizedData = {
      ...formData,
      title: formData.title.trim(),
      category: formData.category?.trim(),
      content: formData.content.trim()
    }
    
    const ok = await onSave(sanitizedData)
    if (ok) onClose()
  }

  const handleDragStart = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData("text/plain", tag)
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleInsertTagClick = (tag: string) => {
    setTagToInsert(tag)
    setTimeout(() => setTagToInsert(null), 50)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1100px] w-[96vw] max-h-[95vh] bg-background text-foreground border border-border/80 rounded-[24px] p-0 shadow-2xl overflow-hidden flex flex-col">
        
        {/* ENCABEZADO */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/10 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20 shadow-xs">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-foreground leading-none">
                {editingTemplate ? "Modificar Plantilla Clínica" : "Nueva Plantilla de Documento"}
              </DialogTitle>
              <p className="text-[11px] font-medium text-muted-foreground mt-1">
                Configura el documento base utilizando variables de sustitución inteligente.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* CUERPO A DOS COLUMNAS */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              
              {/* Inputs de Configuración */}
              <div className="space-y-4 bg-muted/15 p-4 rounded-2xl border border-border/60">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Título del Documento <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    maxLength={150} // OWASP Limit
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Consentimiento Exodoncia"
                    className={cn(
                      "h-10 text-xs font-bold bg-background",
                      showErrors && !formData.title.trim() ? "border-rose-500 focus-visible:ring-rose-500" : "border-border focus-visible:ring-[#008bcd]/50"
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tipo <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ClinicalDocType })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-[#008bcd]/30"
                    >
                      {DOC_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Especialidad
                    </Label>
                    <Input
                      value={formData.category || ""}
                      maxLength={50} // OWASP Limit
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ej: Cirugía"
                      className="h-10 text-xs font-bold bg-background border-border focus-visible:ring-[#008bcd]/50"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque de Variables Inteligentes (Rediseño Premium) */}
              <div className="border border-border/60 rounded-2xl p-4 space-y-4 bg-muted/10 shadow-xs flex-1">
                <div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#008bcd]" /> Variables Inteligentes
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1 font-medium">
                    Haz clic o arrastra las etiquetas al editor para automatizar el llenado del documento.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* PACIENTE */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-[#008bcd]" /> Datos del Paciente
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PATIENT_VARIABLES.map((p) => (
                        <button
                          key={p.tag}
                          type="button"
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, p.tag)}
                          onClick={() => handleInsertTagClick(p.tag)}
                          title={p.desc}
                          className="cursor-grab active:cursor-grabbing inline-flex items-center px-2.5 py-1 rounded-lg bg-background text-foreground border border-border/80 text-[10px] font-bold transition-all hover:border-[#008bcd]/50 hover:bg-[#008bcd]/5 hover:text-[#008bcd] shadow-2xs select-none"
                        >
                          <span className="text-[#008bcd] font-black mr-1">+</span> {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* CLÍNICA */}
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-emerald-500" /> Entidad y Médico
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CLINIC_VARIABLES.map((p) => (
                        <button
                          key={p.tag}
                          type="button"
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, p.tag)}
                          onClick={() => handleInsertTagClick(p.tag)}
                          title={p.desc}
                          className="cursor-grab active:cursor-grabbing inline-flex items-center px-2.5 py-1 rounded-lg bg-background text-foreground border border-border/80 text-[10px] font-bold transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-2xs select-none"
                        >
                          <span className="text-emerald-500 font-black mr-1">+</span> {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: EDITOR */}
            <div className="lg:col-span-8 h-full">
              <TemplateRichEditor
                content={formData.content}
                onChange={(newContent) => {
                  setFormData((prev) => ({ ...prev, content: newContent }))
                  if (showErrors) setShowErrors(false)
                }}
                insertTagTrigger={tagToInsert}
              />
              {showErrors && !formData.content.trim() && (
                <p className="text-[10px] text-rose-500 font-bold mt-2 text-right">El cuerpo del documento no puede estar vacío.</p>
              )}
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-[24px]">
          
          <div className="flex flex-wrap items-center gap-5 bg-background px-4 py-2 rounded-xl border border-border/60 shadow-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-[#008bcd]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Requerir Firmas:</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <Switch
                checked={formData.requiresPatientSignature}
                onCheckedChange={(c) => setFormData({ ...formData, requiresPatientSignature: c })}
                className="data-[state=checked]:bg-[#008bcd] scale-75 m-[-4px]"
              />
              <span className="text-xs font-bold text-foreground group-hover:text-[#008bcd] transition-colors">Paciente</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <Switch
                checked={formData.requiresDoctorSignature}
                onCheckedChange={(c) => setFormData({ ...formData, requiresDoctorSignature: c })}
                className="data-[state=checked]:bg-[#008bcd] scale-75 m-[-4px]"
              />
              <span className="text-xs font-bold text-foreground group-hover:text-[#008bcd] transition-colors">Doctor</span>
            </label>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })}
                className="data-[state=checked]:bg-emerald-500 scale-75 m-[-4px]"
              />
              <span className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">Predeterminada</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-10 px-5 border-border hover:bg-muted">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.title.trim() || !formData.content.trim()}
              className="bg-[#008bcd] hover:bg-[#0073ab] text-white rounded-xl text-xs font-bold h-10 px-6 shadow-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
              {editingTemplate ? "Guardar Cambios" : "Guardar Plantilla"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// 2. MODAL DE PLANTILLAS PREDEFINIDAS: PredefinedTemplatesModal
// ============================================================================

interface PredefinedTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (templateData: DocumentTemplateFormData) => Promise<boolean>
  isSaving: boolean
}

export function PredefinedTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  isSaving,
}: PredefinedTemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PredefinedTemplate>(
    PREDEFINED_TEMPLATES[0] || ({} as PredefinedTemplate)
  )

  useEffect(() => {
    if (isOpen && PREDEFINED_TEMPLATES.length > 0) {
      setSelectedTemplate(PREDEFINED_TEMPLATES[0])
    }
  }, [isOpen])

  const handleImport = async () => {
    if (!selectedTemplate?.title) return
    const { id, description, ...formData } = selectedTemplate
    const success = await onSelectTemplate(formData)
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1040px] w-[95vw] bg-card text-foreground border border-border/80 rounded-[24px] p-0 shadow-2xl overflow-hidden">
        
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/15 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/25 shadow-xs">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
                Biblioteca de Formatos y Consentimientos Precreados
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Selecciona un modelo avalado por la clínica e impórtalo directamente a tu catálogo institucional.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch min-h-[460px]">
          
          {/* LISTADO DE SELECCIÓN */}
          <div className="md:col-span-5 space-y-2.5 overflow-y-auto max-h-[460px] pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
            <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Formatos Disponibles
            </span>

            {PREDEFINED_TEMPLATES.map((item) => {
              const isSelected = selectedTemplate?.id === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTemplate(item)}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-1.5 text-left",
                    isSelected
                      ? "bg-[#008bcd]/10 border-[#008bcd] shadow-xs"
                      : "bg-background border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {item.category}
                    </span>
                    {isSelected && (
                      <span className="flex items-center text-[10px] font-bold text-[#008bcd] gap-1">
                        <Check className="w-3 h-3" /> Seleccionado
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* VISTA PREVIA */}
          <div className="md:col-span-7 bg-muted/10 border border-border/70 rounded-2xl p-4.5 flex flex-col justify-between">
            {selectedTemplate?.title ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#008bcd]">
                        {selectedTemplate.category}
                      </h3>
                      <h2 className="text-sm font-bold text-foreground">
                        {selectedTemplate.title}
                      </h2>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {selectedTemplate.type}
                    </Badge>
                  </div>

                  <div className="bg-background border border-border/60 rounded-xl p-3.5 max-h-[310px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-foreground select-text">
                      {selectedTemplate.content}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#008bcd]" /> Firma Paciente:{" "}
                    <strong className="text-foreground">{selectedTemplate.requiresPatientSignature ? "Sí" : "No"}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Firma Odontólogo:{" "}
                    <strong className="text-foreground">{selectedTemplate.requiresDoctorSignature ? "Sí" : "No"}</strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Selecciona una plantilla para previsualizar.
              </div>
            )}
          </div>

        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex gap-2 justify-end items-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-lg text-xs font-bold h-9 px-4"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isSaving || !selectedTemplate?.title}
            className="bg-[#008bcd] hover:bg-[#0073ab] text-white rounded-lg text-xs font-bold h-9 px-5 shadow-xs flex items-center gap-2 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            Importar esta Plantilla
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}