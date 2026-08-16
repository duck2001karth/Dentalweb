"use client"

import React from "react"
import { FileText, Loader2, Save, UploadCloud, X, PenTool, CheckCircle2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "@/components/patients-file/signature-pad"
import { treatmentStatuses } from "@/constants/status"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EvolutionModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  noteContent: string
  setNoteContent: (val: string) => void
  fileBase64: string | null
  setFileBase64: (val: string | null) => void
  fileName: string | null
  setFileName: (val: string | null) => void
  setProfSignature: (val: string | null) => void
  setPatientSignature: (val: string | null) => void
  onSave: () => void
  isWorking: boolean
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  status: string
  setStatus: (status: string) => void
}

export function EvolutionModal({
  isOpen,
  onOpenChange,
  editingId,
  noteContent,
  setNoteContent,
  fileBase64,
  setFileBase64,
  fileName,
  setFileName,
  setProfSignature,
  setPatientSignature,
  onSave,
  isWorking,
  handleImageUpload,
  status,
  setStatus,
}: EvolutionModalProps) {
  const currentStatusConfig = treatmentStatuses[status] || treatmentStatuses.IN_PROGRESS
  const CurrentIcon = currentStatusConfig.icon

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[940px] w-[95vw] bg-card text-foreground border border-border/80 rounded-[24px] shadow-2xl p-0 overflow-hidden font-sans">
        
        {/* CABECERA */}
        <DialogHeader className="px-7 py-4.5 border-b border-border/70 bg-muted/20 flex flex-row items-center gap-3 text-left">
          <div className="p-2.5 bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8] rounded-2xl shrink-0 border border-[#008bcd]/20">
            <FileText className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {editingId ? "Editar Evolución Clínica" : "Registrar Nueva Evolución Clínica"}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
              {editingId 
                ? "Actualiza las anotaciones y el estado del tratamiento." 
                : "Detalla el procedimiento clínico realizado y captura las firmas de conformidad."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* CONTENEDOR HORIZONTAL */}
        <div className="p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA: NOTAS + ESTADO (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Detalle de la Evolución / Acto Clínico *
                </Label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="flex min-h-[170px] w-full rounded-xl border border-input bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#008bcd] resize-none"
                  placeholder="Ej: Se realiza obturación con resina compuesta en pieza 16 cara oclusal bajo aislamiento absoluto. Paciente refiere buena tolerancia..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SELECTOR DE ESTADO */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Estado del Tratamiento
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 rounded-xl bg-background border-input text-xs font-bold">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <CurrentIcon className={`w-4 h-4 ${currentStatusConfig.color}`} />
                          <span className={currentStatusConfig.color}>{currentStatusConfig.label}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.values(treatmentStatuses).map((s) => {
                        const Icon = s.icon
                        return (
                          <SelectItem key={s.value} value={s.value} className="text-xs font-semibold py-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${s.color}`} />
                              <span className={s.color}>{s.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* ADJUNTAR ARCHIVO */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Evidencia Fotográfica
                  </Label>
                  <div className="relative">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-10 border-dashed border-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted/40 overflow-hidden relative cursor-pointer"
                    >
                      <input 
                        type="file" 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      <UploadCloud className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{fileName || "Subir foto clínica"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* PREVIEW DE IMAGEN CARGADA */}
              {fileBase64 && (
                <div className="flex items-center justify-between bg-muted/40 p-2 px-3 rounded-xl border border-border/80 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <img src={fileBase64} alt="Preview" className="w-8 h-8 object-cover rounded-lg shadow-2xs border border-border shrink-0" />
                    <span className="font-semibold text-foreground truncate max-w-[200px]">{fileName || "Imagen seleccionada"}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setFileBase64(null); setFileName(null); }} 
                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

            </div>

            {/* COLUMNA DERECHA: FIRMAS DIGITALES (5 COLS) */}
            <div className="lg:col-span-5 bg-muted/15 border border-border/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider">
                <PenTool className="w-3.5 h-3.5 text-[#008bcd]" />
                Firmas Digitales
              </div>

              {!editingId ? (
                <div className="space-y-3">
                  <SignaturePad 
                    label="Firma del Profesional" 
                    onSign={setProfSignature} 
                    onClear={() => setProfSignature(null)} 
                  />
                  <SignaturePad 
                    label="Firma del Paciente / Tutor" 
                    onSign={setPatientSignature} 
                    onClear={() => setPatientSignature(null)} 
                  />
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground bg-background rounded-xl border border-border/60">
                  <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  Las firmas registradas en la creación se conservan intactas por motivos de auditoría clínica.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-7 py-4 border-t border-border/70 bg-muted/10 flex flex-row items-center justify-end gap-2.5">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl text-xs font-bold h-10 px-5 hover:bg-muted cursor-pointer"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={onSave} 
            disabled={isWorking || !noteContent.trim()} 
            className="bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-xl text-xs font-bold h-10 px-6 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            {isWorking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            )}
            {editingId ? "Actualizar Evolución" : "Guardar Evolución"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}