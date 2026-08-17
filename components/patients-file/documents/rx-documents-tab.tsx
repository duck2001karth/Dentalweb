"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { 
  UploadCloud, HelpCircle, FileText, Image as ImageIcon, 
  Download, Loader2, Trash2, CalendarIcon, Eye, AlertCircle, 
  X, User 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { documentStatuses } from "@/constants/status"

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const ALLOWED_DOC_TYPES = [
  "application/pdf", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
]
export function RxDocumentsTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const canDeleteDocs = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-notes?patientId=${patientId}`)
      const data = await res.json()
      const docsOnly = (data.clinicalNotes || data).filter((note: any) => note.type === "GENERAL" && note.fileUrl)
      setFiles(docsOnly)
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los documentos", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [patientId, toast])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(Array.from(e.dataTransfer.files))
  }
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(Array.from(e.target.files))
  }

  const processFiles = async (uploadedFiles: File[]) => {
    setIsUploading(true)
    
    const validFiles = uploadedFiles.filter(f => {
      const isTypeValid = ALLOWED_IMAGE_TYPES.includes(f.type) || ALLOWED_DOC_TYPES.includes(f.type)
      const isSizeValid = f.size <= MAX_FILE_SIZE_MB * 1024 * 1024
      return isTypeValid && isSizeValid
    })

    if (validFiles.length !== uploadedFiles.length) {
      toast({ title: "Archivo(s) omitidos", description: `Solo formatos válidos hasta ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" })
    }

    if (validFiles.length === 0) return setIsUploading(false)

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result;
        try {
          await fetch(`/api/clinical-notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: {
                type: "GENERAL",
                content: file.name, 
                patientId,
                authorId: currentUser?.id,
                fileUrl: base64String,
                status: documentStatuses.COMPLETED.value
              }
            })
          })
        } catch (error) {
          toast({ title: `Error al subir ${file.name}`, variant: "destructive" })
        }
      };
    }

    setTimeout(() => {
      setIsUploading(false)
      toast({ title: "¡Archivos guardados con éxito!", variant: "success" })
      fetchDocuments()
    }, 1500)
  }

  const handleDelete = async (id: string) => {
    if (!canDeleteDocs) return;
    try {
      await fetch(`/api/clinical-notes/${id}`, { method: "DELETE" })
      toast({ title: "Archivo eliminado", variant: "success" })
      fetchDocuments()
    } catch (error) {
      toast({ title: "Error al eliminar el archivo", variant: "destructive" })
    }
  }
  const groupedFiles = files.reduce((groups: any, file: any) => {
    const dateKey = format(new Date(file.createdAt), "dd 'de' MMMM, yyyy", { locale: es })
    const authorName = file.author?.name || "Profesional"
    const groupKey = `${dateKey}|${authorName}`

    if (!groups[groupKey]) {
      groups[groupKey] = { dateKey, authorName, items: [] }
    }
    groups[groupKey].items.push(file)
    return groups
  }, {})

  const groupedTimeline = Object.values(groupedFiles).sort((a: any, b: any) => 
    new Date(b.items[0].createdAt).getTime() - new Date(a.items[0].createdAt).getTime()
  ) as { dateKey: string, authorName: string, items: any[] }[]

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* LIGHTBOX */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden flex justify-center items-center">
          <DialogTitle className="sr-only">Visualizador de Documento</DialogTitle>
          {previewImage && (
            <div className="relative group">
              <img src={previewImage} alt="Documento ampliado" className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl bg-black/80 border border-white/10" />
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer">
                <X size={20} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Radiografías y Documentos
            </h2>
            {!canDeleteDocs && (
              <span className="text-[10px] font-bold tracking-widest bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 px-2 py-1 rounded-md inline-block">
                SIN PERMISO DE BORRADO
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Almacenamiento seguro sincronizado con el historial general del paciente.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-foreground font-bold hover:text-[#008bcd] hover:border-[#008bcd]/40 hover:bg-[#008bcd]/5 transition-colors rounded-xl h-11 px-5">
              <HelpCircle className="mr-2 w-4 h-4" /> Guía de archivos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border rounded-[24px] shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border/70 bg-muted/15">
              <DialogTitle className="text-xl font-bold text-foreground">Guía para subir documentos</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-border/80 rounded-2xl bg-background shadow-xs">
                <div className="space-y-2.5">
                  <h4 className="font-extrabold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                    <ImageIcon size={16} className="text-[#008bcd]"/> Formatos
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Aceptamos <span className="font-bold text-foreground">PNG, JPG, WEBP</span> para imágenes, y <span className="font-bold text-foreground">PDF, DOCX, XLSX</span> para documentos.
                  </p>
                </div>
                <div className="hidden md:block w-px bg-border/70"></div>
                <div className="space-y-2.5">
                  <h4 className="font-extrabold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                    <AlertCircle size={16} className="text-amber-500"/> Capacidad
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    El límite máximo por seguridad y optimización en la nube es de <span className="font-bold text-foreground">{MAX_FILE_SIZE_MB} MB</span> por archivo.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-muted/10 border-t border-border/70 flex justify-end">
              <DialogPrimitive.Close asChild>
                <Button className="bg-[#008bcd] text-white hover:bg-[#0070a8] font-bold rounded-xl px-6">Entendido</Button>
              </DialogPrimitive.Close>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <input type="file" multiple ref={fileInputRef} onChange={handleFileInput} className="hidden" accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx"/>

      {/* ZONA DE ARRASTRE */}
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={cn(
          "mb-12 border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
          isDragging ? "border-[#008bcd] bg-[#008bcd]/10 scale-[1.01] shadow-inner" : "border-border/80 bg-muted/10 hover:bg-muted/40 hover:border-[#008bcd]/40",
          isUploading ? "opacity-80 pointer-events-none" : "",
          files.length > 0 ? "min-h-[180px]" : "min-h-[350px]"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-[#008bcd] mb-4" size={50} />
            <h3 className="text-lg font-bold text-foreground">Sincronizando archivos...</h3>
            <p className="text-sm font-medium text-muted-foreground mt-1">Guardando en el historial clínico del paciente.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={cn("rounded-full flex items-center justify-center mb-5 transition-all duration-300 shadow-sm", isDragging ? "bg-[#008bcd] text-white p-5 scale-110" : "bg-background border border-border/80 text-[#008bcd] p-4 group-hover:scale-110 group-hover:shadow-md")}>
              <UploadCloud size={files.length > 0 ? 32 : 44} strokeWidth={2.5} />
            </div>
            <h3 className={cn("font-bold text-foreground tracking-tight", files.length > 0 ? "text-lg" : "text-2xl")}>
              Haz clic aquí o arrastra tus archivos
            </h3>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              Sube estudios e imágenes hasta <span className="font-bold text-foreground">{MAX_FILE_SIZE_MB}MB</span>
            </p>
          </div>
        )}
      </div>

      {/* RENDER DE ARCHIVOS / TIMELINE */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 className="animate-spin text-[#008bcd] w-10 h-10 mb-4"/>
          <p className="font-semibold text-muted-foreground">Cargando documentos...</p>
        </div>
      ) : groupedTimeline.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/80">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="font-bold text-xl text-foreground">No hay documentos registrados</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Sube el primer archivo usando el panel superior.</p>
        </div>
      ) : (
        <div className="relative pl-5 md:pl-10 max-w-6xl mx-auto">
          <div className="absolute left-[24px] md:left-[44px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-border via-border/80 to-transparent rounded-full"></div>

          {groupedTimeline.map((group, groupIndex) => (
            <div key={groupIndex} className="relative flex items-start mb-12 group/timeline">
              
              <div className="absolute left-0 md:left-0 top-4 w-4 h-4 rounded-full bg-card border-2 border-[#008bcd] shadow-sm z-10 group-hover/timeline:scale-125 transition-transform"></div>              
              
              <div className="ml-10 md:ml-12 flex-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-muted-foreground mb-4 bg-muted/20 w-fit px-4 py-2 rounded-xl border border-border/70 shadow-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <CalendarIcon size={14} className="text-[#008bcd]" /> {group.dateKey}
                  </div>
                  <div className="hidden sm:block w-[1px] h-3.5 bg-border/80"></div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-amber-500" /> Subido por {group.authorName}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {group.items.map((file) => {
                    const mimeType = file.fileUrl?.match(/data:(.*?);/)?.[1] || "";
                    const isImage = mimeType.startsWith("image/");
                    const ext = mimeType.split('/')[1]?.substring(0,4).toUpperCase() || 'FILE';
                    const estimatedSize = file.fileUrl ? ((file.fileUrl.length * 3) / 4 / (1024 * 1024)).toFixed(2) + " MB" : "--";

                    return (
                      <div key={file.id} className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col hover:shadow-md hover:border-[#008bcd]/40 transition-all h-[130px] group/card">
                        
                        <div className="flex h-full">
                          <div className="w-[110px] shrink-0 bg-muted/20 border-r border-border/60 flex items-center justify-center relative overflow-hidden group/img">
                            {isImage ? (
                              <>
                                <img src={file.fileUrl} alt="Documento" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-xs" onClick={() => setPreviewImage(file.fileUrl)}>
                                  <Eye className="text-white w-6 h-6" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full w-full bg-background group-hover/img:bg-blue-50/50 transition-colors">
                                <FileText size={32} className="mb-2 text-[#008bcd]/60" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#008bcd]">{ext}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0 bg-gradient-to-r from-transparent to-muted/5">
                            <div>
                              <h4 className="font-bold text-foreground text-xs leading-tight mb-1.5 line-clamp-2" title={file.content}>
                                {file.content || "Documento Adjunto"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="bg-muted border border-border/60 text-muted-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  {ext}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {estimatedSize}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <a href={file.fileUrl} download={file.content || "Documento"} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full h-7 text-[10px] font-bold bg-background hover:bg-[#008bcd]/10 hover:text-[#008bcd] border-border/80 transition-colors rounded-lg cursor-pointer">
                                  <Download size={12} className="mr-1.5" /> Descargar
                                </Button>
                              </a>
                              
                              {canDeleteDocs && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-8 h-7 p-0 bg-background text-red-500 hover:bg-red-500/10 hover:text-red-600 border-border/80 hover:border-red-200 rounded-lg transition-colors cursor-pointer">
                                      <Trash2 size={12} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-card border-border rounded-[24px]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-bold text-foreground flex items-center gap-2">
                                        <Trash2 className="w-5 h-5 text-red-500" /> ¿Eliminar documento?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="font-medium text-xs text-muted-foreground">
                                        Se eliminará permanentemente este archivo del historial.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-2">
                                      <AlertDialogCancel className="rounded-xl font-bold border-border">Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(file.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
                                        Eliminar Archivo
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}