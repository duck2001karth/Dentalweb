"use client"

import React, { useState } from "react"
import { 
  Stethoscope, FileText, Loader2, Plus, Printer, 
  Search, Trash2, CheckCircle2 
} from "lucide-react"
import { useSession } from "next-auth/react"
import { differenceInYears } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

import { useGetClinicalNotes, useCreateClinicalNote } from "@/hooks/clinical-notes"
import { useGetPatient } from "@/hooks/patients"
import { EvolutionCard } from "@/components/patients-file/evolutions/evolutions-card"
import { EvolutionModal } from "@/components/patients-file/evolutions/evolutions-modal"
import { EvolutionsPrint } from "@/components/patients-file/evolutions/evolutions-print"

const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return "--"
  try {
    return differenceInYears(new Date(), new Date(birthDateString))
  } catch {
    return "--"
  }
}

export function EvolucionesTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN" 

  const { clinicalNotes = [], isLoading, refetch } = useGetClinicalNotes({ patientId })
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
  const [status, setStatus] = useState<string>("IN_PROGRESS")
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [profSignature, setProfSignature] = useState<string | null>(null)
  const [patientSignature, setPatientSignature] = useState<string | null>(null)

  const patientFullName = patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)

  const evolutionNotes = clinicalNotes
    .filter((n: any) => {
      if (n.type !== "EVOLUTION") return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          n.content?.toLowerCase().includes(term) || 
          n.author?.name?.toLowerCase().includes(term)
        )
      }
      return true
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast({ title: "Error", description: "El límite de imagen es 5MB.", variant: "destructive" })
      }
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
        
        toast({ 
          title: "Evolución actualizada correctamente",
          description: "Los cambios clínicos han sido guardados en el expediente.",
          variant: "success",
        })
        setIsModalOpen(false)
        resetForm()
        refetch()
      } catch (error) {
        toast({ 
          title: "Error al actualizar", 
          description: "No se pudo guardar los cambios en la evolución.", 
          variant: "destructive" 
        })
      } finally { 
        setIsSavingEdit(false) 
      }
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
            toast({ 
              title: "Evolución registrada correctamente",
              description: "La nueva nota clínica fue incorporada al historial del paciente.",
              variant: "success",
            })
            setIsModalOpen(false)
            resetForm()
            refetch()
          },
          onError: () => toast({ 
            title: "Error al guardar", 
            description: "No se pudo registrar la evolución en la base de datos.", 
            variant: "destructive" 
          })
        }
      )
    }
  }

  const confirmDelete = async () => {
    if (!deleteId || !canDeleteData) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clinical-notes/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ 
        title: "Evolución eliminada",
        description: "El registro ha sido removido del historial clínico."
      })
      refetch()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el registro.", variant: "destructive" })
    } finally { 
      setIsDeleting(false)
      setDeleteId(null) 
    }
  }

  const openEditModal = (note: any) => {
    setEditingId(note.id)
    setNoteContent(note.content)
    setStatus(note.status || "IN_PROGRESS")
    setFileBase64(note.fileUrl || null)
    setFileName(note.fileUrl ? "Imagen adjunta previa" : null)
    setProfSignature(note.professionalSignature || null)
    setPatientSignature(note.patientSignature || null)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setNoteContent("")
    setStatus("IN_PROGRESS")
    setFileBase64(null)
    setFileName(null)
    setProfSignature(null)
    setPatientSignature(null)
  }

  return (
    <div className="animate-in fade-in duration-300 relative space-y-6">

      {/* COMPONENTE EXCLUSIVO DE IMPRESIÓN OFICIAL */}
      <EvolutionsPrint 
        evolutionNotes={evolutionNotes}
        patientFullName={patientFullName}
        patientAge={patientAge}
        patientDocId={patientDocId}
        doctorName={currentUser?.name || "Dr. Especialista"}
        doctorSpecialty={currentUser?.specialty || "Odontología General"}
      />

      {/* LIGHTBOX DE IMÁGENES */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
          <DialogTitle className="sr-only">Visualizador</DialogTitle>
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Ampliado" 
              className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl bg-black/60 border border-white/20" 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMACIÓN ELIMINAR */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/80 rounded-[24px] shadow-2xl sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-destructive font-bold flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2 text-xs font-medium">
              ¿Estás seguro de eliminar esta evolución? Esta acción anulará el registro clínico de la línea de tiempo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="border-border/80 rounded-xl font-bold hover:bg-muted text-xs cursor-pointer" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirmDelete(); }} 
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold text-xs cursor-pointer" 
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE EVOLUCIÓN */}
      <EvolutionModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        editingId={editingId}
        noteContent={noteContent} 
        setNoteContent={setNoteContent} 
        status={status} 
        setStatus={setStatus} 
        fileBase64={fileBase64} 
        setFileBase64={setFileBase64} 
        fileName={fileName} 
        setFileName={setFileName}
        setProfSignature={setProfSignature} 
        setPatientSignature={setPatientSignature}
        onSave={handleSaveEvolution} 
        isWorking={isCreating || isSavingEdit} 
        handleImageUpload={handleImageUpload}
      />
      
      {/* CABECERA SUPERIOR PREMIUM (CON ICONO ESTILO ANAMNESIS) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#008bcd]" /> Evoluciones Clínicas
            </h2>
            {!canEditClinicalData && (
              <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border/80 tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Línea de tiempo de procedimientos, evolución y progreso terapéutico del paciente.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar evolución..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9 bg-background border-border/80 text-xs font-medium focus-visible:ring-[#008bcd] w-full rounded-xl h-10" 
            />
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            {canEditClinicalData && (
              <Button 
                onClick={() => { resetForm(); setIsModalOpen(true); }} 
                className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-10 font-bold px-4 text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nueva Evolución
              </Button>
            )}
            <Button 
              onClick={() => window.print()} 
              variant="outline" 
              size="icon"
              className="bg-background border-border/80 text-foreground hover:bg-accent shrink-0 rounded-xl h-10 w-10 font-bold cursor-pointer transition-all"
              title="Imprimir Evoluciones"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ÁREA DE EVOLUCIONES */}
      <div className="print:hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#008bcd]">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="font-semibold text-xs text-muted-foreground">Cargando evoluciones clínicas...</p>
          </div>
        ) : evolutionNotes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl text-muted-foreground bg-card shadow-xs">
            <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/80">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-bold text-base text-foreground">Sin evoluciones registradas</p>
            <p className="text-xs mt-1">Presiona "Nueva Evolución" para añadir una nueva entrada clínica.</p>
          </div>
        ) : (
          <div className="space-y-4">
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