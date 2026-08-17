"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Image as ImageIcon, UploadCloud, Loader2, Check, CheckCircle2 } from "lucide-react"
import { documentStatuses } from "@/constants/status"

interface QuickDocumentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  authorId?: string
  editingNote?: any
  onSuccess: () => void | Promise<any>
}

export function QuickDocumentModal({
  isOpen,
  onOpenChange,
  patientId,
  authorId,
  editingNote,
  onSuccess,
}: QuickDocumentModalProps) {
  const [content, setContent] = useState("")
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setContent(editingNote?.content || "")
      setFileBase64(editingNote?.fileUrl || null)
      setFileName(editingNote?.fileUrl ? "Documento previo adjunto" : null)
    }
  }, [isOpen, editingNote])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFileBase64(reader.result as string)
        if (!content) setContent(`${file.name}`)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!fileBase64 && !content) return
    setIsSaving(true)
    try {
      if (editingNote) {
        await fetch(`/api/clinical-notes/${editingNote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: {
              content,
              fileUrl: fileBase64,
              status: documentStatuses.COMPLETED.value,
            },
          }),
        })
      } else {
        await fetch("/api/clinical-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: {
              type: "GENERAL",
              content: content || fileName || "Documento Adjunto",
              patientId,
              authorId,
              fileUrl: fileBase64,
              status: documentStatuses.COMPLETED.value,
            },
          }),
        })
      }
      onSuccess()
      onOpenChange(false)
      setContent("")
      setFileBase64(null)
      setFileName(null)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-[24px] shadow-2xl p-0 overflow-hidden font-sans">
        <DialogHeader className="px-6 py-4 border-b border-border/70 bg-muted/15">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ImageIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {editingNote ? "Editar Documento/Rx" : "Subir Documento o Radiografía"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Adjunta archivos al historial clínico del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="relative border-2 border-dashed border-border/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/40 transition-colors cursor-pointer group">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {fileBase64 ? (
              <div className="flex flex-col items-center z-0 relative">
                <Check className="w-9 h-9 text-emerald-500 mb-1.5" />
                <p className="font-bold text-foreground text-sm truncate max-w-[280px]">
                  {fileName || "Archivo adjunto listo"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 group-hover:underline">
                  Click para cambiar archivo
                </p>
              </div>
            ) : (
              <div className="z-0 relative">
                <UploadCloud className="w-9 h-9 text-muted-foreground mb-2 mx-auto group-hover:text-teal-500 transition-colors" />
                <p className="font-bold text-foreground text-sm">
                  Haz clic o arrastra para subir
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Imágenes o PDF (Máx. 5MB)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Descripción del documento
            </Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ej: Radiografía panorámica inicial..."
              className="h-10 rounded-xl bg-background text-xs font-medium"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/70 bg-muted/10 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-5"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!fileBase64 && !content.trim())}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold h-10 px-6 shadow-xs flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            )}
            Guardar Archivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}