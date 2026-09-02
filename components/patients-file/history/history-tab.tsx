"use client"

import React, { useState } from "react"
import { Printer, Image as ImageIcon, FileText, Loader2, Pill, Plus, ChevronDown, Trash2, Search, FileClock } from "lucide-react"
import { isThisMonth } from "date-fns"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import { useGetClinicalNotes, useCreateClinicalNote } from "@/hooks/clinical-notes"
import { HistorialPrint } from "./history-print"
import { HistoryCard } from "@/components/patients-file/history/history-card"
import { EvolutionModal } from "@/components/patients-file/evolutions/evolutions-modal"
import { QuickDocumentModal } from "@/components/patients-file/history/history-modal"
import { QuickPrescriptionModal } from "@/components/patients-file/history/history-pmodal"

export function HistorialTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN" 

  const { clinicalNotes = [], isLoading, refetch } = useGetClinicalNotes({ patientId })
  const { createClinicalNote, isLoading: isCreating } = useCreateClinicalNote()

  const [monthFilter, setMonthFilter] = useState("todos")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false)
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false)
  const [isDocumentOpen, setIsDocumentOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [status, setStatus] = useState<string>("IN_PROGRESS")
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [profSignature, setProfSignature] = useState<string | null>(null)
  const [patientSignature, setPatientSignature] = useState<string | null>(null)
  const [selectedNoteForModal, setSelectedNoteForModal] = useState<any>(null)

  const filteredNotes = clinicalNotes.filter((note: any) => {
    if (monthFilter === "actual" && !isThisMonth(new Date(note.createdAt))) return false
    if (typeFilter === "evoluciones" && note.type !== "EVOLUTION") return false
    if (typeFilter === "recetas" && note.type !== "PRESCRIPTION") return false
    if (typeFilter === "otros" && note.type !== "GENERAL") return false
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return note.content?.toLowerCase().includes(term) || note.author?.name?.toLowerCase().includes(term)
    }
    return true
  })

  const sortedNotes = [...filteredNotes].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast({ title: "Error", description: "El límite es 5MB.", variant: "destructive" })
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => setFileBase64(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSaveEvolution = async () => {
    if (!noteContent.trim()) return

    if (editingId) {
      setIsSavingEdit(true)
      try {
        const res = await fetch(`/api/clinical-notes/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: noteContent, status, fileUrl: fileBase64 || null })
        })
        if (!res.ok) throw new Error()
        toast({ title: "Evolución actualizada" })
        setIsEvolutionOpen(false)
        resetEvolutionForm()
        refetch()
      } catch (error) {
        toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
      } finally { setIsSavingEdit(false) }
    } else {
      createClinicalNote(
        {
          type: "EVOLUTION", 
          content: noteContent, 
          status, 
          authorId: currentUser?.id, 
          patientId,
          fileUrl: fileBase64 || undefined, 
          professionalSignature: profSignature || undefined, 
          patientSignature: patientSignature || undefined,
        } as any,
        {
          onSuccess: () => {
            toast({ title: "Evolución registrada" })
            setIsEvolutionOpen(false)
            resetEvolutionForm()
            refetch()
          },
          onError: () => toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" })
        }
      )
    }
  }

  const resetEvolutionForm = () => {
    setEditingId(null)
    setNoteContent("")
    setStatus("IN_PROGRESS")
    setFileBase64(null)
    setFileName(null)
    setProfSignature(null)
    setPatientSignature(null)
  }

  const confirmDelete = async () => {
    if (!deleteId || !canEditClinicalData) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clinical-notes/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Registro eliminado" })
      refetch()
    } catch (error) { 
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally { 
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleAclarar = async (noteId: string) => {
    if (!canEditClinicalData) return
    try {
      const res = await fetch(`/api/clinical-notes/${noteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isSigned: true }) })
      toast({ title: "Evolución aclarada" })
      refetch() 
    } catch (error) { toast({ title: "Error al actualizar", variant: "destructive" }) }
  }

  const openEditModal = (note: any) => {
    setSelectedNoteForModal(note)
    if (note.type === "EVOLUTION") {
      setEditingId(note.id)
      setNoteContent(note.content)
      setStatus(note.status || "IN_PROGRESS")
      setFileBase64(note.fileUrl || null)
      setFileName(note.fileUrl ? "Imagen adjunta previa" : null)
      setProfSignature(note.professionalSignature || null)
      setPatientSignature(note.patientSignature || null)
      setIsEvolutionOpen(true)
    } else if (note.type === "PRESCRIPTION") {
      setIsPrescriptionOpen(true)
    } else {
      setIsDocumentOpen(true)
    }
  }

  return (
    <>
      <div className="animate-in fade-in duration-300 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-10 print:hidden">
        
        {/* LIGHTBOX */}
        <Dialog open={!!previewImage} onOpenChange={(open: boolean) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-[90vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
            <DialogTitle className="sr-only">Visualizador</DialogTitle>
            {previewImage && <img src={previewImage} alt="Documento" className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl bg-black/60 border border-white/10" />}
          </DialogContent>
        </Dialog>

        {/* ALERTA DE ELIMINACIÓN */}
        <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-card border-border/80 rounded-[24px] shadow-2xl sm:max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-destructive font-bold flex items-center gap-2">
                <Trash2 className="w-6 h-6" /> Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription className="font-medium text-xs text-muted-foreground">
                ¿Estás seguro de eliminar este registro del historial? Esta acción anulará el bloque clínico permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-border/80 font-bold hover:bg-muted text-xs cursor-pointer">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold text-xs cursor-pointer" disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CABECERA Y FILTROS */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-5 bg-card p-5 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <FileClock className="w-5 h-5 text-[#008bcd]" /> Historial Clínico
              </h2>
              {!canEditClinicalData && (
                <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border/80 tracking-wider">
                  SÓLO LECTURA
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Línea de tiempo integral de procedimientos, recetas y documentos del paciente.
            </p>
          </div>

          {/* Filtros y Acciones */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border/80 text-xs font-medium focus-visible:ring-[#008bcd] w-full h-10 rounded-xl"
              />
            </div>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl bg-background border-border/80 text-xs font-semibold">
                <SelectValue placeholder="Meses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/80">
                <SelectItem value="todos" className="text-xs font-medium cursor-pointer">Todos los meses</SelectItem>
                <SelectItem value="actual" className="text-xs font-medium cursor-pointer">Mes actual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl bg-background border-border/80 text-xs font-semibold">
                <SelectValue placeholder="Tipos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/80">
                <SelectItem value="todos" className="text-xs font-medium cursor-pointer">Todos los tipos</SelectItem>
                <SelectItem value="evoluciones" className="text-xs font-medium cursor-pointer">Evoluciones</SelectItem>
                <SelectItem value="recetas" className="text-xs font-medium cursor-pointer">Recetas Médicas</SelectItem>
                <SelectItem value="otros" className="text-xs font-medium cursor-pointer">Documentos / Rx</SelectItem>
              </SelectContent>
            </Select>

            {canEditClinicalData && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-10 px-4 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer">
                    <Plus className="w-4 h-4" /> Nuevo Registro <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1.5 border-border/80 shadow-2xl rounded-2xl bg-card">
                  <button
                    type="button"
                    onClick={() => { resetEvolutionForm(); setIsEvolutionOpen(true); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold hover:bg-[#008bcd]/10 text-foreground hover:text-[#008bcd] rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#008bcd]" /> Agregar Evolución
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedNoteForModal(null); setIsPrescriptionOpen(true); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold hover:bg-purple-500/10 text-foreground hover:text-purple-500 rounded-xl transition-colors cursor-pointer"
                  >
                    <Pill className="w-4 h-4 text-purple-500" /> Emitir Receta
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedNoteForModal(null); setIsDocumentOpen(true); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold hover:bg-teal-500/10 text-foreground hover:text-teal-500 rounded-xl transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-teal-500" /> Subir Documento / Rx
                  </button>
                </PopoverContent>
              </Popover>
            )}

            <Button
              type="button"
              onClick={() => window.print()}
              variant="outline"
              size="icon"
              className="bg-background border-border/80 text-foreground hover:bg-accent shrink-0 rounded-xl h-10 w-10 font-bold cursor-pointer transition-all"
              title="Imprimir Historial Clínico"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* TIMELINE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#008bcd]">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="font-semibold text-xs text-muted-foreground">Cargando historial clínico...</p>
          </div>
        ) : (
          <div className="relative pl-4 md:pl-0">
            <div className="absolute left-[8px] md:left-[120px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-border via-border/80 to-transparent"></div>
            
            {sortedNotes.length === 0 ? (
              <div className="ml-8 md:ml-12 p-12 text-center border border-dashed border-border/80 rounded-2xl text-muted-foreground bg-card shadow-xs">
                <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/80">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-base text-foreground">Historial sin registros</p>
                <p className="text-xs mt-1">No hay anotaciones clínicas registradas {searchTerm && "para tu búsqueda"}.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedNotes.map((note: any) => (
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RENDERIZADO OCULTO PARA IMPRESIÓN OFICIAL */}
      <HistorialPrint 
        patientId={patientId} 
        notes={sortedNotes} 
        doctorName={currentUser?.name || "Especialista"} 
        doctorSpecialty={currentUser?.specialty || "Odontología"} 
      />

      {/* 1. Modal Evolución */}
      <EvolutionModal 
        isOpen={isEvolutionOpen}
        onOpenChange={setIsEvolutionOpen}
        editingId={editingId}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        fileBase64={fileBase64}
        setFileBase64={setFileBase64}
        fileName={fileName}
        setFileName={setFileName}
        setProfSignature={setProfSignature}
        setPatientSignature={setPatientSignature}
        onSave={handleSaveEvolution}
        isWorking={isCreating || isSavingEdit}
        handleImageUpload={handleImageUpload}
        status={status}
        setStatus={setStatus}
      />

      {/* 2. Modal Receta */}
      <QuickPrescriptionModal 
        isOpen={isPrescriptionOpen}
        onOpenChange={setIsPrescriptionOpen}
        patientId={patientId}
        authorId={currentUser?.id}
        editingNote={selectedNoteForModal}
        onSuccess={() => { refetch(); }}
      />

      {/* 3. Modal Documento/Rx */}
      <QuickDocumentModal 
        isOpen={isDocumentOpen}
        onOpenChange={setIsDocumentOpen}
        patientId={patientId}
        authorId={currentUser?.id}
        editingNote={selectedNoteForModal}
        onSuccess={() => { refetch(); }}
      />
    </>
  )
}