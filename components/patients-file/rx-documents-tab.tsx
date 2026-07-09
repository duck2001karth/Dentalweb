"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { UploadCloud, HelpCircle, FileText, Image as ImageIcon, File, Download, Loader2, Trash2, CalendarIcon, Eye, AlertCircle, X, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"]
const ALLOWED_DOC_TYPES = [
  "application/pdf", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
]

export function RxDocumentsTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // --- REGLAS DE SEGURIDAD POR ROL ---
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
      const res = await fetch(`/api/documents?patientId=${patientId}`)
      const data = await res.json()
      setFiles(data || [])
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
      toast({ title: "Archivo(s) omitidos", description: `Solo se admiten formatos válidos hasta ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" })
    }

    if (validFiles.length === 0) return setIsUploading(false)

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result;
        try {
          await fetch(`/api/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              name: file.name,
              type: file.type,
              size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
              url: base64String,
              authorId: currentUser?.id // Registra quién lo subió (Recepcionista o Doctor)
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
    if (!canDeleteDocs) return; // Bloqueo de seguridad adicional

    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" })
      toast({ title: "Archivo eliminado", variant: "success" })
      fetchDocuments()
    } catch (error) {
      toast({ title: "Error al eliminar el archivo", variant: "destructive" })
    }
  }

  // --- LÓGICA DE AGRUPACIÓN POR FECHA Y DOCTOR ---
  const groupedFiles = files.reduce((groups: any, file: any) => {
    const dateKey = format(new Date(file.createdAt), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })
    const authorName = file.author?.name || "Administrador"
    const groupKey = `${dateKey}|${authorName}`

    if (!groups[groupKey]) {
      groups[groupKey] = { dateKey, authorName, items: [] }
    }
    groups[groupKey].items.push(file)
    return groups
  }, {})

  const groupedTimeline = Object.values(groupedFiles) as { dateKey: string, authorName: string, items: any[] }[]

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#008bcd] w-10 h-10"/></div>

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">Visualizador de Documento</DialogTitle>
          {previewImage && (
            <div className="relative group">
              <img src={previewImage} alt="Documento ampliado" className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl bg-black/80" />
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"><X size={24} /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-light text-foreground">Rx y Documentos</h2>
            {!canDeleteDocs && (
             <span className="text-[10px] font-bold tracking-widest bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md inline-block">
               SIN PERMISO DE BORRADO
             </span>
            )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-[#008bcd] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <HelpCircle className="mr-2" size={18} /> Guía de archivos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-card border-border">
            <DialogHeader><DialogTitle className="text-xl font-bold">Guía para subir documentos</DialogTitle></DialogHeader>
            <div className="flex flex-col md:flex-row gap-6 p-5 border border-border rounded-xl bg-muted/30 mt-2">
              <div className="flex-1 space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-foreground"><ImageIcon size={18} className="text-[#008bcd]"/> Formatos permitidos</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">Se acepta <span className="font-semibold text-foreground">PNG, JPG, JPEG</span> para radiografías, y <span className="font-semibold text-foreground">PDF, DOCX, XLSX</span> para historial médico.</p>
              </div>
              <div className="hidden md:block w-px bg-border"></div>
              <div className="flex-1 space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-foreground"><AlertCircle size={18} className="text-amber-500"/> Peso máximo</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">Para optimizar el almacenamiento, cada archivo no debe exceder los <span className="font-bold text-foreground">{MAX_FILE_SIZE_MB} MB</span>.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4"><DialogPrimitive.Close asChild><Button variant="outline">Entendido</Button></DialogPrimitive.Close></div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Input Oculto */}
      <input type="file" multiple ref={fileInputRef} onChange={handleFileInput} className="hidden" accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx"/>

      {/* Zona de Arrastre (Disponible para todos los roles) */}
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={cn(
          "mb-10 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
          isDragging ? "border-[#008bcd] bg-[#008bcd]/5 scale-[1.01]" : "border-border bg-card hover:bg-muted/50",
          isUploading ? "opacity-70 pointer-events-none" : "",
          files.length > 0 ? "min-h-[160px]" : "min-h-[400px] mt-12"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="animate-spin text-[#008bcd] mb-4" size={48} />
            <h3 className="text-lg font-medium text-foreground">Subiendo y procesando archivos...</h3>
            <p className="text-sm text-muted-foreground mt-1">Por favor espera un momento</p>
          </>
        ) : (
          <>
            <div className={cn("rounded-full flex items-center justify-center mb-4 transition-colors", isDragging ? "bg-[#008bcd] text-white p-4" : "bg-muted text-muted-foreground p-3")}><UploadCloud size={files.length > 0 ? 32 : 48} /></div>
            <h3 className={cn("font-medium text-foreground", files.length > 0 ? "text-lg" : "text-xl font-light")}>Haz clic aquí o arrastra tus archivos</h3>
            <p className="text-sm text-muted-foreground mt-2">Soporta imágenes y documentos hasta <span className="font-semibold">{MAX_FILE_SIZE_MB}MB</span></p>
          </>
        )}
      </div>

      {/* LÍNEA DE TIEMPO AGRUPADA */}
      {groupedTimeline.length > 0 && (
        <div className="relative pl-4 md:pl-8 max-w-5xl mx-auto">
          <div className="absolute left-[20px] md:left-[39px] top-4 bottom-0 w-0.5 bg-border rounded-full"></div>

          {groupedTimeline.map((group, groupIndex) => (
            <div key={groupIndex} className="relative flex items-start mb-12 group/timeline">
              
              {/* Nodo azul de la línea de tiempo */}
              <div className="absolute left-0 md:left-2 top-4 w-3.5 h-3.5 rounded-full bg-[#008bcd] ring-4 ring-background shadow-sm z-10 group-hover/timeline:scale-125 transition-transform"></div>              
              <div className="ml-10 md:ml-14 flex-1">
                {/* Cabecera del Grupo: Fecha y Doctor */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-muted-foreground mb-4 bg-muted/30 w-fit px-4 py-1.5 rounded-full border border-border">
                  <div className="flex items-center gap-2"><CalendarIcon size={14} className="text-[#008bcd]" /> {group.dateKey}</div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-border"></div>
                  <div className="flex items-center gap-2 text-foreground"><User size={14} className="text-[#008bcd]" /> Subido por {group.authorName}</div>
                </div>

                {/* Grid de archivos pertenecientes a este grupo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {group.items.map((file) => {
                    const isImage = file.type.startsWith("image/")
                    return (
                      <div key={file.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex hover:border-[#008bcd]/50 transition-colors h-28">
                        {/* Miniatura */}
                        <div className="w-28 shrink-0 bg-muted/30 border-r border-border flex items-center justify-center relative overflow-hidden group/img">
                          {isImage ? (
                            <>
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]" onClick={() => setPreviewImage(file.url)}>
                                <Eye className="text-white w-8 h-8" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-slate-400">
                              <FileText size={32} className="mb-1 text-[#008bcd]/60" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">{file.type.split('/')[1]?.substring(0,4) || 'DOC'}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Detalles y Acciones */}
                        <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h4 className="font-bold text-foreground text-sm mb-1 truncate" title={file.name}>{file.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{file.type.split('/')[1] || 'Archivo'}</span>
                              <span className="text-xs text-muted-foreground">Peso: {file.size}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <a href={file.url} download={file.name} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full h-7 text-xs bg-background hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#008bcd] hover:border-[#008bcd]/50 transition-colors">
                                <Download size={12} className="mr-2" /> Descargar
                              </Button>
                            </a>
                            
                            {/* BOTÓN ELIMINAR PROTEGIDO: Solo DOCTOR y ADMIN lo ven */}
                            {canDeleteDocs && (
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-9 h-7 p-0 bg-background text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 border-red-100 dark:border-red-900/30">
                                    <Trash2 size={12} />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle><AlertDialogDescription>Se eliminará permanentemente "{file.name}".</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(file.id)} className="bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            )}
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