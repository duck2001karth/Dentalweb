"use client"

import React, { useState } from "react"
import { FileText, Loader2, Plus, Printer, Search } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

import { useGetClinicalNotes, useCreateClinicalNote } from "@/hooks/clinical-notes"
import { useGetPatient } from "@/hooks/patients"
import { EvolutionCard } from "@/components/patients-file/evolutions-card"
import { EvolutionModal } from "@/components/patients-file/evolutions-modal"
import { EvolutionsPrint } from "@/components/patients-file/evolutions-print"

import { treatmentStatuses } from "@/constants/status"

const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export function EvolucionesTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN" 

  const { clinicalNotes, isLoading, refetch } = useGetClinicalNotes({ patientId })
  const { createClinicalNote, isLoading: isCreating } = useCreateClinicalNote()
  const { patient } = useGetPatient(patientId)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [noteContent, setNoteContent] = useState("")
  const [status, setStatus] = useState<string>(treatmentStatuses.IN_PROGRESS.value)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [profSignature, setProfSignature] = useState<string | null>(null)
  const [patientSignature, setPatientSignature] = useState<string | null>(null)

  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)

  const evolutionNotes = clinicalNotes?.filter((n: any) => {
    if (n.type !== "EVOLUTION") return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return n.content.toLowerCase().includes(term) || n.author?.name?.toLowerCase().includes(term)
    }
    return true
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []

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
          body: JSON.stringify({ content: noteContent, status: status, fileUrl: fileBase64 || null })
        })
        if (!res.ok) throw new Error()
        toast({ title: "Evolución actualizada", variant: "success" })
        setIsModalOpen(false)
        resetForm()
        refetch()
      } catch (error) {
        toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
      } finally { setIsSavingEdit(false) }
    } else {
      createClinicalNote(
        {
          type: "EVOLUTION", 
          content: noteContent, 
          status: status, 
          authorId: currentUser?.id, 
          patientId,
          fileUrl: fileBase64 || undefined, 
          professionalSignature: profSignature || undefined, 
          patientSignature: patientSignature || undefined,
        } as any,
        {
          onSuccess: () => {
            toast({ title: "Evolución registrada", variant: "success" })
            setIsModalOpen(false); resetForm(); refetch()
          },
          onError: () => toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" })
        }
      )
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clinical-notes/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Evolución eliminada", variant: "success" })
      refetch()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
    } finally { setIsDeleting(false); setDeleteId(null) }
  }

  const openEditModal = (note: any) => {
    setEditingId(note.id); 
    setNoteContent(note.content);
    setStatus(note.status || treatmentStatuses.IN_PROGRESS.value); 
    setFileBase64(note.fileUrl || null); 
    setFileName(note.fileUrl ? "Imagen adjunta previa" : null);
    setProfSignature(note.professionalSignature || null); 
    setPatientSignature(note.patientSignature || null);
    setIsModalOpen(true);
  }

  const resetForm = () => {
    setEditingId(null); 
    setNoteContent(""); 
    setStatus(treatmentStatuses.IN_PROGRESS.value);
    setFileBase64(null);
    setFileName(null); 
    setProfSignature(null); 
    setPatientSignature(null);
  }

  return (
    <div className="animate-in fade-in duration-300 relative">

      {/* COMPONENTE EXCLUSIVO DE IMPRESIÓN */}
      <EvolutionsPrint 
        evolutionNotes={evolutionNotes}
        patientFullName={patientFullName}
        patientAge={patientAge}
        patientDocId={patientDocId}
        doctorName={currentUser?.name || "Dr. Profesional"}
        doctorSpecialty={currentUser?.specialty || "Especialista Odontológico"}
      />

      {/* VISUALIZADOR DE IMÁGENES */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
          <DialogTitle className="sr-only">Visualizador</DialogTitle>
          {previewImage && <img src={previewImage} alt="Ampliado" className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl bg-black/40 border border-white/20" />}
        </DialogContent>
      </Dialog>

      {/* CONFIRMACIÓN ELIMINAR */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-red-600 dark:text-red-500 font-bold">Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2 font-medium">¿Estás seguro? Esta acción anulará el registro clínico de la línea de tiempo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border rounded-xl font-bold hover:bg-muted" disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold" disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EvolutionModal 
        isOpen={isModalOpen} onOpenChange={setIsModalOpen} editingId={editingId}
        noteContent={noteContent} setNoteContent={setNoteContent} 
        status={status} setStatus={setStatus} 
        fileBase64={fileBase64} setFileBase64={setFileBase64} 
        fileName={fileName} setFileName={setFileName}
        setProfSignature={setProfSignature} setPatientSignature={setPatientSignature}
        onSave={handleSaveEvolution} isWorking={isCreating || isSavingEdit} handleImageUpload={handleImageUpload}
      />
      
      {/*CABECERA SUPERIOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-0 z-20">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Evoluciones Clínicas
            {!canEditClinicalData && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">Línea de tiempo de procedimientos y progreso del paciente.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[250px] lg:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="text" placeholder="Buscar notas clínicas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background border-border font-medium focus-visible:ring-[#008bcd] w-full rounded-xl h-11" />
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            {canEditClinicalData && (
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-11 font-bold px-5 shadow-xs">
                <Plus className="w-4 h-4 mr-2" /> Nueva Evolución
              </Button>
            )}
            <Button onClick={() => window.print()} variant="outline" className="bg-background border-border text-foreground hover:bg-accent shrink-0 rounded-xl h-11 px-4 font-bold">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/*  ÁREA DE EVOLUCIONES */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-10 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#008bcd]">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="font-semibold text-muted-foreground">Cargando evoluciones...</p>
          </div>
        ) : evolutionNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mb-4 border border-border/80">
              <FileText className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="font-bold text-lg text-foreground">Sin registros clínicos</p>
            <p className="text-sm mt-1">Presiona "Nueva Evolución" para registrar el progreso.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-border before:via-border/80 before:to-transparent">
            {evolutionNotes.map((note: any) => (
              <EvolutionCard 
                key={note.id} 
                note={note} 
                canEdit={canEditClinicalData}
                canDelete={canDeleteData} 
                onEdit={openEditModal} 
                onDelete={setDeleteId} 
                onPreviewImage={setPreviewImage} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}