"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { 
  UploadCloud, HelpCircle, FileText, Image as ImageIcon, 
  Download, Loader2, Trash2, CalendarIcon, Eye, AlertCircle, 
  X, User, FolderArchive, ShieldCheck, CheckCircle2, ScanLine
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

const MAX_FILE_SIZE_MB = 5
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
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const canDeleteDocs = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "ADMINISTRATION"
  
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
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los documentos.", variant: "destructive" })
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
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
      e.target.value = ""
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const processFiles = async (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter(f => {
      const isTypeValid = ALLOWED_IMAGE_TYPES.includes(f.type) || ALLOWED_DOC_TYPES.includes(f.type)
      const isSizeValid = f.size <= MAX_FILE_SIZE_MB * 1024 * 1024
      return isTypeValid && isSizeValid
    })

    if (validFiles.length !== uploadedFiles.length) {
      toast({ 
        title: "Archivo(s) omitidos", 
        description: `Solo se admiten imágenes o PDF/Office de hasta ${MAX_FILE_SIZE_MB} MB.`, 
        variant: "destructive" 
      })
    }

    if (validFiles.length === 0) return

    setIsUploading(true)

    try {
      await Promise.all(
        validFiles.map(async (file) => {
          const base64String = await convertFileToBase64(file)
          const res = await fetch(`/api/clinical-notes`, {
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
          if (!res.ok) throw new Error()
        })
      )

      toast({ 
        title: "¡Archivos guardados con éxito!", 
        description: `Se sincronizaron ${validFiles.length} documento(s) en el expediente.`, 
        variant: "success" as any 
      })
      fetchDocuments()
    } catch {
      toast({ title: "Error al guardar archivos", description: "Ocurrió un error durante la carga en la nube.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canDeleteDocs) return
    try {
      const res = await fetch(`/api/clinical-notes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Archivo eliminado", description: "El documento ha sido anulado del historial.", variant: "success" as any })
      fetchDocuments()
    } catch {
      toast({ title: "Error al eliminar", description: "No se pudo retirar el archivo.", variant: "destructive" })
    }
  }

  const groupedFiles = files.reduce((groups: any, file: any) => {
    const dateKey = format(new Date(file.createdAt), "dd 'de' MMMM, yyyy", { locale: es })
    const authorName = file.author?.name || "Especialista Asignado"
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
    <div className="animate-in fade-in duration-300 pb-20 space-y-6">
      
      {/* LIGHTBOX DE IMÁGENES */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden flex justify-center items-center">
          <DialogTitle className="sr-only">Visualizador de Documento</DialogTitle>
          {previewImage && (
            <div className="relative group">
              <img 
                src={previewImage} 
                alt="Documento ampliado" 
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

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-[#008bcd]" /> Radiografías y Documentos Clínicos
                </h2>
                {!canDeleteDocs && (
                  <span className="text-[10px] font-bold tracking-wider bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                    SÓLO LECTURA / CARGA
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Almacenamiento e historial cronológico de estudios y archivos adjuntos del paciente.
              </p>
            </div>
          </div>
        </div>

        {/* MODAL GUÍA DE ARCHIVOS MEJORADO */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-10 px-4 rounded-xl border border-border/80 bg-card text-foreground text-xs font-bold shadow-2xs transition-all cursor-pointer hover:bg-[var(--doctor-accent,#008bcd)]/10 hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
            >
              <HelpCircle className="mr-2 w-4 h-4 text-[var(--doctor-accent,#008bcd)]" /> 
              Guía de archivos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[680px] bg-card border border-border/80 rounded-2xl shadow-xl p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border/70 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 flex items-center justify-center text-[#008bcd]">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Guía de Carga y Especificaciones Clínicas
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium">
                    Lineamientos para el almacenamiento seguro de archivos en la nube.
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarjeta 1: Formatos */}
              <div className="p-4 rounded-xl border border-border/70 bg-background flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
                    <ImageIcon size={18} />
                  </div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Formatos</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Imágenes radiográficas y clínicas: <b className="text-foreground">PNG, JPG, WEBP</b>.<br />
                    Informes: <b className="text-foreground">PDF, DOCX, XLSX</b>.
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#008bcd]">
                  <CheckCircle2 size={12} /> Compatibilidad amplia
                </span>
              </div>

              {/* Tarjeta 2: Capacidad */}
              <div className="p-4 rounded-xl border border-border/70 bg-background flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <AlertCircle size={18} />
                  </div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Límite de Tamaño</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Máximo permitido de <b className="text-foreground">{MAX_FILE_SIZE_MB} MB</b> por archivo individual para garantizar agilidad en la apertura.
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <CheckCircle2 size={12} /> Optimización en nube
                </span>
              </div>

              {/* Tarjeta 3: Seguridad */}
              <div className="p-4 rounded-xl border border-border/70 bg-background flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Expediente Seguro</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Todos los archivos quedan ligados al historial médico del paciente con registro de fecha y profesional responsable.
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} /> Trazabilidad legal
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-muted/20 border-t border-border/70 flex justify-end">
              <DialogPrimitive.Close asChild>
                <Button className="bg-primary text-white hover:bg-[#0070a8] text-xs font-bold rounded-xl px-5 h-9 cursor-pointer">
                  Entendido
                </Button>
              </DialogPrimitive.Close>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
        accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx"
      />

      {/* ZONA DE ARRASTRE */}
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
          isDragging 
            ? "border-[#008bcd] bg-[#008bcd]/10 scale-[1.01] shadow-xs" 
            : "border-border/80 bg-muted/10 hover:bg-muted/30 hover:border-[#008bcd]/40",
          isUploading && "opacity-80 pointer-events-none",
          files.length > 0 ? "min-h-[160px]" : "min-h-[280px]"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="animate-spin text-[#008bcd] mb-3" size={42} />
            <h3 className="text-base font-bold text-foreground">Sincronizando archivos...</h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">Guardando de forma segura en el expediente del paciente.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={cn(
              "rounded-2xl flex items-center justify-center mb-4 transition-all duration-300", 
              isDragging 
                ? "bg-[#008bcd] text-white p-4 scale-110 shadow-md" 
                : "bg-background border border-border/80 text-[#008bcd] p-3.5 group-hover:scale-110 group-hover:border-[#008bcd]/40 shadow-xs"
            )}>
              <UploadCloud size={files.length > 0 ? 28 : 36} strokeWidth={2.2} />
            </div>
            <h3 className={cn("font-bold text-foreground tracking-tight", files.length > 0 ? "text-base" : "text-lg")}>
              Haz clic para seleccionar o arrastra tus archivos aquí
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1.5">
              Radiografías periapicales, panorámicas o documentos clínicos de hasta <span className="font-bold text-foreground">{MAX_FILE_SIZE_MB} MB</span>.
            </p>
          </div>
        )}
      </div>

      {/* TIMELINE DE ARCHIVOS */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 text-[#008bcd]">
          <Loader2 className="animate-spin w-9 h-9 mb-3"/>
          <p className="text-xs font-semibold text-muted-foreground">Cargando documentos...</p>
        </div>
      ) : groupedTimeline.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/70 rounded-2xl p-8">
          <div className="w-14 h-14 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-border/80 text-muted-foreground/60">
            <FolderArchive className="w-7 h-7" />
          </div>
          <p className="font-bold text-base text-foreground">No hay documentos registrados</p>
          <p className="text-xs font-medium text-muted-foreground mt-1">Sube la primera radiografía o estudio utilizando la zona superior.</p>
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-8 max-w-6xl mx-auto pt-2">
          {/* Línea conectora de la línea de tiempo */}
          <div className="absolute left-[18px] sm:left-[34px] top-4 bottom-0 w-px bg-gradient-to-b from-[#008bcd]/60 via-border/80 to-transparent" />

          {groupedTimeline.map((group, groupIndex) => (
            <div key={groupIndex} className="relative flex items-start mb-10 group/timeline">
              <div className="absolute left-0 sm:left-4 top-2.5 w-3.5 h-3.5 rounded-full bg-background border-2 border-[#008bcd] shadow-2xs z-10 group-hover/timeline:scale-125 transition-transform" />
              
              <div className="ml-8 sm:ml-12 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-muted-foreground mb-3 bg-card w-fit px-3.5 py-1.5 rounded-xl border border-border/70 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <CalendarIcon size={13} className="text-[#008bcd]" /> {group.dateKey}
                  </div>
                  <div className="hidden sm:block w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-amber-500" /> {group.authorName}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.items.map((file) => {
                    const mimeType = file.fileUrl?.match(/data:(.*?);/)?.[1] || ""
                    const isImage = mimeType.startsWith("image/")
                    const ext = mimeType.split('/')[1]?.substring(0,4).toUpperCase() || 'FILE'
                    const estimatedSize = file.fileUrl ? ((file.fileUrl.length * 3) / 4 / (1024 * 1024)).toFixed(2) + " MB" : "--"

                    return (
                      <div 
                        key={file.id} 
                        className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col hover:border-[#008bcd]/40 hover:shadow-sm transition-all h-[124px] group/card"
                      >
                        <div className="flex h-full">
                          {/* Miniatura / Ícono */}
                          <div className="w-[104px] shrink-0 bg-muted/20 border-r border-border/60 flex items-center justify-center relative overflow-hidden group/img">
                            {isImage ? (
                              <>
                                <img 
                                  src={file.fileUrl} 
                                  alt="Miniatura del documento" 
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                                />
                                <div 
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-2xs" 
                                  onClick={() => setPreviewImage(file.fileUrl)}
                                  title="Ver imagen en tamaño completo"
                                >
                                  <Eye className="text-white w-5 h-5" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full w-full bg-muted/10 group-hover/img:bg-[#008bcd]/5 transition-colors">
                                <FileText size={28} className="mb-1 text-[#008bcd]/70" />
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#008bcd]">{ext}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Detalles del archivo */}
                          <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-bold text-foreground text-xs leading-snug line-clamp-2" title={file.content}>
                                {file.content || "Documento Clínico"}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="bg-muted border border-border/60 text-muted-foreground text-[9px] font-bold font-mono px-1.5 py-0.5 rounded">
                                  {ext}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {estimatedSize}
                                </span>
                              </div>
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <a href={file.fileUrl} download={file.content || "Documento"} className="flex-1">
                               <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                className="w-full h-7 text-[10px] font-bold border border-border/80 bg-card text-foreground rounded-lg shadow-2xs transition-all cursor-pointer hover:bg-[var(--doctor-accent,#008bcd)]/10 hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
                              >
                                <Download size={11} className="mr-1 text-[var(--doctor-accent,#008bcd)] transition-colors shrink-0" />
                                <span>Descargar</span>
                              </Button>
                              </a>
                              
                              {canDeleteDocs && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-7 h-7 p-0 bg-background text-destructive/80 hover:text-destructive hover:bg-destructive/10 border-border/80 hover:border-destructive/30 rounded-lg cursor-pointer"
                                      title="Eliminar archivo"
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-card border-border/80 rounded-2xl sm:max-w-[400px]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-bold text-base text-foreground flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-destructive" /> ¿Eliminar documento?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs text-muted-foreground mt-1.5">
                                        Esta acción eliminará de forma permanente el archivo del expediente del paciente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-3 gap-2">
                                      <AlertDialogCancel className="rounded-xl text-xs font-bold border-border/80 cursor-pointer">
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDelete(file.id)} 
                                        className="bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs font-bold cursor-pointer"
                                      >
                                        Sí, Eliminar
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