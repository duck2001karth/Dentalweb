"use client"

import React, { useState } from "react"
import { 
  FileText, Plus, Search, Filter, Edit3, Trash2, 
  UserCheck, Stethoscope, Sparkles, BookOpen, Eye 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { useDocumentTemplates } from "@/hooks/use-document-templates"
import { DocumentTemplateModal, PredefinedTemplatesModal } from "./templates-modal"
import { DocumentTemplate, ClinicalDocType } from "@/types/clinical-templates"
import { cn } from "@/lib/utils"

const TYPE_BADGES: Record<ClinicalDocType, { label: string; color: string }> = {
  CONSENT: { label: "Consentimiento", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  CERTIFICATE: { label: "Certificado", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PRESCRIPTION: { label: "Receta", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  REPORT: { label: "Informe", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  AUTHORIZATION: { label: "Autorización", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  INSTRUCTIONS: { label: "Cuidados Post", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
}

export function TemplatesView() {
  const { 
    templates, 
    isLoading, 
    isSaving, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useDocumentTemplates()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPredefinedOpen, setIsPredefinedOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch = 
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.category && tpl.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tpl.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedType === "ALL" || tpl.type === selectedType
    return matchesSearch && matchesType
  })

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (tpl: DocumentTemplate) => {
    setEditingTemplate(tpl)
    setIsModalOpen(true)
  }

  const handleSave = async (formData: any) => {
    if (editingTemplate) {
      return await updateTemplate(editingTemplate.id, formData)
    } else {
      return await createTemplate(formData)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    const ok = await deleteTemplate(deletingId)
    if (ok) setDeletingId(null)
  }

  return (
    <div className="p-6 md:p-8 space-y-6 w-full">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#008bcd]">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">Gestión Clínica Institucional</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mt-1">
            Plantillas y Consentimientos
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Formatos legales predefinidos con sustitución de variables para recetas, reposos e intervenciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPredefinedOpen(true)}
            className="border-[#008bcd]/30 text-[#008bcd] hover:bg-[#008bcd]/10 rounded-xl text-xs font-bold h-10 px-3.5 flex items-center gap-2 shrink-0 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Biblioteca Prediseñada
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-[#008bcd] hover:bg-[#0073ab] text-white rounded-xl text-xs font-bold h-10 px-4 shadow-sm shadow-[#008bcd]/20 flex items-center gap-2 shrink-0 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between w-full">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, categoría o texto..."
            className="pl-9 h-10 bg-background border-border text-xs rounded-xl focus-visible:ring-[#008bcd]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
          <div className="flex gap-1.5">
            {[
              { id: "ALL", label: "Todos" },
              { id: "CONSENT", label: "Consentimientos" },
              { id: "CERTIFICATE", label: "Certificados" },
              { id: "PRESCRIPTION", label: "Recetas" },
              { id: "REPORT", label: "Informes" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedType(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border",
                  selectedType === f.id
                    ? "bg-[#008bcd] text-white border-[#008bcd] shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTADO O VACÍO */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-48 bg-muted/20 border border-border/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="w-full border border-dashed border-border/70 rounded-2xl p-14 text-center flex flex-col items-center justify-center bg-card/20">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-3">
            <FileText className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No se encontraron plantillas</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery || selectedType !== "ALL"
              ? "Prueba cambiando los términos de búsqueda o el tipo de documento."
              : "Comienza importando un formato desde la biblioteca prediseñada."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredTemplates.map((tpl) => {
            const badge = TYPE_BADGES[tpl.type] || TYPE_BADGES.CONSENT

            return (
              <div
                key={tpl.id}
                className="bg-card border border-border/70 hover:border-[#008bcd]/50 transition-all rounded-2xl p-4.5 flex flex-col justify-between shadow-xs hover:shadow-md group relative overflow-hidden"
              >
                {tpl.isDefault && (
                  <span className="absolute top-0 right-0 bg-[#008bcd] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    Predeterminada
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", badge.color)}>
                      {badge.label}
                    </span>
                    {tpl.category && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {tpl.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-[#008bcd] transition-colors">
                    {tpl.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 mt-2 font-sans leading-relaxed">
                    {tpl.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                    <span className={cn("flex items-center gap-1", tpl.requiresPatientSignature ? "text-foreground font-semibold" : "opacity-40")}>
                      <UserCheck className="w-3.5 h-3.5 text-[#008bcd]" /> Paciente
                    </span>
                    <span className={cn("flex items-center gap-1", tpl.requiresDoctorSignature ? "text-foreground font-semibold" : "opacity-40")}>
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Doctor
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewTemplate(tpl)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                      title="Vista Previa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(tpl)}
                      className="h-8 w-8 text-muted-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 rounded-lg"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(tpl.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      <DocumentTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTemplate={editingTemplate}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {/* MODAL BIBLIOTECA PREDEFINIDA */}
      <PredefinedTemplatesModal
        isOpen={isPredefinedOpen}
        onClose={() => setIsPredefinedOpen(false)}
        onSelectTemplate={createTemplate}
        isSaving={isSaving}
      />

      {/* MODAL VISTA PREVIA */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
          <DialogContent className="sm:max-w-[700px] bg-card border border-border/80 rounded-[24px] p-6 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", TYPE_BADGES[previewTemplate.type].color)}>
                  {TYPE_BADGES[previewTemplate.type].label}
                </span>
                <DialogTitle className="text-base font-bold text-foreground">
                  {previewTemplate.title}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="mt-4 bg-muted/20 p-4 rounded-xl border border-border/60 max-h-[50vh] overflow-y-auto">
              <p className="text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap">
                {previewTemplate.content}
              </p>
            </div>

            <DialogFooter className="mt-4 flex justify-between items-center sm:justify-between">
              <span className="text-[11px] text-muted-foreground">
                Las variables entre <code className="text-[#008bcd] font-mono">{"{{...}}"}</code> se sustituyen al emitir el documento.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPreviewTemplate(null)}
                className="text-xs h-8 px-4 rounded-lg"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL ELIMINAR */}
      {deletingId && (
        <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
          <DialogContent className="sm:max-w-[400px] bg-card border border-border rounded-2xl p-5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-rose-500 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Eliminar Plantilla
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-2">
              ¿Estás seguro de que deseas eliminar este formato? Los documentos ya emitidos a pacientes conservarán su texto original.
            </p>
            <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeletingId(null)}
                className="text-xs h-8 rounded-lg"
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 rounded-lg"
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}