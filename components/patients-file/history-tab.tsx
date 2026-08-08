"use client"

import React, { useState } from "react"
import { Printer, Image as ImageIcon, FileText, Loader2, Pill, Plus, ChevronDown, Check, UploadCloud, Save, Trash2, Search, PenTool, X } from "lucide-react"
import { isThisMonth } from "date-fns"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import { useGetClinicalNotes, useCreateClinicalNote } from "@/hooks/clinical-notes"
import { HistorialPrint } from "./history-print"
import { HistoryCard } from "@/components/patients-file/history-card"
import { SignaturePad } from "@/components/patients-file/signature-pad" 

// IMPORTAMOS LOS ESTADOS
import { treatmentStatuses, documentStatuses } from "@/constants/status"

export function HistorialTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN" 

  const { clinicalNotes, isLoading, refetch } = useGetClinicalNotes({ patientId })
  const { createClinicalNote, isLoading: isCreating } = useCreateClinicalNote()
  
  const [monthFilter, setMonthFilter] = useState("todos")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [noteType, setNoteType] = useState<"EVOLUTION" | "PRESCRIPTION" | "GENERAL">("EVOLUTION")
  const [noteContent, setNoteContent] = useState("")
  const [noteStatus, setNoteStatus] = useState<string>(treatmentStatuses.IN_PROGRESS.value)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [profSignature, setProfSignature] = useState<string | null>(null)
  const [patientSignature, setPatientSignature] = useState<string | null>(null)
  const filteredNotes = clinicalNotes?.filter((note: any) => {
    if (monthFilter === "actual" && !isThisMonth(new Date(note.createdAt))) return false
    if (typeFilter === "evoluciones" && note.type !== "EVOLUTION") return false
    if (typeFilter === "recetas" && note.type !== "PRESCRIPTION") return false
    if (typeFilter === "otros" && note.type !== "GENERAL") return false
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const contentMatch = note.content?.toLowerCase().includes(term);
      const authorMatch = note.author?.name?.toLowerCase().includes(term);
      if (!contentMatch && !authorMatch) return false;
    }
    return true
  }) || []

  const sortedNotes = filteredNotes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast({ title: "Archivo muy grande", description: "El límite es 5MB.", variant: "destructive" });
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
        if(!noteContent) setNoteContent(`Documento adjunto: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim() && !fileBase64) return
    if (!canEditClinicalData) return toast({ title: "Acceso denegado", variant: "destructive" })

    if (editingId) {
      setIsSavingEdit(true)
      try {
        const res = await fetch(`/api/clinical-notes/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: noteContent, status: noteStatus, fileUrl: fileBase64 || null, professionalSignature: profSignature || null, patientSignature: patientSignature || null })
        });
        if (!res.ok) throw new Error()
        toast({ title: "Registro actualizado", variant: "success" })
        setIsNoteModalOpen(false); resetForm(); refetch()
      } catch (error) { toast({ title: "Error al actualizar", variant: "destructive" }) } finally { setIsSavingEdit(false) }
    } else {
      createClinicalNote(
        { type: noteType, content: noteContent, status: noteStatus, authorId: currentUser?.id, patientId, fileUrl: fileBase64 || undefined, professionalSignature: profSignature || undefined, patientSignature: patientSignature || undefined } as any, 
        { onSuccess: () => { toast({ title: "Registro guardado", variant: "success" }); setIsNoteModalOpen(false); resetForm(); refetch() },
          onError: () => toast({ title: "Error al guardar", variant: "destructive" }) }
      )
    }
  }

  const confirmDelete = async () => {
    if (!deleteId || !canEditClinicalData) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clinical-notes/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Registro eliminado", variant: "success" }); refetch();
    } catch (error) { toast({ title: "Error al eliminar", variant: "destructive" }); } finally { setIsDeleting(false); setDeleteId(null); }
  }

  const handleAclarar = async (noteId: string) => {
    if (!canEditClinicalData) return;
    try {
      const res = await fetch(`/api/clinical-notes/${noteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isSigned: true }) })
      if (!res.ok) throw new Error()
      toast({ title: "Evolución aclarada", variant: "success" }); refetch() 
    } catch (error) { toast({ title: "Error al actualizar", variant: "destructive" }) }
  }

  const openModal = (type: "EVOLUTION" | "PRESCRIPTION" | "GENERAL") => {
    if (!canEditClinicalData) return;
    resetForm(); 
    setNoteType(type); 
    setNoteStatus(type === "EVOLUTION" ? treatmentStatuses.IN_PROGRESS.value : documentStatuses.COMPLETED.value);
    setIsNoteModalOpen(true)
  }

  const openEditModal = (note: any) => {
    if (!canEditClinicalData) return;
    setEditingId(note.id); 
    setNoteType(note.type); 
    setNoteContent(note.content); 
    // RECUPERAMOS EL ESTADO EXISTENTE
    setNoteStatus(note.status || (note.type === "EVOLUTION" ? treatmentStatuses.IN_PROGRESS.value : documentStatuses.COMPLETED.value));
    setFileBase64(note.fileUrl || null); 
    setFileName(note.fileUrl ? "Imagen previa" : null); 
    setProfSignature(note.professionalSignature || null); 
    setPatientSignature(note.patientSignature || null); 
    setIsNoteModalOpen(true);
  }

  const resetForm = () => { 
    setEditingId(null); 
    setNoteContent(""); 
    setNoteStatus(treatmentStatuses.IN_PROGRESS.value);
    setFileBase64(null); 
    setFileName(null); 
    setProfSignature(null); 
    setPatientSignature(null) 
  }

  const isWorking = isCreating || isSavingEdit;

  // Lógica para elegir qué diccionario de estados usar en el Select
  const currentStatusDictionary = noteType === "EVOLUTION" ? treatmentStatuses : documentStatuses;

  return (
    <>
      <div className="animate-in fade-in duration-300 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-10 print:hidden">
        
        {/* LIGHTBOX Y DIALOGOS DE CONFIRMACIÓN */}
        <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-[90vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
            <DialogTitle className="sr-only">Visualizador</DialogTitle>
            {previewImage && <img src={previewImage} alt="Documento" className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl bg-black/50" />}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-background border-border rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2"><Trash2 className="w-6 h-6" /> Eliminar Registro</AlertDialogTitle>
              <AlertDialogDescription>¿Estás seguro de eliminar este registro del historial? Esta acción es permanente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-red-600 hover:bg-red-700 text-white rounded-xl" disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* MODAL DEL FORMULARIO DE HISTORIAL */}
        <Dialog open={isNoteModalOpen} onOpenChange={(val) => { setIsNoteModalOpen(val); if(!val) resetForm(); }}>
          <DialogContent className="sm:max-w-[700px] bg-background border-border max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                {noteType === "EVOLUTION" ? <FileText className="w-5 h-5 text-[#008bcd]" /> : 
                 noteType === "PRESCRIPTION" ? <Pill className="w-5 h-5 text-purple-600" /> : 
                 <ImageIcon className="w-5 h-5 text-teal-600" />}
                {editingId ? "Editar Registro" : noteType === "EVOLUTION" ? "Agregar Nueva Evolución" : noteType === "PRESCRIPTION" ? "Emitir Receta Médica" : "Subir Documento"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">Registra de manera segura la actividad clínica del paciente.</DialogDescription>
            </DialogHeader>
            
            <div className="py-2 space-y-5">
              {/* SELECTOR DE ESTADO */}
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Estado del Registro</Label>
                <Select value={noteStatus} onValueChange={setNoteStatus}>
                  <SelectTrigger className="h-11 bg-background border-border rounded-xl">
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(currentStatusDictionary).map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                          <span className={`font-bold ${s.color}`}>{s.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {noteType === "GENERAL" && !editingId && (
                <div className="relative border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <input type="file" onChange={handleFileUpload} accept="image/*,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {fileBase64 ? (
                    <div className="flex flex-col items-center">
                      <Check className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="font-semibold text-foreground">Archivo listo: {fileName}</p>
                    </div>
                  ) : (
                    <><UploadCloud className="w-10 h-10 text-muted-foreground mb-3" /><p className="font-semibold text-foreground">Haz clic para subir un archivo</p></>
                  )}
                </div>
              )}

              {(noteType !== "GENERAL" || editingId) && (
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">{noteType === "GENERAL" ? "Descripción" : `Detalle ${noteType === "EVOLUTION" ? "clínico" : "y dosificación"}`}</Label>
                  <textarea 
                    value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-[#008bcd]"
                  />
                </div>
              )}

              {noteType !== "GENERAL" && (
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Adjuntar imagen (Opcional)</Label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Button variant="outline" className="relative border-dashed border-2 hover:bg-muted/50 rounded-xl">
                      <input type="file" onChange={handleFileUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                      <UploadCloud className="w-4 h-4 mr-2" /> {fileName ? 'Cambiar imagen' : 'Seleccionar'}
                    </Button>
                    {fileBase64 && (
                      <div className="flex items-center gap-2 bg-muted/50 p-1.5 pr-3 rounded-xl border border-border">
                        <img src={fileBase64} alt="Preview" className="w-8 h-8 object-cover rounded shadow-sm" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{fileName}</span>
                        <button type="button" onClick={() => {setFileBase64(null); setFileName(null);}} className="text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {noteType === "EVOLUTION" && !editingId && (
                <div className="pt-4 border-t border-border">
                  <Label className="text-foreground font-semibold mb-3 flex items-center gap-2"><PenTool className="w-4 h-4 text-[#008bcd]" /> Firmas Digitales</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SignaturePad label="Firma del Profesional" onSign={setProfSignature} onClear={() => setProfSignature(null)} />
                    <SignaturePad label="Firma del Paciente" onSign={setPatientSignature} onClear={() => setPatientSignature(null)} />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setIsNoteModalOpen(false)} className="rounded-xl border-border">Cancelar</Button>
              <Button onClick={handleSaveNote} disabled={isWorking || (noteType !== "GENERAL" && !noteContent.trim()) || (noteType === "GENERAL" && !fileBase64 && !editingId)} className="bg-[#008bcd] text-white rounded-xl font-bold">
                {isWorking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {editingId ? "Actualizar" : "Guardar Registro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FILTROS Y CABECERA (VISTA PRINCIPAL) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full lg:w-auto">
            <div>
              <h2 className="text-2xl font-light text-foreground mr-2">Historial Clínico</h2>
              {!canEditClinicalData && <span className="text-[10px] font-bold tracking-widest bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md mt-1 inline-block">MODO LECTURA</span>}
            </div>
            
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Buscar doctor o palabra..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background border-border text-sm focus-visible:ring-[#008bcd] w-full h-10 rounded-xl" />
            </div>

            <div className="flex items-center gap-2">
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-background border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:ring-[#008bcd] h-10">
                <option value="todos">Todos los meses</option><option value="actual">Mes actual</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-background border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:ring-[#008bcd] h-10">
                <option value="todos">Todos los tipos</option><option value="evoluciones">Evoluciones</option><option value="recetas">Recetas</option><option value="otros">Documentos</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0">
            {canEditClinicalData && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-10 flex-1 md:flex-none font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Nuevo Registro <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1 border-border shadow-2xl rounded-xl bg-card">
                  <button onClick={() => openModal("EVOLUTION")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-blue-500/10 hover:text-[#008bcd] rounded-lg transition-colors"><FileText size={16} /> Agregar Evolución</button>
                  <div className="h-px bg-border my-0.5 mx-2"></div>
                  <button onClick={() => openModal("PRESCRIPTION")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-purple-500/10 hover:text-purple-600 rounded-lg transition-colors"><Pill size={16} /> Emitir Receta</button>
                  <div className="h-px bg-border my-0.5 mx-2"></div>
                  <button onClick={() => openModal("GENERAL")} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-teal-500/10 hover:text-teal-600 rounded-lg transition-colors"><ImageIcon size={16} /> Subir Documento/Rx</button>
                </PopoverContent>
              </Popover>
            )}
            <Button onClick={() => window.print()} variant="outline" size="icon" className="bg-background border-border text-foreground hover:bg-accent shrink-0 rounded-xl h-10 w-10">
              <Printer className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* TIMELINE RENDER */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#008bcd]" /></div>
        ) : (
          <div className="relative pl-4 md:pl-0">
            <div className="absolute left-[8px] md:left-[120px] top-0 bottom-0 w-1 bg-border rounded-full"></div>
            {sortedNotes.length === 0 ? (
              <div className="ml-8 md:ml-12 p-10 text-center border border-dashed border-border rounded-2xl text-muted-foreground bg-card shadow-sm">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-foreground">Historial en blanco</p>
                <p className="text-sm">No hay registros clínicos {searchTerm && "para tu búsqueda"}.</p>
              </div>
            ) : (
              sortedNotes.map((note: any) => (
                <HistoryCard 
                  key={note.id} 
                  note={note} 
                  canEdit={canEditClinicalData}
                  canDelete={canDeleteData} 
                  onEdit={openEditModal} 
                  onDelete={setDeleteId} 
                  onAclarar={handleAclarar} 
                  onPreviewImage={setPreviewImage} 
                />
              ))
            )}
          </div>
        )}
      </div>
      <HistorialPrint patientId={patientId} notes={sortedNotes} doctorName={currentUser?.name || "Especialista"} doctorSpecialty={currentUser?.specialty || "Odontología"} />
    </>
  )
}