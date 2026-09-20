"use client"

import React, { useState, useEffect } from "react"
import { UploadCloud, FileText, Loader2, Eye, Image as ImageIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

export function DocumentsCard({ patient }: { patient: any }) {
  const router = useRouter()
  const [patientDocuments, setPatientDocuments] = useState<any[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (!patient?.id) return
    const fetchDocs = async () => {
      setIsLoadingDocs(true)
      try {
        const res = await fetch(`/api/clinical-notes?patientId=${patient.id}`)
        if (res.ok) {
          const data = await res.json()
          const notes = data.clinicalNotes || data
          const docsOnly = Array.isArray(notes) 
            ? notes.filter((note: any) => note.type === "GENERAL" && note.fileUrl)
            : []
          setPatientDocuments(docsOnly)
        }
      } catch (err) {
        console.error("Error al cargar archivos:", err)
      } finally {
        setIsLoadingDocs(false)
      }
    }
    fetchDocs()
  }, [patient?.id])

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName || 'documento_clinico'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCardClick = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return
    const mimeType = fileUrl.match(/data:(.*?);/)?.[1] || ""
    const isImage = mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(fileName)
    
    if (isImage) {
      setPreviewImage(fileUrl)
    } else {
      handleDownload(fileUrl, fileName)
    }
  }

  const formatFileSize = (base64Url?: string) => {
    if (!base64Url) return ""
    try {
      const sizeBytes = (base64Url.length * 3) / 4
      if (sizeBytes < 1024 * 1024) {
        return `${Math.round(sizeBytes / 1024)}kb`
      }
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)}mb`
    } catch {
      return ""
    }
  }

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden flex justify-center items-center">
          <DialogTitle className="sr-only">Visualizador de Imagen</DialogTitle>
          {previewImage && (
            <div className="relative group">
              <img 
                src={previewImage} 
                alt="Imagen ampliada" 
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl bg-black/90 border border-white/10" 
              />
              <button 
                onClick={() => setPreviewImage(null)} 
                className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                title="Cerrar vista previa"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-card border border-border/85 rounded-[24px] p-5 shadow-xs flex flex-col font-sans">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground">Archivos / Documentos</h3>
          
          <button 
            type="button" 
            onClick={() => router.push("?tab=rx")} 
            className="text-xs font-bold text-[#008bcd] flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Subir archivo
          </button>
        </div>

        <div className="space-y-2.5 max-h-[195px] overflow-y-auto custom-scrollbar pr-1">
          {isLoadingDocs ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[#008bcd]" />
            </div>
          ) : patientDocuments.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border/80 rounded-xl bg-muted/20">
              <FileText className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Sin radiografías o archivos adjuntos</p>
            </div>
          ) : (
            patientDocuments.map((doc: any) => {
              const fileName = doc.content || "Documento Clínico"
              const fileSize = formatFileSize(doc.fileUrl)
              
              const mimeType = doc.fileUrl?.match(/data:(.*?);/)?.[1] || ""
              const isImage = mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(fileName)
              const ext = mimeType.split('/')[1]?.toUpperCase() || (fileName.endsWith('.pdf') ? 'PDF' : 'FILE')

              return (
                <div 
                  key={doc.id} 
                  onClick={() => handleCardClick(doc.fileUrl, fileName)}
                  className="flex items-center justify-between p-3.5 bg-muted/20 rounded-2xl border border-border/70 hover:border-[#008bcd]/50 hover:bg-muted/40 transition-all cursor-pointer group gap-3"
                  title={isImage ? "Hacer clic para ver la imagen" : "Hacer clic para descargar PDF"}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-background border border-border/70 flex items-center justify-center text-muted-foreground shrink-0 shadow-xs group-hover:border-[#008bcd]">
                      {isImage ? <ImageIcon className="w-4 h-4 text-[#008bcd]" /> : <FileText className="w-4 h-4 text-[#008bcd]" />}
                    </div>
                    
                    <div className="truncate flex-1">
                      <span className="text-xs font-semibold text-foreground truncate block group-hover:text-[#008bcd] transition-colors">
                        {fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase">
                        {ext}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {fileSize && (
                      <span className="text-[11px] font-medium text-muted-foreground font-mono">
                        {fileSize}
                      </span>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-xl text-muted-foreground group-hover:text-[#008bcd] group-hover:bg-[#008bcd]/10 transition-colors pointer-events-none"
                    >
                      {isImage ? <Eye className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}