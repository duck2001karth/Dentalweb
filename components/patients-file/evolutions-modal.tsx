"use client"

import React from "react"
import { FileText, Loader2, Save, UploadCloud, X, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "@/components/patients-file/signature-pad"

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
}

export function EvolutionModal({
  isOpen, onOpenChange, editingId, noteContent, setNoteContent,
  fileBase64, setFileBase64, fileName, setFileName,
  setProfSignature, setPatientSignature, onSave, isWorking, handleImageUpload
}: EvolutionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background border-border max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#008bcd] dark:text-blue-400" />
            {editingId ? "Editar Evolución" : "Agregar Nueva Evolución"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingId ? "Modifica los datos del registro clínico." : "Registra los procedimientos y adjunta firmas digitales e imágenes."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Detalle de la evolución</Label>
            <textarea 
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008bcd]"
              placeholder="Ej: Paciente acude a consulta para profilaxis general..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Adjuntar imagen (Opcional)</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button variant="outline" className="relative border-dashed border-2 hover:bg-muted/50 overflow-hidden shrink-0 rounded-xl">
                <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud className="w-4 h-4 mr-2 text-muted-foreground" />
                {fileName ? 'Cambiar imagen' : 'Seleccionar archivo'}
              </Button>
              {fileBase64 && (
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 pr-3 rounded-xl border border-border">
                  <img src={fileBase64} alt="Preview" className="w-8 h-8 object-cover rounded shadow-sm" />
                  <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{fileName}</span>
                  <button type="button" onClick={() => { setFileBase64(null); setFileName(null); }} className="ml-2 text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
                </div>
              )}
            </div>
          </div>

          {!editingId && (
            <div className="pt-4 border-t border-border">
              <Label className="text-foreground font-semibold mb-3 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#008bcd]" /> Firmas Digitales del Acto Médico
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SignaturePad label="Firma del Profesional" onSign={setProfSignature} onClear={() => setProfSignature(null)} />
                <SignaturePad label="Firma del Paciente" onSign={setPatientSignature} onClear={() => setPatientSignature(null)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background text-foreground hover:bg-accent border-border rounded-xl">Cancelar</Button>
          <Button onClick={onSave} disabled={isWorking || !noteContent.trim()} className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl font-bold">
            {isWorking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {editingId ? "Actualizar" : "Guardar Evolución"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}