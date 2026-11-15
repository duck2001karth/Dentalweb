"use client"

import React, { useState, useEffect } from "react"
import { FileText, Loader2, Trash2 } from "lucide-react"
import { isThisMonth, format } from "date-fns"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useGetClinicalNotes, useCreateClinicalNote } from "@/hooks/clinical-notes"
import { useGetPatient } from "@/hooks/patients"
import { printHistorialSheet } from "@/components/patients-file/history/history-print"
import { useClinicSettings } from "@/config/clinic-settings"
import { HistoryCard } from "@/components/patients-file/history/history-card"
import { EvolutionModal } from "@/components/patients-file/evolutions/evolutions-modal"
import { QuickDocumentModal } from "@/components/patients-file/history/history-modal"
import { QuickPrescriptionModal } from "@/components/patients-file/history/history-pmodal"
import { HistoryToolbar } from "@/components/patients-file/history/history-toolbar"

const getTodayDateString = () => {
  return format(new Date(), "yyyy-MM-dd")
}

export function HistorialTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN"

  const { patient, isLoading: isPatientLoading } = useGetPatient(patientId)
  const { clinicalNotes = [], isLoading, refetch } = useGetClinicalNotes({ patientId })
  const { createClinicalNote, isLoading: isCreating } = useCreateClinicalNote()
  const { settings } = useClinicSettings()

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
  const [entryDate, setEntryDate] = useState(getTodayDateString())
  const [status, setStatus] = useState<string>("IN_PROGRESS")
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [patientSignature, setPatientSignature] = useState<string | null>(null)
  const [selectedNoteForModal, setSelectedNoteForModal] = useState<any>(null)

  const [doctorCreds, setDoctorCreds] = useState<{
    signature: string | null
    license: string
    name: string
    specialty: string
  }>({
    signature: null,
    license: "",
    name: "Dr. Especialista",
    specialty: "Odontología General",
  })

 const fetchDoctorSignature = async () => {
  const fallbackName = currentUser?.name
    ? `Dr. ${currentUser.name.replace(/^Dr\.\s*/i, "")}`
    : "Dr. Especialista"
  const fallbackLicense = currentUser?.professionalCard || currentUser?.licenseNumber || currentUser?.license || ""
  const fallbackSpecialty = currentUser?.specialty || "Ortodoncia"
  const fallbackSignature = currentUser?.signatureBase64 || currentUser?.signature || null

  try {
    const res = await fetch("/api/users/signature")
    if (res.ok) {
      const data = await res.json()
      setDoctorCreds({
        signature: data.signatureBase64 || data.signature || fallbackSignature,
        license: data.professionalCard || data.licenseNumber || data.license || fallbackLicense,
        name: currentUser?.name ? `Dr. ${currentUser.name.replace(/^Dr\.\s*/i, "")}` : fallbackName,
        specialty: data.specialty || fallbackSpecialty,
      })
      return
    }
  } catch (err) {
    console.error("Error al obtener firma:", err)
  }

  setDoctorCreds({
    signature: fallbackSignature,
    license: fallbackLicense,
    name: fallbackName,
    specialty: fallbackSpecialty,
  })
}

useEffect(() => {
  if (currentUser) {
    fetchDoctorSignature()
  }
}, [currentUser])

  const filteredNotes = clinicalNotes.filter((note: any) => {
    if (monthFilter === "actual" && !isThisMonth(new Date(note.date || note.createdAt))) return false
    if (typeFilter === "evoluciones" && note.type !== "EVOLUTION") return false
    if (typeFilter === "recetas" && note.type !== "PRESCRIPTION") return false
    if (typeFilter === "otros" && note.type !== "GENERAL") return false

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        note.content?.toLowerCase().includes(term) ||
        note.author?.name?.toLowerCase().includes(term)
      )
    }
    return true
  })

  const sortedNotes = [...filteredNotes].sort(
    (a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
  )

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast({
          title: "Error",
          description: "El límite es 5MB.",
          variant: "destructive",
        })
      }
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => setFileBase64(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handlePrintHistorial = async () => {
    if (!patient) {
      return toast({
        title: "Cargando datos...",
        description: "Espere a que se cargue la ficha del paciente para imprimir.",
        variant: "destructive",
      })
    }

    let signature = doctorCreds.signature || currentUser?.signatureBase64 || null
    let license = doctorCreds.license || currentUser?.professionalCard || currentUser?.licenseNumber || ""

    if (!signature) {
      try {
        const res = await fetch("/api/users/signature")
        if (res.ok) {
          const creds = await res.json()
          if (creds?.signatureBase64) signature = creds.signatureBase64
          if (creds?.professionalCard) license = creds.professionalCard
        }
      } catch {}
    }

    printHistorialSheet({
      patient,
      notes: sortedNotes,
      doctorName: doctorCreds.name,
      doctorSpecialty: doctorCreds.specialty,
      doctorLicense: license,
      doctorSignature: signature,
      settings,
    })
  }

  const handleSaveEvolution = async () => {
    if (!noteContent.trim()) return

    const selectedDateObj = new Date(`${entryDate}T12:00:00`)
    const isoDate = selectedDateObj.toISOString()

    if (editingId) {
      setIsSavingEdit(true)
      try {
        const res = await fetch(`/api/clinical-notes/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: noteContent,
            status,
            fileUrl: fileBase64 || null,
            createdAt: isoDate,
            date: isoDate,
          }),
        })
        if (!res.ok) throw new Error()
        toast({ title: "Evolución actualizada" })
        setIsEvolutionOpen(false)
        resetEvolutionForm()
        refetch()
      } catch {
        toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
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
          professionalSignature: doctorCreds.signature || undefined,
          patientSignature: patientSignature || undefined,
          createdAt: isoDate,
          date: isoDate,
        } as any,
        {
          onSuccess: () => {
            toast({ title: "Evolución registrada" })
            setIsEvolutionOpen(false)
            resetEvolutionForm()
            refetch()
          },
          onError: () =>
            toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" }),
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
    setPatientSignature(null)
    setEntryDate(getTodayDateString())
  }

  const confirmDelete = async () => {
    if (!deleteId || !canEditClinicalData) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clinical-notes/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Registro eliminado" })
      refetch()
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleAclarar = async (noteId: string) => {
    if (!canEditClinicalData) return
    try {
      await fetch(`/api/clinical-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSigned: true }),
      })
      toast({ title: "Evolución aclarada" })
      refetch()
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" })
    }
  }

  const openEditModal = (note: any) => {
    setSelectedNoteForModal(note)
    if (note.type === "EVOLUTION") {
      setEditingId(note.id)
      setNoteContent(note.content)
      setStatus(note.status || "IN_PROGRESS")
      setFileBase64(note.fileUrl || null)
      setFileName(note.fileUrl ? "Imagen adjunta previa" : null)
      setPatientSignature(note.patientSignature || null)

      const rawDate = note.date || note.createdAt
      if (rawDate) {
        setEntryDate(format(new Date(rawDate), "yyyy-MM-dd"))
      } else {
        setEntryDate(getTodayDateString())
      }

      fetchDoctorSignature()
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
            {previewImage && (
              <img
                src={previewImage}
                alt="Documento"
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl bg-black/60 border border-white/10"
              />
            )}
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
              <AlertDialogCancel
                disabled={isDeleting}
                className="rounded-xl border-border/80 font-bold hover:bg-muted text-xs cursor-pointer"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  confirmDelete()
                }}
                className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold text-xs cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CABECERA Y FILTROS: componente visual separado */}
        <HistoryToolbar
          canEditClinicalData={canEditClinicalData}
          isPatientLoading={isPatientLoading}
          hasPatient={Boolean(patient)}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          monthFilter={monthFilter}
          onMonthFilterChange={setMonthFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onNewEvolution={() => {
            resetEvolutionForm()
            void fetchDoctorSignature()
            setIsEvolutionOpen(true)
          }}
          onNewPrescription={() => {
            setSelectedNoteForModal(null)
            setIsPrescriptionOpen(true)
          }}
          onNewDocument={() => {
            setSelectedNoteForModal(null)
            setIsDocumentOpen(true)
          }}
          onPrint={() => void handlePrintHistorial()}
        />

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

      {/* 1. Modal Evolución */}
      <EvolutionModal
        isOpen={isEvolutionOpen}
        onOpenChange={setIsEvolutionOpen}
        editingId={editingId}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        entryDate={entryDate}
        setEntryDate={setEntryDate}
        fileBase64={fileBase64}
        setFileBase64={setFileBase64}
        fileName={fileName}
        setFileName={setFileName}
        patientSignature={patientSignature}
        setPatientSignature={setPatientSignature}
        doctorSignature={doctorCreds.signature}
        doctorName={doctorCreds.name}
        doctorSpecialty={doctorCreds.specialty}
        doctorLicense={doctorCreds.license}
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
        onSuccess={() => {
          refetch()
        }}
      />

      {/* 3. Modal Documento/Rx */}
      <QuickDocumentModal
        isOpen={isDocumentOpen}
        onOpenChange={setIsDocumentOpen}
        patientId={patientId}
        authorId={currentUser?.id}
        editingNote={selectedNoteForModal}
        onSuccess={() => {
          refetch()
        }}
      />
    </>
  )
}