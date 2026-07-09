"use client"

import React, { useState } from "react"
import { FileText, Loader2, Plus, Printer, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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

  // --- REGLAS DE ROLES ---
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN" 

  const { clinicalNotes, isLoading, refetch } = useGetClinicalNotes({ patientId })
  const { createClinicalNote, isLoading: isCreating } = useCreateClinicalNote()
  const { patient } = useGetPatient(patientId)

  // Estados estructurales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [profSignature, setProfSignature] = useState<string | null>(null)
  const [patientSignature, setPatientSignature] = useState<string | null>(null)

  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)

  // Filtrado de la línea de tiempo
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
          body: JSON.stringify({ content: noteContent, fileUrl: fileBase64 || null })
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
          type: "EVOLUTION", content: noteContent, authorId: currentUser?.id, patientId,
          fileUrl: fileBase64 || undefined, professionalSignature: profSignature || undefined, patientSignature: patientSignature || undefined,
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
    setEditingId(note.id); setNoteContent(note.content)
    setFileBase64(note.fileUrl || null); setFileName(note.fileUrl ? "Imagen adjunta previa" : null)
    setProfSignature(note.professionalSignature || null); setPatientSignature(note.patientSignature || null)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setEditingId(null); setNoteContent(""); setFileBase64(null)
    setFileName(null); setProfSignature(null); setPatientSignature(null)
  }

  return (
    <div className="animate-in fade-in duration-300 relative">
      
      {/* CSS E IMPRESIÓN */}
      <style>{`
        @media print {
          aside, nav, header, footer, .print-hidden, [class*="sidebar"], [class*="menu"] { display: none !important; }
          main, body, [class*="main-content"] { width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .watermark-container { display: flex !important; position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; justify-content: center; align-items: center; z-index: -1; pointer-events: none; opacity: 0.15; }
          .watermark-img { width: 500px; grayscale: 100%; }
          @page { size: auto; margin: 1.5cm; }
        }
      `}</style>

      <div className="hidden print:flex watermark-container"><img src="/logosn.png" alt="Watermark" className="watermark-img" /></div>

      {/* LIGHTBOX DE IMÁGENES */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
          <DialogTitle className="sr-only">Visualizador</DialogTitle>
          {previewImage && <img src={previewImage} alt="Ampliado" className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl bg-black/40" />}
        </DialogContent>
      </Dialog>

      {/* ALERT ELIMINAR */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-background border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-red-600 dark:text-red-500 flex items-center gap-2">Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">¿Estás seguro? Esta acción es permanente e irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-background border-border rounded-xl" disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-red-600 hover:bg-red-700 text-white rounded-xl" disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* COMPONENTE MODAL DE FORMULARIO */}
      <EvolutionModal 
        isOpen={isModalOpen} onOpenChange={setIsModalOpen} editingId={editingId}
        noteContent={noteContent} setNoteContent={setNoteContent} fileBase64={fileBase64}
        setFileBase64={setFileBase64} fileName={fileName} setFileName={setFileName}
        setProfSignature={setProfSignature} setPatientSignature={setPatientSignature}
        onSave={handleSaveEvolution} isWorking={isCreating || isSavingEdit} handleImageUpload={handleImageUpload}
      />

      {/* BARRA SUPERIOR CONTROLADORA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20 print-hidden">
        <div>
          <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
            Evoluciones
            {!canEditClinicalData && (
              <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md border border-slate-200 tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[250px] lg:w-[300px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por doctor o palabra..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background border-border text-sm focus-visible:ring-[#008bcd] w-full rounded-xl h-10" />
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            {/* BOTÓN NUEVO: Oculto para Recepcionista */}
            {canEditClinicalData && (
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-10">
                <Plus className="w-4 h-4 mr-1" /> Nueva Evolución
              </Button>
            )}
            <Button onClick={() => window.print()} variant="outline" size="icon" className="bg-background border-border text-foreground hover:bg-accent shrink-0 rounded-xl h-10 w-10">
              <Printer className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ENCABEZADO DE IMPRESIÓN */}
      <div className="hidden print:block mb-10 w-full">
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#008bcd] pb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">REPORTE DE EVOLUCIÓN CLÍNICA</h1>
          <div className="text-right text-[#008bcd]">
            <h3 className="text-xl font-black tracking-tight">CARMODENTAL</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm text-black mb-8 border border-slate-200 rounded-lg p-6 bg-slate-50/50">
          <div className="space-y-1">
            <h4 className="font-bold text-xs mb-2 uppercase text-[#008bcd] border-b border-slate-200 pb-1">Datos del Paciente</h4>
            <p><span className="font-bold">Paciente:</span> {patientFullName}</p>
            <p><span className="font-bold">Identificación:</span> {patientDocId}</p>
            <p><span className="font-bold">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs mb-2 uppercase text-[#008bcd] border-b border-slate-200 pb-1">Datos del Profesional</h4>
            <p><span className="font-bold">Doctor:</span> {currentUser?.name || "Especialista"}</p>
            <p><span className="font-bold">Especialidad:</span> {currentUser?.specialty || "Odontología"}</p>
            <p><span className="font-bold">Fecha Emisión:</span> {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-10 min-h-[400px] print:border-none print:shadow-none print:p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#008bcd]"><Loader2 className="h-10 w-10 animate-spin" /></div>
        ) : evolutionNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-medium text-lg text-foreground">Sin registros clínicos</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent print:before:hidden print:space-y-6">
            {evolutionNotes.map((note: any) => (
              <EvolutionCard 
                key={note.id} 
                note={note} 
                canEdit={canEditClinicalData}
                canDelete={canDeleteData} // Pasas la prop aquí
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